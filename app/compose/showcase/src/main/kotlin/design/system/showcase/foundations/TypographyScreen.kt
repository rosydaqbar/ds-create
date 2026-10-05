package design.system.showcase.foundations

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import design.system.showcase.Paragraph
import design.system.showcase.ScreenScaffold
import design.system.showcase.ShowDivider
import design.system.showcase.ShowText
import design.system.theme.DsTheme
import design.system.tokens.DsSpace
import design.system.tokens.DsTextStyles
import java.util.Locale

private class TypeSample(val name: String, val style: TextStyle)

// A5: list every text style the 1.2 Typography page documents, in the same order.
private val samples = listOf(
    TypeSample("type/display/lg/semibold", DsTextStyles.displayLgSemibold),
    TypeSample("type/display/md/semibold", DsTextStyles.displayMdSemibold),
    TypeSample("type/display/sm/semibold", DsTextStyles.displaySmSemibold),
    TypeSample("type/heading/xl/semibold", DsTextStyles.headingXlSemibold),
    TypeSample("type/heading/lg/semibold", DsTextStyles.headingLgSemibold),
    TypeSample("type/heading/md/semibold", DsTextStyles.headingMdSemibold),
    TypeSample("type/heading/sm/semibold", DsTextStyles.headingSmSemibold),
    TypeSample("type/heading/xs/semibold", DsTextStyles.headingXsSemibold),
    TypeSample("type/body/xl/regular", DsTextStyles.bodyXlRegular),
    TypeSample("type/body/lg/regular", DsTextStyles.bodyLgRegular),
    TypeSample("type/body/md/regular", DsTextStyles.bodyMdRegular),
    TypeSample("type/body/md/semibold", DsTextStyles.bodyMdSemibold),
    TypeSample("type/body/sm/regular", DsTextStyles.bodySmRegular),
    TypeSample("type/body/sm/semibold", DsTextStyles.bodySmSemibold),
    TypeSample("type/body/xs/regular", DsTextStyles.bodyXsRegular),
    TypeSample("type/code/md/regular", DsTextStyles.codeMdRegular),
    TypeSample("type/code/sm/regular", DsTextStyles.codeSmRegular),
)

/** 1.2 Typography: every text style at the current text size. */
@Composable
fun TypographyScreen(onBack: () -> Unit) {
    val scale = LocalDensity.current.fontScale
    val percent = String.format(Locale.US, "%.0f%%", scale * 100)
    ScreenScaffold(title = "Typography", eyebrow = "Foundations › 1.2", onBack = onBack) {
        item {
            Paragraph(
                "Every style scales with the system text size, so people who need larger text get it everywhere. " +
                    "You’re seeing the scale at $percent. Change the text size at the bottom to check the largest one.",
            )
        }
        items(samples, key = { it.name }) { sample ->
            Column(verticalArrangement = Arrangement.spacedBy(DsSpace.xs)) {
                ShowText("Clear words help people act.", style = sample.style, color = DsTheme.colors.textPrimary)
                ShowText(sample.name, style = DsTextStyles.codeSmMedium, color = DsTheme.colors.textSecondary)
                ShowText(metrics(sample.style, scale), style = DsTextStyles.bodyXsRegular, color = DsTheme.colors.textTertiary)
                ShowDivider()
            }
        }
    }
}

/** "16 / 24 sp · weight 400", plus the size on screen when the text size isn't 100%. */
private fun metrics(style: TextStyle, scale: Float): String {
    val size = style.fontSize.value
    val line = style.lineHeight.value
    val weight = style.fontWeight?.weight?.toString() ?: "default"
    val base = String.format(Locale.US, "%.0f / %.0f sp · weight %s", size, line, weight)
    return if (scale == 1f) base else base + String.format(Locale.US, " · %.1f dp on screen", size * scale)
}
