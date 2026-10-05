package design.system.showcase

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import design.system.components.DsEmphasis
import design.system.components.DsSize
import design.system.components.parts.DsButton
import design.system.showcase.docs.DocRegistry
import design.system.showcase.foundations.ColorScreen
import design.system.showcase.foundations.TypographyScreen
import design.system.theme.DsTheme
import design.system.theme.rememberReducedMotion
import design.system.tokens.DsSpace
import design.system.tokens.DsSizes

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent { ShowcaseApp() }
    }
}

/** Screens of the showcase. The platform back gesture pops one level. */
sealed interface Route {
    data object Home : Route
    data object Color : Route
    data object Typography : Route
    // A5: add Space, Shape, Elevation, Motion, Icons and Brand assets screens here.
    data class Component(val id: String) : Route
}

/* ---------- global controls (APP.md §7) ---------- */

enum class ModeChoice(val label: String) { System("System"), Light("Light"), Dark("Dark") }

enum class MotionChoice(val label: String) { System("System"), Standard("Standard"), Reduced("Reduced") }

/** From the smallest to the largest Android text size. `null` keeps the device setting. */
enum class TextScale(val factor: Float?, val label: String) {
    System(null, "System"),
    Small(0.85f, "85%"),
    Default(1f, "100%"),
    Large(1.15f, "115%"),
    Larger(1.3f, "130%"),
    Huge(1.5f, "150%"),
    Accessibility(1.8f, "180%"),
    Largest(2f, "200%"),
}

private inline fun <reified E : Enum<E>> E.next(): E {
    val all = enumValues<E>()
    return all[(ordinal + 1) % all.size]
}

@Composable
fun ShowcaseApp() {
    var mode by rememberSaveable { mutableStateOf(ModeChoice.System) }
    var motion by rememberSaveable { mutableStateOf(MotionChoice.System) }
    var textScale by rememberSaveable { mutableStateOf(TextScale.System) }
    val backStack = remember { mutableStateListOf<Route>(Route.Home) }

    val systemDark = isSystemInDarkTheme()
    val systemReduced = rememberReducedMotion()
    val dark = when (mode) {
        ModeChoice.System -> systemDark
        ModeChoice.Light -> false
        ModeChoice.Dark -> true
    }
    val reduced = when (motion) {
        MotionChoice.System -> systemReduced
        MotionChoice.Standard -> false
        MotionChoice.Reduced -> true
    }
    val open: (Route) -> Unit = { backStack.add(it) }
    val back: () -> Unit = { if (backStack.size > 1) backStack.removeAt(backStack.lastIndex) }

    BackHandler(enabled = backStack.size > 1, onBack = back)

    DsTheme(darkTheme = dark, reducedMotion = reduced) {
        Column(
            Modifier
                .fillMaxSize()
                .background(DsTheme.colors.surfaceBase)
                .windowInsetsPadding(WindowInsets.safeDrawing),
        ) {
            Box(Modifier.weight(1f)) {
                // Text size applies to the screens, not to the controls, so the controls stay usable.
                WithTextScale(textScale.factor) {
                    when (val route = backStack.last()) {
                        Route.Home -> HomeScreen(onOpen = open)
                        Route.Color -> ColorScreen(onBack = back)
                        Route.Typography -> TypographyScreen(onBack = back)
                        is Route.Component -> DocRegistry.find(route.id)?.let { ComponentScreen(it, onBack = back) }
                    }
                }
            }
            GlobalControls(
                mode = mode,
                textScale = textScale,
                motion = motion,
                onMode = { mode = mode.next() },
                onTextScale = { textScale = textScale.next() },
                onMotion = { motion = motion.next() },
            )
        }
    }
}

@Composable
private fun WithTextScale(factor: Float?, content: @Composable () -> Unit) {
    if (factor == null) {
        content()
    } else {
        CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, factor), content = content)
    }
}

@Composable
private fun GlobalControls(
    mode: ModeChoice,
    textScale: TextScale,
    motion: MotionChoice,
    onMode: () -> Unit,
    onTextScale: () -> Unit,
    onMotion: () -> Unit,
) {
    Column(Modifier.fillMaxWidth().background(DsTheme.colors.surfaceRaised)) {
        ShowDivider()
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = DsSizes.containerMarginMobile, vertical = DsSpace.md),
            horizontalArrangement = Arrangement.spacedBy(DsSpace.md),
        ) {
            DsButton(label = "Mode: ${mode.label}", onClick = onMode, size = DsSize.Sm, emphasis = DsEmphasis.Secondary)
            DsButton(label = "Text size: ${textScale.label}", onClick = onTextScale, size = DsSize.Sm, emphasis = DsEmphasis.Secondary)
            DsButton(label = "Motion: ${motion.label}", onClick = onMotion, size = DsSize.Sm, emphasis = DsEmphasis.Secondary)
        }
    }
}
