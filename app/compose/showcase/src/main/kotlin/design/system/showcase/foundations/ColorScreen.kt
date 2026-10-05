package design.system.showcase.foundations

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import design.system.showcase.Paragraph
import design.system.showcase.ScreenScaffold
import design.system.showcase.SectionHeading
import design.system.showcase.ShowText
import design.system.theme.DsTheme
import design.system.tokens.DsBorderWidth
import design.system.tokens.DsColors
import design.system.tokens.DsRadius
import design.system.tokens.DsSpace
import design.system.tokens.DsTextStyles
import java.util.Locale
import design.system.tokens.DsSizes

/** What a role is checked against: text needs 4.5:1, UI parts like borders and icons need 3:1 (WCAG AA). */
private enum class PairKind(val minimum: Double, val label: String) {
    Text(4.5, "text"),
    Ui(3.0, "UI"),
    Exempt(0.0, "exempt"),
}

/**
 * A color role, the color it's measured against, and which minimum applies. Surfaces and fills are
 * backgrounds ([roleIsBackground]): their sample shows the paired text on top of them.
 */
private class Swatch(
    val name: String,
    val color: (DsColors) -> Color,
    val on: (DsColors) -> Color,
    val onName: String,
    val kind: PairKind,
    val roleIsBackground: Boolean = false,
)

private class SwatchGroup(val title: String, val intro: String, val swatches: List<Swatch>)

// A5: extend with every role the page spec (1.1 Color) documents, and the palettes.
private val groups = listOf(
    SwatchGroup(
        "Text",
        "Text roles, measured on the base surface.",
        listOf(
            Swatch("color/text/primary", { it.textPrimary }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/secondary", { it.textSecondary }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/tertiary", { it.textTertiary }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/placeholder", { it.textPlaceholder }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/disabled", { it.textDisabled }, { it.surfaceBase }, "surface/base", PairKind.Exempt),
            Swatch("color/text/brand", { it.textBrand }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/danger", { it.textDanger }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/warning", { it.textWarning }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/success", { it.textSuccess }, { it.surfaceBase }, "surface/base", PairKind.Text),
            Swatch("color/text/info", { it.textInfo }, { it.surfaceBase }, "surface/base", PairKind.Text),
        ),
    ),
    SwatchGroup(
        "Surfaces",
        "Backgrounds for screens and containers, measured with primary text on top.",
        listOf(
            Swatch("color/surface/base", { it.surfaceBase }, { it.textPrimary }, "text/primary", PairKind.Text, roleIsBackground = true),
            Swatch("color/surface/sunken", { it.surfaceSunken }, { it.textPrimary }, "text/primary", PairKind.Text, roleIsBackground = true),
            Swatch("color/surface/raised", { it.surfaceRaised }, { it.textPrimary }, "text/primary", PairKind.Text, roleIsBackground = true),
            Swatch("color/surface/overlay", { it.surfaceOverlay }, { it.textPrimary }, "text/primary", PairKind.Text, roleIsBackground = true),
            Swatch("color/surface/brand/subtle", { it.surfaceBrandSubtle }, { it.textPrimary }, "text/primary", PairKind.Text, roleIsBackground = true),
        ),
    ),
    SwatchGroup(
        "Solid fills",
        "Strong fills for primary actions and status, measured with on-solid text on top.",
        listOf(
            Swatch("color/fill/brand/solid", { it.fillBrandSolid }, { it.textOnSolid }, "text/on-solid", PairKind.Text, roleIsBackground = true),
            Swatch("color/fill/neutral/solid", { it.fillNeutralSolid }, { it.textOnSolid }, "text/on-solid", PairKind.Text, roleIsBackground = true),
            Swatch("color/fill/danger/solid", { it.fillDangerSolid }, { it.textOnSolid }, "text/on-solid", PairKind.Text, roleIsBackground = true),
            Swatch("color/fill/success/solid", { it.fillSuccessSolid }, { it.textOnSolid }, "text/on-solid", PairKind.Text, roleIsBackground = true),
            Swatch("color/fill/info/solid", { it.fillInfoSolid }, { it.textOnSolid }, "text/on-solid", PairKind.Text, roleIsBackground = true),
        ),
    ),
    SwatchGroup(
        "Borders",
        "Outlines and the focus ring, measured on the base surface. Subtle borders are decorative and don’t need 3:1.",
        listOf(
            Swatch("color/border/subtle", { it.borderSubtle }, { it.surfaceBase }, "surface/base", PairKind.Exempt),
            Swatch("color/border/default", { it.borderDefault }, { it.surfaceBase }, "surface/base", PairKind.Exempt),
            Swatch("color/border/strong", { it.borderStrong }, { it.surfaceBase }, "surface/base", PairKind.Ui),
            Swatch("color/border/brand", { it.borderBrand }, { it.surfaceBase }, "surface/base", PairKind.Ui),
            Swatch("color/border/focus", { it.borderFocus }, { it.surfaceBase }, "surface/base", PairKind.Ui),
        ),
    ),
)

/** 1.1 Color: live swatches from the active mode, each with its contrast ratio. */
@Composable
fun ColorScreen(onBack: () -> Unit) {
    val mode = if (DsTheme.isDark) "Dark" else "Light"
    ScreenScaffold(title = "Color", eyebrow = "Foundations › 1.1", onBack = onBack) {
        item {
            Paragraph(
                "Every color here is a role, not a raw value, so it changes with the mode. " +
                    "You’re looking at $mode. Switch the mode at the bottom to check the other one.",
            )
        }
        groups.forEach { group ->
            item { SectionHeading(group.title) }
            item { Paragraph(group.intro) }
            items(group.swatches, key = { it.name }) { SwatchRow(it) }
        }
    }
}

@Composable
private fun SwatchRow(swatch: Swatch) {
    val colors = DsTheme.colors
    val color = swatch.color(colors)
    val on = swatch.on(colors)
    val background = if (swatch.roleIsBackground) color else on
    val foreground = if (swatch.roleIsBackground) on else color
    val ratio = contrast(foreground, background)
    val verdict = when {
        swatch.kind == PairKind.Exempt -> "No minimum"
        ratio >= swatch.kind.minimum -> "Passes AA for ${swatch.kind.label}"
        else -> "Below AA for ${swatch.kind.label}"
    }
    val ratioText = String.format(Locale.US, "%.2f:1", ratio)
    val shape = RoundedCornerShape(DsRadius.control)
    Row(
        // One announcement per swatch instead of five separate fragments.
        modifier = Modifier.semantics(mergeDescendants = true) {},
        horizontalArrangement = Arrangement.spacedBy(DsSpace.lg),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(DsSizes.avatarLg)
                .background(background, shape)
                .border(DsBorderWidth.default, colors.borderSubtle, shape)
                .clearAndSetSemantics { contentDescription = "Sample of ${swatch.name} with ${swatch.onName}" },
            contentAlignment = Alignment.Center,
        ) {
            if (swatch.name.startsWith("color/border/")) {
                Box(Modifier.size(DsSizes.iconLg).border(DsBorderWidth.strong, foreground, RoundedCornerShape(DsRadius.xs)))
            } else {
                ShowText("Aa", style = DsTextStyles.bodyMdSemibold, color = foreground)
            }
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(DsSpace.xxs)) {
            ShowText(swatch.name, style = DsTextStyles.codeSmMedium, color = colors.textPrimary)
            ShowText("${hex(color)} with ${swatch.onName}", style = DsTextStyles.codeSmRegular, color = colors.textTertiary)
            ShowText("$ratioText · $verdict", style = DsTextStyles.bodySmRegular, color = colors.textSecondary)
        }
    }
}

/** WCAG contrast ratio; a translucent color is first composited over what it sits on. */
private fun contrast(foreground: Color, background: Color): Double {
    val fg = foreground.compositeOver(background).luminance().toDouble()
    val bg = background.luminance().toDouble()
    val (light, dark) = if (fg > bg) fg to bg else bg to fg
    return (light + 0.05) / (dark + 0.05)
}

private fun hex(color: Color): String {
    val argb = color.toArgb()
    val rgb = String.format(Locale.US, "#%06X", argb and 0xFFFFFF)
    val alpha = (argb ushr 24) and 0xFF
    return if (alpha == 0xFF) rgb else "$rgb, ${alpha * 100 / 255}% opacity"
}
