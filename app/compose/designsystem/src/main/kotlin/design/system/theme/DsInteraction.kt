package design.system.theme

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.LayoutModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.currentValueOf
import androidx.compose.ui.platform.LocalViewConfiguration
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import design.system.tokens.DsBorderWidth

/**
 * Reserves at least the platform's minimum touch target (48 × 48 dp on Android, from
 * `ViewConfiguration.minimumTouchTargetSize`) around a smaller visual control and centers it.
 * Compose extends the control's pointer bounds into the reserved space, so the whole 48 dp area
 * reacts to touch while the drawn control keeps its Figma size (APP.md §6.2).
 *
 * The same behavior as Material's `minimumInteractiveComponentSize()`, without the Material dependency.
 * Apply it before the visual modifiers (background, clickable) in the chain.
 */
fun Modifier.dsMinimumTouchTarget(): Modifier = this then MinimumTouchTargetElement

private data object MinimumTouchTargetElement : ModifierNodeElement<MinimumTouchTargetNode>() {
    override fun create() = MinimumTouchTargetNode()
    override fun update(node: MinimumTouchTargetNode) = Unit
}

private class MinimumTouchTargetNode : Modifier.Node(), LayoutModifierNode, CompositionLocalConsumerModifierNode {
    override fun MeasureScope.measure(measurable: Measurable, constraints: Constraints): MeasureResult {
        val minimum = currentValueOf(LocalViewConfiguration).minimumTouchTargetSize
        val placeable = measurable.measure(constraints)
        val width = constraints.constrainWidth(maxOf(placeable.width, minimum.width.roundToPx()))
        val height = constraints.constrainHeight(maxOf(placeable.height, minimum.height.roundToPx()))
        return layout(width, height) {
            placeable.place((width - placeable.width) / 2, (height - placeable.height) / 2)
        }
    }
}

/**
 * Draws the `focus/default` or `focus/danger` effect style outside the control: a gap in the
 * surface color, then the ring color. Shown only for keyboard focus (touch never focuses a button).
 *
 * The Compose generator doesn't emit effect styles yet, so the ring is rebuilt from tokens: the gap
 * and the ring are each `border/width/focus` wide, matching the Figma effect (spread 2 and 4).
 */
fun Modifier.dsFocusRing(visible: Boolean, ring: Color, gap: Color, cornerRadius: Dp): Modifier =
    if (!visible) {
        this
    } else {
        drawBehind {
            val w = DsBorderWidth.focus.toPx()
            val r = cornerRadius.toPx()
            drawRoundRect(
                color = ring,
                topLeft = Offset(-2 * w, -2 * w),
                size = Size(size.width + 4 * w, size.height + 4 * w),
                cornerRadius = CornerRadius(r + 2 * w),
            )
            drawRoundRect(
                color = gap,
                topLeft = Offset(-w, -w),
                size = Size(size.width + 2 * w, size.height + 2 * w),
                cornerRadius = CornerRadius(r + w),
            )
        }
    }
