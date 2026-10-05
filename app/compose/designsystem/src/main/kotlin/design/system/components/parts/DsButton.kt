package design.system.components.parts

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import design.system.R
import design.system.components.DsEmphasis
import design.system.components.DsPreviewState
import design.system.components.DsSize
import design.system.components.DsTone
import design.system.icons.DsIcon
import design.system.icons.DsIcons
import design.system.theme.DsTheme
import design.system.theme.dsFocusRing
import design.system.theme.dsMinimumTouchTarget
import design.system.tokens.DsBorderWidth
import design.system.tokens.DsColors
import design.system.tokens.DsComponent
import design.system.tokens.DsEasing
import design.system.tokens.DsRadius
import design.system.tokens.DsSpace
import design.system.tokens.DsTextStyles
import design.system.tokens.DsSizes

/**
 * 2.1 Button: starts an action, like saving a form or confirming a delete.
 *
 * Figma: `Button` · Size × Emphasis × Tone × State × Icon only (360 variants). Parameters are the
 * Figma properties; `State` comes from the platform (pressed, hovered, focused), and `disabled`
 * and `loading` are [enabled] and [loading].
 *
 * Every color, size, radius, text style and duration comes from the generated tokens.
 *
 * @param label Figma `Label`. With [iconOnly] it isn't drawn and becomes the name TalkBack announces.
 * @param leadingIcon Figma `Show leading icon` + `Leading icon`. The only glyph when [iconOnly]
 *   (defaults to `general/plus` there, like Figma).
 * @param trailingIcon Figma `Show trailing icon` + `Trailing icon`. Hidden while loading.
 * @param iconOnly Figma `Icon only`: a square button with one icon.
 * @param loading Figma `State=loading`: a spinner replaces the leading icon, taps are ignored and
 *   TalkBack hears the label plus a "Loading" state.
 * @param showLoadingText Figma `Show loading text`: keeps the label next to the spinner.
 * @param enabled `false` is Figma `State=disabled`.
 * @param fullWidth Stretches to the container; the content stays centered.
 * @param previewState Documentation only: pins hover, pressed or focus for the showcase matrix.
 */
@Composable
fun DsButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    size: DsSize = DsSize.Md,
    emphasis: DsEmphasis = DsEmphasis.Primary,
    tone: DsTone = DsTone.Brand,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    iconOnly: Boolean = false,
    loading: Boolean = false,
    showLoadingText: Boolean = true,
    enabled: Boolean = true,
    fullWidth: Boolean = false,
    previewState: DsPreviewState? = null,
    interactionSource: MutableInteractionSource? = null,
) {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()

    val state = when {
        !enabled -> ButtonState.Disabled
        loading -> ButtonState.Rest
        pressed || previewState == DsPreviewState.Pressed -> ButtonState.Pressed
        hovered || previewState == DsPreviewState.Hovered -> ButtonState.Hovered
        else -> ButtonState.Rest
    }
    val showFocus = enabled && (focused || previewState == DsPreviewState.Focused)

    val tokens = DsTheme.colors
    val target = buttonColors(emphasis, tone, state, tokens)
    // Press feedback: fast · standard (1.6). The Reduced motion set is applied by DsTheme.
    val colorSpec = tween<Color>(durationMillis = DsTheme.motion.durationFast, easing = DsEasing.easingStandard)
    val container by animateColorAsState(target.container, colorSpec, label = "container")
    val border by animateColorAsState(target.border ?: tokens.fillNone, colorSpec, label = "border")
    val content by animateColorAsState(target.content, colorSpec, label = "content")
    val icon by animateColorAsState(target.icon, colorSpec, label = "icon")

    val metrics = size.metrics()
    val shape = RoundedCornerShape(DsRadius.control)
    val loadingState = stringResource(R.string.ds_state_loading)

    Row(
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
            .dsMinimumTouchTarget()
            .dsFocusRing(showFocus, ring = target.focusRing, gap = tokens.surfaceBase, cornerRadius = DsRadius.control)
            .background(container, shape)
            .then(if (target.border != null) Modifier.border(DsBorderWidth.default, border, shape) else Modifier)
            .clickable(
                interactionSource = source,
                indication = null, // The pressed state is a color change from Figma, not a ripple.
                enabled = enabled,
                role = Role.Button,
                onClick = { if (!loading) onClick() },
            )
            .semantics {
                if (iconOnly) contentDescription = label
                if (loading) stateDescription = loadingState
            }
            // Height is the Figma height at default text size; it grows instead of clipping at large text sizes.
            .defaultMinSize(minWidth = if (iconOnly) metrics.height else Dp.Unspecified, minHeight = metrics.height)
            .padding(horizontal = if (iconOnly) DsSpace.none else metrics.paddingX),
        horizontalArrangement = Arrangement.spacedBy(metrics.gap, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        when {
            loading -> SpinnerStandIn(color = icon)
            leadingIcon != null || iconOnly -> DsIcon(icon = leadingIcon ?: DsIcons.Plus, tint = icon)
        }
        if (!iconOnly && (!loading || showLoadingText)) {
            // Text padding: the optical inset that keeps label-only and icon buttons evenly centered.
            BasicText(
                text = label,
                modifier = Modifier.padding(horizontal = DsSpace.optical),
                style = DsTheme.textStyle(metrics.textStyle).copy(textAlign = TextAlign.Center),
                color = { content },
            )
        }
        if (!iconOnly && !loading && trailingIcon != null) {
            DsIcon(icon = trailingIcon, tint = icon)
        }
    }
}

/* ---------- sizes (spec §4) ---------- */

private class ButtonMetrics(val height: Dp, val paddingX: Dp, val gap: Dp, val textStyle: TextStyle)

private fun DsSize.metrics(): ButtonMetrics = when (this) {
    DsSize.Xs -> ButtonMetrics(DsSizes.controlXs, DsComponent.buttonPaddingXXs, DsComponent.buttonGapXs, DsTextStyles.bodySmSemibold)
    DsSize.Sm -> ButtonMetrics(DsSizes.controlSm, DsComponent.buttonPaddingXSm, DsComponent.buttonGapSm, DsTextStyles.bodySmSemibold)
    DsSize.Md -> ButtonMetrics(DsSizes.controlMd, DsComponent.buttonPaddingXMd, DsComponent.buttonGapMd, DsTextStyles.bodySmSemibold)
    DsSize.Lg -> ButtonMetrics(DsSizes.controlLg, DsComponent.buttonPaddingXLg, DsComponent.buttonGapLg, DsTextStyles.bodyMdSemibold)
    DsSize.Xl -> ButtonMetrics(DsSizes.controlXl, DsComponent.buttonPaddingXXl, DsComponent.buttonGapXl, DsTextStyles.bodyMdSemibold)
}

/* ---------- token map (spec §7) ---------- */

private enum class ButtonState { Rest, Hovered, Pressed, Disabled }

/** `border == null` draws no border (primary and tertiary at rest). */
private class ButtonColors(val container: Color, val border: Color?, val content: Color, val icon: Color, val focusRing: Color)

private fun buttonColors(emphasis: DsEmphasis, tone: DsTone, state: ButtonState, c: DsColors): ButtonColors {
    val ring = if (tone == DsTone.Danger) c.borderDanger else c.borderFocus
    if (state == ButtonState.Disabled) {
        return when (emphasis) {
            DsEmphasis.Primary -> ButtonColors(c.fillNeutralSubtleDisabled, c.borderDisabled, c.textDisabled, c.textDisabled, ring)
            DsEmphasis.Secondary -> ButtonColors(c.surfaceBase, c.borderDisabled, c.textDisabled, c.textDisabled, ring)
            DsEmphasis.Tertiary -> ButtonColors(c.fillNone, null, c.textDisabled, c.textDisabled, ring)
        }
    }
    val hover = state == ButtonState.Hovered
    val press = state == ButtonState.Pressed
    return when (tone) {
        DsTone.Brand -> when (emphasis) {
            DsEmphasis.Primary -> ButtonColors(
                container = if (press) c.fillBrandSolidPressed else if (hover) c.fillBrandSolidHover else c.fillBrandSolid,
                border = null, content = c.textOnSolid, icon = c.iconOnSolid, focusRing = ring,
            )
            DsEmphasis.Secondary -> {
                val text = if (hover || press) c.textPrimary else c.textSecondary
                ButtonColors(
                    container = if (press) c.surfaceBasePressed else if (hover) c.surfaceBaseHover else c.surfaceBase,
                    border = c.borderDefault, content = text, icon = text, focusRing = ring,
                )
            }
            DsEmphasis.Tertiary -> {
                val text = if (hover || press) c.textPrimary else c.textSecondary
                ButtonColors(
                    container = if (press) c.fillNeutralSubtlePressed else if (hover) c.fillNeutralSubtleHover else c.fillNone,
                    border = null, content = text, icon = text, focusRing = ring,
                )
            }
        }
        DsTone.Danger -> when (emphasis) {
            DsEmphasis.Primary -> ButtonColors(
                container = if (press) c.fillDangerSolidPressed else if (hover) c.fillDangerSolidHover else c.fillDangerSolid,
                border = null, content = c.textOnSolid, icon = c.iconOnSolid, focusRing = ring,
            )
            DsEmphasis.Secondary -> {
                val text = if (hover || press) c.textDangerHover else c.textDanger
                ButtonColors(
                    container = if (press) c.fillDangerSubtlePressed else if (hover) c.fillDangerSubtleHover else c.surfaceBase,
                    border = c.borderDangerSubtle, content = text, icon = text, focusRing = ring,
                )
            }
            DsEmphasis.Tertiary -> {
                val text = if (hover || press) c.textDangerHover else c.textDanger
                ButtonColors(
                    container = if (press) c.fillDangerSubtlePressed else if (hover) c.fillDangerSubtleHover else c.fillNone,
                    border = null, content = text, icon = text, focusRing = ring,
                )
            }
        }
    }
}

/*
 * Depth: when the brand uses `elevation/control`, primary and secondary carry it at rest, hover and
 * pressed. The Compose generator doesn't emit effect styles yet; add `Modifier.shadow(...)` from the
 * strongest layer once it does (APP.md §5). Surfaces stay distinguishable by color either way.
 */

/* ---------- loading ---------- */

/**
 * Stand-in for 2.15 Spinner until it is built: an arc in the label color, the icon box size and the
 * Spinner md thickness, turning once per `motion/duration/loop`. Replace with `DsSpinner` at A4.
 * It has no semantics; the button announces the loading state.
 */
@Composable
private fun SpinnerStandIn(color: Color) {
    val transition = rememberInfiniteTransition(label = "spinner")
    val angle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(durationMillis = DsTheme.motion.durationLoop, easing = DsEasing.easingLinear)),
        label = "spinner-angle",
    )
    Canvas(Modifier.size(DsSizes.iconMd).graphicsLayer { rotationZ = angle }) {
        val stroke = DsComponent.spinnerThicknessMd.toPx()
        drawArc(
            color = color,
            startAngle = 0f,
            sweepAngle = 270f,
            useCenter = false,
            topLeft = Offset(stroke / 2, stroke / 2),
            size = Size(size.width - stroke, size.height - stroke),
            style = Stroke(width = stroke, cap = StrokeCap.Round),
        )
    }
}

/* ---------- previews ---------- */

@Preview(name = "Light")
@Preview(name = "Dark", uiMode = android.content.res.Configuration.UI_MODE_NIGHT_YES)
@Preview(name = "Font scale 2.0", fontScale = 2f)
@Composable
private fun DsButtonPreview() {
    DsTheme {
        Row(
            modifier = Modifier.background(DsTheme.colors.surfaceBase).padding(DsSpace.xl),
            horizontalArrangement = Arrangement.spacedBy(DsSpace.md),
        ) {
            DsButton(label = "Cancel", onClick = {}, emphasis = DsEmphasis.Secondary)
            DsButton(label = "Save changes", onClick = {}, leadingIcon = DsIcons.Check)
            DsButton(label = "Add", onClick = {}, iconOnly = true)
        }
    }
}
