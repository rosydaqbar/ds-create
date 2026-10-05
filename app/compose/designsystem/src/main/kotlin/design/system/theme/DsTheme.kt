package design.system.theme

import android.content.ContentResolver
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import design.system.tokens.DarkDsColors
import design.system.tokens.DsColors
import design.system.tokens.DsMotion
import design.system.tokens.LightDsColors
import design.system.tokens.ReducedDsMotion
import design.system.tokens.StandardDsMotion

/** The active color mode's roles (`LightDsColors` or `DarkDsColors`). Read it through [DsTheme.colors]. */
val LocalDsColors = staticCompositionLocalOf { LightDsColors }

/** The active motion set (`StandardDsMotion` or `ReducedDsMotion`). Read it through [DsTheme.motion]. */
val LocalDsMotion = staticCompositionLocalOf { StandardDsMotion }

private val LocalDsIsDark = staticCompositionLocalOf { false }
private val LocalDsReducedMotion = staticCompositionLocalOf { false }
private val LocalDsFontFamily = staticCompositionLocalOf<FontFamily> { FontFamily.Default }

/**
 * The brand typeface. A3 replaces this with the bundled brand font, for example
 * `FontFamily(Font(R.font.brand_regular, FontWeight(400)), Font(R.font.brand_semibold, FontWeight(600)))`.
 * When the license doesn't allow apps, keep the system font and name the stand-in in the showcase.
 */
val DsBrandFontFamily: FontFamily = FontFamily.Default

/**
 * Provides the system to everything inside it. Follows the system color scheme and the system
 * "Remove animations" setting by default.
 *
 * Force a mode for a subtree by nesting another theme, like `data-theme` on the web:
 * ```
 * DsTheme(darkTheme = true, reducedMotion = DsTheme.reducedMotion) { … }
 * ```
 * Pass `reducedMotion = DsTheme.reducedMotion` when nesting, so a subtree keeps the parent's motion
 * setting (the showcase can force it, and the default reads the system setting).
 *
 * This is not a MaterialTheme and doesn't wrap one: components read only these locals (APP.md §3).
 */
@Composable
fun DsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    reducedMotion: Boolean = rememberReducedMotion(),
    fontFamily: FontFamily = DsBrandFontFamily,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(
        LocalDsColors provides if (darkTheme) DarkDsColors else LightDsColors,
        LocalDsMotion provides if (reducedMotion) ReducedDsMotion else StandardDsMotion,
        LocalDsIsDark provides darkTheme,
        LocalDsReducedMotion provides reducedMotion,
        LocalDsFontFamily provides fontFamily,
        content = content,
    )
}

/** Accessors for the active theme: `DsTheme.colors.textPrimary`, `DsTheme.motion.durationFast`. */
object DsTheme {
    val colors: DsColors
        @Composable @ReadOnlyComposable
        get() = LocalDsColors.current

    val motion: DsMotion
        @Composable @ReadOnlyComposable
        get() = LocalDsMotion.current

    val isDark: Boolean
        @Composable @ReadOnlyComposable
        get() = LocalDsIsDark.current

    val reducedMotion: Boolean
        @Composable @ReadOnlyComposable
        get() = LocalDsReducedMotion.current

    /**
     * A generated text style with the brand typeface applied. Monospace styles (code) keep the
     * platform monospace font. Use it for every `DsTextStyles` value a component draws.
     */
    @Composable
    @ReadOnlyComposable
    fun textStyle(style: TextStyle): TextStyle =
        if (style.fontFamily == FontFamily.Monospace) style else style.copy(fontFamily = LocalDsFontFamily.current)
}

/**
 * True when the system asks for reduced motion: Settings › Accessibility › Remove animations sets the
 * animator duration scale to 0. Updates live when the setting changes while the app is open.
 */
@Composable
fun rememberReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    var reduced by remember(resolver) { mutableStateOf(resolver.animatorScale() == 0f) }
    DisposableEffect(resolver) {
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                reduced = resolver.animatorScale() == 0f
            }
        }
        resolver.registerContentObserver(
            Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE),
            false,
            observer,
        )
        onDispose { resolver.unregisterContentObserver(observer) }
    }
    return reduced
}

private fun ContentResolver.animatorScale(): Float =
    Settings.Global.getFloat(this, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
