package design.system.icons

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import design.system.tokens.DsSizes

/**
 * System icons by their Figma name (1.7 Iconography): `DsIcons.Check` is `general/check`.
 *
 * Placeholders: these are hand-written 24 × 24 outline glyphs so the template runs. At A3/A4, import
 * the brand's 1.7 icon library instead (SVG → ImageVector with Android Studio's Vector Asset tool,
 * or a generated `ImageVector` file per icon) and keep the same names, so components don't change.
 */
object DsIcons {
    val Check: ImageVector = outline("general/check", "M20 6L9 17L4 12")
    val Plus: ImageVector = outline("general/plus", "M5 12H19", "M12 5V19")
    val Minus: ImageVector = outline("general/minus", "M5 12H19")
    val X: ImageVector = outline("general/x", "M18 6L6 18", "M6 6L18 18")
    val Search: ImageVector = outline("general/search", "M19 11A8 8 0 1 1 3 11A8 8 0 0 1 19 11Z", "M21 21L16.7 16.7")
    val Download: ImageVector = outline("general/download", "M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15", "M7 10L12 15L17 10", "M12 15V3")
    val Upload: ImageVector = outline("general/upload", "M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15", "M17 8L12 3L7 8", "M12 3V15")
    val ArrowRight: ImageVector = outline("arrows/arrow-right", "M5 12H19", "M12 5L19 12L12 19")
    val ArrowLeft: ImageVector = outline("arrows/arrow-left", "M19 12H5", "M12 19L5 12L12 5")
    val ChevronDown: ImageVector = outline("arrows/chevron-down", "M6 9L12 15L18 9")
    val ChevronRight: ImageVector = outline("arrows/chevron-right", "M9 18L15 12L9 6")

    /** Every icon by its Figma name, for pickers (the showcase playground) and data-driven UI. */
    val byName: Map<String, ImageVector> = listOf(
        Check, Plus, Minus, X, Search, Download, Upload, ArrowRight, ArrowLeft, ChevronDown, ChevronRight,
    ).associateBy { it.name }

    fun named(name: String): ImageVector? = byName[name]
}

/**
 * Draws a system icon. Decorative by default: with no [contentDescription] it has no semantics, so
 * TalkBack skips it and the control around it carries the name. Pass a description only when the
 * icon is the only thing that says what something means.
 */
@Composable
fun DsIcon(
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    size: Dp = DsSizes.iconMd,
    contentDescription: String? = null,
) {
    Image(
        imageVector = icon,
        contentDescription = contentDescription,
        modifier = modifier.size(size),
        colorFilter = ColorFilter.tint(tint),
    )
}

/**
 * A 24 × 24 outline glyph on the icon grid. The stroke color is only a mask: [DsIcon] tints every
 * icon with a color token, so no color here ever reaches the screen.
 */
private fun outline(name: String, vararg paths: String): ImageVector =
    ImageVector.Builder(
        name = name,
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f,
    ).apply {
        paths.forEach { d ->
            addPath(
                pathData = addPathNodes(d),
                fill = null,
                stroke = SolidColor(Color.Black),
                strokeLineWidth = 2f,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round,
            )
        }
    }.build()
