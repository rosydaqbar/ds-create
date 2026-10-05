package design.system.showcase

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import design.system.components.DsEmphasis
import design.system.components.parts.DsButton
import design.system.icons.DsIcon
import design.system.icons.DsIcons
import design.system.theme.DsTheme
import design.system.tokens.DsBorderWidth
import design.system.tokens.DsRadius
import design.system.tokens.DsSpace
import design.system.tokens.DsTextStyles
import design.system.tokens.DsSizes

/*
 * Small building blocks for the showcase screens, drawn from the same tokens as the library.
 * Some stand in for parts the template doesn't build yet (Divider 2.16, Badge 2.4); swap them for the
 * real components once they exist, so the showcase is made of the system itself.
 */

/** Text in a system style, with the brand font applied. */
@Composable
fun ShowText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = DsTextStyles.bodyMdRegular,
    color: Color = DsTheme.colors.textSecondary,
) {
    BasicText(text = text, modifier = modifier, style = DsTheme.textStyle(style), color = { color })
}

/** A screen: optional back button, eyebrow, title, then scrolling content. */
@Composable
fun ScreenScaffold(
    title: String,
    eyebrow: String? = null,
    onBack: (() -> Unit)? = null,
    content: LazyListScope.() -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        if (onBack != null) {
            Row(Modifier.padding(horizontal = DsSpace.md)) {
                DsButton(
                    label = "Back",
                    onClick = onBack,
                    emphasis = DsEmphasis.Tertiary,
                    leadingIcon = DsIcons.ArrowLeft,
                    iconOnly = true,
                )
            }
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = DsSizes.containerMarginMobile, vertical = DsSpace.xl),
            verticalArrangement = Arrangement.spacedBy(DsSpace.xl),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(DsSpace.xs)) {
                    if (eyebrow != null) ShowText(eyebrow, style = DsTextStyles.bodySmMedium, color = DsTheme.colors.textTertiary)
                    ShowText(
                        title,
                        modifier = Modifier.semantics { heading() },
                        style = DsTextStyles.headingLgSemibold,
                        color = DsTheme.colors.textPrimary,
                    )
                }
            }
            content()
        }
    }
}

@Composable
fun SectionHeading(text: String) {
    ShowText(
        text,
        modifier = Modifier.padding(top = DsSpace.md).semantics { heading() },
        style = DsTextStyles.headingSmSemibold,
        color = DsTheme.colors.textPrimary,
    )
}

/** Body copy. Blank lines in [text] start a new paragraph. */
@Composable
fun Paragraph(text: String) {
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.md)) {
        text.split("\n\n").forEach { ShowText(it) }
    }
}

@Composable
fun BulletList(items: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(DsSpace.sm)) {
        items.forEach { line ->
            Row(horizontalArrangement = Arrangement.spacedBy(DsSpace.md)) {
                ShowText("•")
                ShowText(line)
            }
        }
    }
}

/** A framed area where live components render. */
@Composable
fun PreviewFrame(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val shape = RoundedCornerShape(DsRadius.surface)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(DsTheme.colors.surfaceBase, shape)
            .border(DsBorderWidth.default, DsTheme.colors.borderSubtle, shape)
            .padding(DsSpace.xl),
        contentAlignment = Alignment.Center,
    ) { content() }
}

/** Code in the monospace style, scrolling sideways instead of wrapping. */
@Composable
fun CodeBlock(code: String) {
    val shape = RoundedCornerShape(DsRadius.sm)
    Box(
        Modifier
            .fillMaxWidth()
            .background(DsTheme.colors.surfaceSunken, shape)
            .horizontalScroll(rememberScrollState())
            .padding(DsSpace.lg),
    ) {
        ShowText(code, style = DsTextStyles.codeSmRegular, color = DsTheme.colors.textPrimary)
    }
}

/** Stand-in for Badge (2.4): a small outlined label such as a status. */
@Composable
fun StatusLabel(text: String) {
    val shape = RoundedCornerShape(DsRadius.full)
    ShowText(
        text,
        modifier = Modifier
            .border(DsBorderWidth.default, DsTheme.colors.borderDefault, shape)
            .padding(horizontal = DsSpace.md, vertical = DsSpace.xxs),
        style = DsTextStyles.bodyXsMedium,
        color = DsTheme.colors.textSecondary,
    )
}

/** Stand-in for Divider (2.16). */
@Composable
fun ShowDivider() {
    Box(Modifier.fillMaxWidth().height(DsBorderWidth.default).background(DsTheme.colors.borderSubtle))
}

/** A row that opens another screen. */
@Composable
fun NavRow(title: String, subtitle: String? = null, onClick: () -> Unit) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val shape = RoundedCornerShape(DsRadius.control)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = DsSizes.controlXl)
            .background(if (pressed) DsTheme.colors.surfaceBasePressed else DsTheme.colors.surfaceBase, shape)
            .border(DsBorderWidth.default, DsTheme.colors.borderSubtle, shape)
            .clickable(interactionSource = source, indication = null, role = Role.Button, onClick = onClick)
            .padding(horizontal = DsSpace.xl, vertical = DsSpace.lg),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(DsSpace.lg),
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(DsSpace.xxs)) {
            ShowText(title, style = DsTextStyles.bodyMdMedium, color = DsTheme.colors.textPrimary)
            if (subtitle != null) ShowText(subtitle, style = DsTextStyles.bodySmRegular, color = DsTheme.colors.textTertiary)
        }
        DsIcon(DsIcons.ChevronRight, tint = DsTheme.colors.iconTertiary)
    }
}
