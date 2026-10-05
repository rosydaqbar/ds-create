@file:OptIn(ExperimentalLayoutApi::class)

package design.system.showcase

import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import design.system.components.DsEmphasis
import design.system.components.DsSize
import design.system.components.parts.DsButton
import design.system.icons.DsIcons
import design.system.showcase.docs.ComponentDoc
import design.system.showcase.docs.DocMatrix
import design.system.showcase.docs.DoDont
import design.system.showcase.docs.Playground
import design.system.showcase.docs.PlaygroundControl
import design.system.showcase.docs.PlaygroundValues
import design.system.showcase.docs.defaultValue
import design.system.theme.DsTheme
import design.system.theme.dsMinimumTouchTarget
import design.system.tokens.DsBorderWidth
import design.system.tokens.DsComponent
import design.system.tokens.DsRadius
import design.system.tokens.DsSpace
import design.system.tokens.DsTextStyles

/** The tabs keep the web explorer's names (COPY-GUIDE terminology). */
private enum class DocTab(val label: String) {
    Overview("Overview"),
    Component("Component"),
    Anatomy("Anatomy"),
    Guidelines("Guidelines"),
    Code("Code"),
}

/** One screen per component, driven entirely by its [ComponentDoc] (APP.md §7). */
@Composable
fun ComponentScreen(doc: ComponentDoc, onBack: () -> Unit) {
    var tab by rememberSaveable(doc.id) { mutableStateOf(DocTab.Overview) }
    ScreenScaffold(title = doc.name, eyebrow = "${doc.level.label} › ${doc.id}", onBack = onBack) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(DsSpace.md)) {
                Row(horizontalArrangement = Arrangement.spacedBy(DsSpace.md), verticalAlignment = Alignment.CenterVertically) {
                    StatusLabel(doc.status.label)
                    ShowText("Since ${doc.since}", style = DsTextStyles.bodySmRegular, color = DsTheme.colors.textTertiary)
                }
                Paragraph(doc.summary)
            }
        }
        item { DocTabs(selected = tab, onSelect = { tab = it }) }
        when (tab) {
            DocTab.Overview -> overview(doc)
            DocTab.Component -> component(doc)
            DocTab.Anatomy -> anatomy(doc)
            DocTab.Guidelines -> guidelines(doc)
            DocTab.Code -> code(doc)
        }
    }
}

/* ---------- Overview: hero and examples in use ---------- */

private fun LazyListScope.overview(doc: ComponentDoc) {
    item { PreviewFrame { doc.hero() } }
    item { SectionHeading("Examples") }
    items(doc.examples, key = { it.title }) { example ->
        Column(verticalArrangement = Arrangement.spacedBy(DsSpace.md)) {
            ShowText(example.title, style = DsTextStyles.headingXsSemibold, color = DsTheme.colors.textPrimary)
            PreviewFrame { example.render() }
            ShowText(example.caption, style = DsTextStyles.bodySmRegular)
        }
    }
    item { SectionHeading("When to use") }
    item { BulletList(doc.whenToUse.use) }
    item { SectionHeading("When not to use") }
    item { BulletList(doc.whenToUse.dont) }
}

/* ---------- Component: playground and every variant ---------- */

private fun LazyListScope.component(doc: ComponentDoc) {
    item { SectionHeading("Playground") }
    item { PlaygroundBlock(doc.playground) }
    item { SectionHeading("Variants") }
    item { Paragraph("Every Figma variant, laid out like the Figma Component page. Scroll sideways to see every state.") }
    items(doc.matrices, key = { it.title }) { MatrixBlock(it) }
}

@Composable
private fun PlaygroundBlock(playground: Playground) {
    val values = remember(playground) {
        mutableStateMapOf<String, Any?>().apply { playground.controls.forEach { put(it.name, it.defaultValue) } }
    }
    val current = PlaygroundValues(values)
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.xl)) {
        PreviewFrame { playground.render(current) }
        playground.controls.forEach { control ->
            ControlRow(control, values[control.name]) { values[control.name] = it }
        }
        CodeBlock(playground.code(current))
    }
}

/*
 * Playground controls are made of the system's own components. Until Text field (3.2), Button group
 * (3.1) and Switch (2.9) are built, buttons and a token-styled BasicTextField stand in; swap them at A4.
 */
@Composable
private fun ControlRow(control: PlaygroundControl, value: Any?, onChange: (Any?) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.sm)) {
        Row(horizontalArrangement = Arrangement.spacedBy(DsSpace.md)) {
            ShowText(control.name, style = DsTextStyles.codeSmMedium, color = DsTheme.colors.textPrimary)
            control.figma?.let { ShowText("Figma: $it", style = DsTextStyles.bodyXsRegular, color = DsTheme.colors.textTertiary) }
        }
        when (control) {
            is PlaygroundControl.Text -> TextInput(value as String, onChange)
            is PlaygroundControl.Choice -> FlowRow(horizontalArrangement = Arrangement.spacedBy(DsSpace.sm)) {
                control.options.forEach { option ->
                    DsButton(
                        label = option,
                        onClick = { onChange(option) },
                        size = DsSize.Sm,
                        emphasis = if (option == value) DsEmphasis.Primary else DsEmphasis.Secondary,
                    )
                }
            }
            is PlaygroundControl.Toggle -> {
                val on = value as Boolean
                DsButton(
                    label = if (on) "On" else "Off",
                    onClick = { onChange(!on) },
                    size = DsSize.Sm,
                    emphasis = DsEmphasis.Secondary,
                    leadingIcon = if (on) DsIcons.Check else null,
                )
            }
            is PlaygroundControl.Icon -> FlowRow(horizontalArrangement = Arrangement.spacedBy(DsSpace.sm)) {
                DsButton(
                    label = "None",
                    onClick = { onChange(null) },
                    size = DsSize.Sm,
                    emphasis = if (value == null) DsEmphasis.Primary else DsEmphasis.Secondary,
                )
                DsIcons.byName.forEach { (name, icon) ->
                    DsButton(
                        label = name,
                        onClick = { onChange(name) },
                        size = DsSize.Sm,
                        emphasis = if (value == name) DsEmphasis.Primary else DsEmphasis.Secondary,
                        leadingIcon = icon,
                        iconOnly = true,
                    )
                }
            }
        }
    }
}

@Composable
private fun TextInput(value: String, onChange: (String) -> Unit) {
    val shape = RoundedCornerShape(DsRadius.control)
    BasicTextField(
        value = value,
        onValueChange = onChange,
        singleLine = true,
        textStyle = DsTheme.textStyle(DsTextStyles.bodyMdRegular).copy(color = DsTheme.colors.textPrimary),
        cursorBrush = SolidColor(DsTheme.colors.textBrand),
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = design.system.tokens.DsSizes.controlMd)
            .border(DsBorderWidth.default, DsTheme.colors.borderDefault, shape)
            .padding(horizontal = DsComponent.textControlPaddingXMd),
        decorationBox = { inner -> Box(contentAlignment = Alignment.CenterStart) { inner() } },
    )
}

@Composable
private fun MatrixBlock(matrix: DocMatrix) {
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.md)) {
        ShowText(matrix.title, style = DsTextStyles.codeSmMedium, color = DsTheme.colors.textPrimary)
        Box(Modifier.horizontalScroll(rememberScrollState())) {
            Grid(columns = matrix.cols.size + 1, gap = DsSpace.lg) {
                AxisLabel("${matrix.rowProp} / ${matrix.colProp}")
                matrix.cols.forEach { AxisLabel(it) }
                matrix.rows.forEach { row ->
                    AxisLabel(row)
                    matrix.cols.forEach { col -> matrix.cell(row, col) }
                }
            }
        }
    }
}

@Composable
private fun AxisLabel(text: String) {
    ShowText(text, style = DsTextStyles.codeSmRegular, color = DsTheme.colors.textTertiary)
}

/** A grid whose columns are as wide as their widest cell, so every row of the matrix lines up. */
@Composable
private fun Grid(columns: Int, gap: Dp, content: @Composable () -> Unit) {
    Layout(content) { measurables, _ ->
        val placeables = measurables.map { it.measure(Constraints()) }
        val rows = placeables.chunked(columns)
        val widths = IntArray(columns) { c -> rows.maxOfOrNull { it.getOrNull(c)?.width ?: 0 } ?: 0 }
        val heights = rows.map { row -> row.maxOf { it.height } }
        val g = gap.roundToPx()
        val width = widths.sum() + g * (columns - 1)
        val height = heights.sum() + g * (rows.size - 1).coerceAtLeast(0)
        layout(width, height) {
            var y = 0
            rows.forEachIndexed { r, row ->
                var x = 0
                row.forEachIndexed { c, p ->
                    p.place(x + (widths[c] - p.width) / 2, y + (heights[r] - p.height) / 2)
                    x += widths[c] + g
                }
                y += heights[r] + g
            }
        }
    }
}

/* ---------- Anatomy: parts, props and the token map ---------- */

private fun LazyListScope.anatomy(doc: ComponentDoc) {
    item { PreviewFrame { doc.anatomy.render() } }
    item { SectionHeading("Parts") }
    items(doc.anatomy.parts.withIndex().toList(), key = { "part-${it.index}" }) { (index, part) ->
        Column(verticalArrangement = Arrangement.spacedBy(DsSpace.xs)) {
            ShowText("${index + 1}  ${part.name}", style = DsTextStyles.bodyMdSemibold, color = DsTheme.colors.textPrimary)
            ShowText(part.description)
            part.tokens.forEach { TokenLine(it) }
        }
    }
    item { SectionHeading("Props") }
    item { Paragraph("Props match the Figma properties.") }
    items(doc.props, key = { "prop-${it.name}" }) { prop ->
        Column(verticalArrangement = Arrangement.spacedBy(DsSpace.xxs)) {
            ShowText("${prop.name}: ${prop.type}" + (prop.default?.let { " = $it" } ?: ""), style = DsTextStyles.codeSmMedium, color = DsTheme.colors.textPrimary)
            prop.figma?.let { ShowText("Figma: $it", style = DsTextStyles.bodyXsRegular, color = DsTheme.colors.textTertiary) }
            ShowText(prop.description, style = DsTextStyles.bodySmRegular)
        }
    }
    item { SectionHeading("Tokens") }
    item { Paragraph("Each Figma variable and the Compose member that carries it.") }
    items(doc.tokens, key = { "token-$it" }) { TokenLine(it) }
}

@Composable
private fun TokenLine(figma: String) {
    Column {
        ShowText(figma, style = DsTextStyles.codeSmRegular, color = DsTheme.colors.textPrimary)
        ShowText(composeTokenName(figma), style = DsTextStyles.codeSmRegular, color = DsTheme.colors.textTertiary)
    }
}

/** The Compose member for a Figma token name, following APP.md §5. */
private fun composeTokenName(figma: String): String {
    val parts = figma.split('/')
    fun camel(p: List<String>) = p.joinToString("-").split('-', ' ').filter { it.isNotEmpty() }
        .mapIndexed { i, w -> if (i == 0) w.lowercase() else w.replaceFirstChar { it.uppercase() } }
        .joinToString("")
    fun member(p: List<String>): String {
        val rest = camel(p.drop(1))
        return if (rest.isEmpty() || rest.first().isDigit()) camel(p) else rest
    }
    return when (parts.first()) {
        "color" -> "DsTheme.colors.${member(parts)}"
        "space" -> "DsSpace.${member(parts)}"
        "size" -> "DsSize.${member(parts)} (tokens)"
        "radius" -> "DsRadius.${member(parts)}"
        "border" -> "DsBorderWidth.${camel(parts.drop(2)).let { if (it == "default") "`default`" else it }}"
        "type" -> "DsTextStyles.${member(parts)}"
        "motion" -> if (parts.getOrNull(1) == "easing") "DsEasing.${member(parts)}" else "DsTheme.motion.${member(parts)}"
        "elevation", "focus" -> "Effect style (not generated for Compose yet)"
        else -> "DsComponent.${camel(parts)}"
    }
}

/* ---------- Guidelines: a short summary, with a link to the full page ---------- */

private fun LazyListScope.guidelines(doc: ComponentDoc) {
    items(doc.guidelines, key = { it.title }) { guideline ->
        Column(verticalArrangement = Arrangement.spacedBy(DsSpace.md)) {
            SectionHeading(guideline.title)
            Paragraph(guideline.body)
            guideline.render?.let { render -> PreviewFrame { render() } }
            guideline.doExample?.let { DoDontBlock("Do", it) }
            guideline.dontExample?.let { DoDontBlock("Don’t", it) }
        }
    }
    item { SectionHeading("Accessibility") }
    item { BulletList(doc.accessibility) }
    if (doc.platformNotes.isNotEmpty()) {
        item { SectionHeading("On Android") }
        item { BulletList(doc.platformNotes) }
    }
    item { FullPageLink(doc) }
}

@Composable
private fun DoDontBlock(verdict: String, example: DoDont) {
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.sm)) {
        PreviewFrame { example.render() }
        ShowText(
            "$verdict: ${example.caption}",
            style = DsTextStyles.bodySmMedium,
            color = if (verdict == "Do") DsTheme.colors.textSuccess else DsTheme.colors.textDanger,
        )
    }
}

@Composable
private fun FullPageLink(doc: ComponentDoc) {
    val base = BuildConfig.DS_DOCS_URL.trimEnd('/')
    val uri = LocalUriHandler.current
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.md)) {
        Paragraph("The full guidelines, with every visual comparison, are on page ${doc.id} ${doc.name} of the Figma file and on the web explorer.")
        if (base.isNotEmpty()) {
            DsButton(
                label = "Read the full page",
                onClick = { uri.openUri("$base/${doc.webPath}") },
                emphasis = DsEmphasis.Secondary,
                trailingIcon = DsIcons.ArrowRight,
            )
        }
    }
}

/* ---------- Code: the snippet for this platform ---------- */

private fun LazyListScope.code(doc: ComponentDoc) {
    item { SectionHeading("Install") }
    item { CodeBlock("dependencies {\n    implementation(\"${BuildConfig.DS_COORDINATES}\")\n}") }
    item { SectionHeading("Import") }
    item { CodeBlock(doc.exports.joinToString("\n") { "import $it" }) }
    item { SectionHeading("Usage") }
    item { CodeBlock(doc.usage) }
    items(doc.examples, key = { "code-${it.title}" }) { example ->
        Column(verticalArrangement = Arrangement.spacedBy(DsSpace.sm)) {
            ShowText(example.title, style = DsTextStyles.headingXsSemibold, color = DsTheme.colors.textPrimary)
            CodeBlock(example.code)
        }
    }
}

/* ---------- tabs ---------- */

@Composable
private fun DocTabs(selected: DocTab, onSelect: (DocTab) -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .selectableGroup(),
        horizontalArrangement = Arrangement.spacedBy(DsSpace.xs),
    ) {
        DocTab.entries.forEach { tab ->
            val isSelected = tab == selected
            val indicator = DsTheme.colors.borderBrand
            Box(
                modifier = Modifier
                    .dsMinimumTouchTarget()
                    .selectable(
                        selected = isSelected,
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        role = Role.Tab,
                        onClick = { onSelect(tab) },
                    )
                    .drawBehind {
                        if (isSelected) {
                            val w = DsBorderWidth.selected.toPx()
                            drawLine(indicator, Offset(0f, size.height - w / 2), Offset(size.width, size.height - w / 2), strokeWidth = w)
                        }
                    }
                    .padding(horizontal = DsSpace.md, vertical = DsSpace.md),
            ) {
                ShowText(
                    tab.label,
                    style = DsTextStyles.bodySmSemibold,
                    color = if (isSelected) DsTheme.colors.textPrimary else DsTheme.colors.textTertiary,
                )
            }
        }
    }
}
