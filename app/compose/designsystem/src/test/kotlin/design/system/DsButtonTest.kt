package design.system

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTouchHeightIsEqualTo
import androidx.compose.ui.test.assertTouchWidthIsEqualTo
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.github.takahirom.roborazzi.captureRoboImage
import design.system.components.DsEmphasis
import design.system.components.DsPreviewState
import design.system.components.DsSize
import design.system.components.DsTone
import design.system.components.parts.DsButton
import design.system.theme.DsTheme
import design.system.tokens.DsSpace
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.annotation.GraphicsMode

/*
 * Run with `./gradlew :designsystem:testDebugUnitTest` (Robolectric, no emulator).
 * Screenshots: `./gradlew :designsystem:recordRoborazziDebug` once, then `verifyRoborazziDebug` in CI.
 */

/** Semantics: role, name and state for TalkBack (APP.md §6.2, §9). */
@RunWith(AndroidJUnit4::class)
class DsButtonTest {
    @get:Rule
    val compose = createComposeRule()

    private fun setButton(content: @Composable () -> Unit) =
        compose.setContent { DsTheme(darkTheme = false, reducedMotion = true) { content() } }

    private val isButton = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)

    @Test
    fun textButton_isAButtonNamedByItsLabel() {
        var clicks = 0
        setButton { DsButton(label = "Save changes", onClick = { clicks++ }) }

        compose.onNodeWithText("Save changes")
            .assert(isButton)
            .assertHasClickAction()
            .assertIsEnabled()
            .performClick()
        assertEquals(1, clicks)
    }

    @Test
    fun iconOnlyButton_takesItsNameFromLabel() {
        setButton { DsButton(label = "Add", onClick = {}, iconOnly = true) }

        compose.onNodeWithContentDescription("Add").assert(isButton)
    }

    @Test
    fun disabledButton_reportsDisabled_andIgnoresTaps() {
        var clicks = 0
        setButton { DsButton(label = "Delete project", onClick = { clicks++ }, tone = DsTone.Danger, enabled = false) }

        compose.onNodeWithText("Delete project").assertIsNotEnabled().performClick()
        assertEquals(0, clicks)
    }

    @Test
    fun loadingButton_announcesLoading_andIgnoresTaps() {
        var clicks = 0
        setButton { DsButton(label = "Saving…", onClick = { clicks++ }, loading = true) }

        compose.onNodeWithText("Saving…")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Loading"))
            .performClick()
        assertEquals(0, clicks)
    }

    @Test
    fun smallestButton_stillHasA48dpTouchTarget() {
        setButton { DsButton(label = "Add", onClick = {}, size = DsSize.Xs, iconOnly = true) }

        compose.onNodeWithContentDescription("Add")
            .assertTouchWidthIsEqualTo(48.dp)
            .assertTouchHeightIsEqualTo(48.dp)
    }

    @Test
    fun largestTextSize_keepsTheLabelVisible() {
        compose.setContent {
            CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale = 2f)) {
                DsTheme(darkTheme = false, reducedMotion = true) {
                    DsButton(label = "Save changes", onClick = {}, size = DsSize.Xs)
                }
            }
        }
        compose.onNodeWithText("Save changes").assertIsDisplayed()
    }
}

/**
 * Screenshot outline: every Figma variant × Light/Dark × font scale 1.0/2.0.
 * One image per (mode, font scale, tone, emphasis, icon only): rows are Size, columns are State,
 * exactly like the Figma matrix (spec §6). Compare against the Figma Component page when recording.
 */
@RunWith(AndroidJUnit4::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DsButtonScreenshotTest {
    private val states = listOf("rest", "hover", "pressed", "focus", "disabled", "loading")

    @Test
    fun everyVariant() {
        for (dark in listOf(false, true)) {
            for (fontScale in listOf(1f, 2f)) {
                for (tone in DsTone.entries) {
                    for (emphasis in DsEmphasis.entries) {
                        for (iconOnly in listOf(false, true)) {
                            val mode = if (dark) "dark" else "light"
                            val name = "button_${mode}_x${fontScale}_${tone.figma}_${emphasis.figma}_iconOnly-$iconOnly"
                            captureRoboImage("src/test/screenshots/$name.png") {
                                Matrix(dark, fontScale, tone, emphasis, iconOnly)
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun Matrix(dark: Boolean, fontScale: Float, tone: DsTone, emphasis: DsEmphasis, iconOnly: Boolean) {
        CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale)) {
            DsTheme(darkTheme = dark, reducedMotion = true) {
                Column(
                    modifier = Modifier.background(DsTheme.colors.surfaceBase).padding(DsSpace.xl),
                    verticalArrangement = Arrangement.spacedBy(DsSpace.md),
                ) {
                    DsSize.entries.forEach { size ->
                        Row(horizontalArrangement = Arrangement.spacedBy(DsSpace.md)) {
                            states.forEach { state ->
                                DsButton(
                                    label = if (state == "loading") "Saving…" else "Button",
                                    onClick = {},
                                    size = size,
                                    emphasis = emphasis,
                                    tone = tone,
                                    iconOnly = iconOnly,
                                    loading = state == "loading",
                                    enabled = state != "disabled",
                                    previewState = DsPreviewState.entries.firstOrNull { it.figma == state },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
