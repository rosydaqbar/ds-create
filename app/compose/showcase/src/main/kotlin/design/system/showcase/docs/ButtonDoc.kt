@file:OptIn(ExperimentalLayoutApi::class)

package design.system.showcase.docs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import design.system.components.DsEmphasis
import design.system.components.DsPreviewState
import design.system.components.DsSize
import design.system.components.DsTone
import design.system.components.parts.DsButton
import design.system.icons.DsIcons
import design.system.showcase.ShowText
import design.system.theme.DsTheme
import design.system.tokens.DsSpace
import design.system.tokens.DsTextStyles

/* Content adapted from web/src/docs/stories/2.1-button.doc.tsx and parts/2.1-button.md. */

private val SIZES = DsSize.entries.map { it.figma }
private val EMPHASIS = DsEmphasis.entries.map { it.figma }
private val TONES = DsTone.entries.map { it.figma }
private val STATES = listOf("rest", "hover", "pressed", "focus", "disabled", "loading")

private fun sizeOf(figma: String) = DsSize.entries.first { it.figma == figma }
private fun emphasisOf(figma: String) = DsEmphasis.entries.first { it.figma == figma }
private fun toneOf(figma: String) = DsTone.entries.first { it.figma == figma }

/** One Figma variant: State → previewState, enabled or loading. */
@Composable
private fun Variant(size: String = "md", emphasis: String, tone: String, state: String, iconOnly: Boolean = false) {
    DsButton(
        label = if (state == "loading") "Saving…" else "Button",
        onClick = {},
        size = sizeOf(size),
        emphasis = emphasisOf(emphasis),
        tone = toneOf(tone),
        leadingIcon = if (iconOnly) DsIcons.Plus else null,
        iconOnly = iconOnly,
        loading = state == "loading",
        enabled = state != "disabled",
        previewState = DsPreviewState.entries.firstOrNull { it.figma == state },
    )
}

@Composable
private fun Actions(end: Boolean = false, content: @Composable () -> Unit) {
    FlowRow(
        modifier = if (end) Modifier.fillMaxWidth() else Modifier,
        horizontalArrangement = Arrangement.spacedBy(DsSpace.md, if (end) Alignment.End else Alignment.Start),
        verticalArrangement = Arrangement.spacedBy(DsSpace.md),
    ) { content() }
}

val ButtonDoc = ComponentDoc(
    id = "2.1",
    name = "Button",
    level = DocLevel.Parts,
    spec = "parts/2.1-button.md",
    status = DocStatus.Beta,
    since = "0.1.0",
    updated = "0.1.0",
    exports = listOf(
        "design.system.components.parts.DsButton",
        "design.system.components.DsSize",
        "design.system.components.DsEmphasis",
        "design.system.components.DsTone",
        "design.system.icons.DsIcons",
    ),
    summary = "Buttons start actions, like saving a form, creating a project or confirming a delete. " +
        "Choose the emphasis by how important the action is on the screen, and the size by the space around it.",
    hero = { DsButton(label = "Save changes", onClick = {}, size = DsSize.Lg, leadingIcon = DsIcons.Check) },
    examples = listOf(
        DocExample(
            title = "Dialog footer",
            caption = "Use one primary action per view, and let the secondary action support it.",
            code = """
                Row(horizontalArrangement = Arrangement.spacedBy(DsSpace.md, Alignment.End)) {
                    DsButton(label = "Cancel", onClick = onCancel, emphasis = DsEmphasis.Secondary)
                    DsButton(label = "Save changes", onClick = onSave)
                }
            """.trimIndent(),
        ) {
            Actions(end = true) {
                DsButton(label = "Cancel", onClick = {}, emphasis = DsEmphasis.Secondary)
                DsButton(label = "Save changes", onClick = {})
            }
        },
        DocExample(
            title = "Delete confirmation",
            caption = "Give the danger tone only to the action that has the consequence.",
            code = """
                DsButton(label = "Cancel", onClick = onCancel, emphasis = DsEmphasis.Secondary)
                DsButton(label = "Delete project", onClick = onDelete, tone = DsTone.Danger)
            """.trimIndent(),
        ) {
            Actions {
                DsButton(label = "Cancel", onClick = {}, emphasis = DsEmphasis.Secondary)
                DsButton(label = "Delete project", onClick = {}, tone = DsTone.Danger)
            }
        },
        DocExample(
            title = "Page header actions",
            caption = "Three levels of emphasis let the main action stand out from the rest.",
            code = """
                DsButton(label = "Export", onClick = onExport, emphasis = DsEmphasis.Tertiary, leadingIcon = DsIcons.Download)
                DsButton(label = "Share", onClick = onShare, emphasis = DsEmphasis.Secondary)
                DsButton(label = "New report", onClick = onCreate, leadingIcon = DsIcons.Plus)
            """.trimIndent(),
        ) {
            Actions {
                DsButton(label = "Export", onClick = {}, emphasis = DsEmphasis.Tertiary, leadingIcon = DsIcons.Download)
                DsButton(label = "Share", onClick = {}, emphasis = DsEmphasis.Secondary)
                DsButton(label = "New report", onClick = {}, leadingIcon = DsIcons.Plus)
            }
        },
        DocExample(
            title = "Form submit in progress",
            caption = "While it saves, the button keeps its place and width, so the layout doesn’t jump.",
            code = """
                DsButton(label = "Cancel", onClick = onCancel, emphasis = DsEmphasis.Secondary, enabled = false)
                DsButton(label = "Saving…", onClick = onSave, loading = true)
            """.trimIndent(),
        ) {
            Actions {
                DsButton(label = "Cancel", onClick = {}, emphasis = DsEmphasis.Secondary, enabled = false)
                DsButton(label = "Saving…", onClick = {}, loading = true)
            }
        },
    ),
    whenToUse = WhenToUse(
        use = listOf(
            "For actions that change data or move a task forward: save, submit, create, delete.",
            "For the main action in a dialog, form or page header.",
        ),
        dont = listOf(
            "For navigation to another page, use a Link (2.3).",
            "For a compact tool action without a label, use an Icon button (2.2).",
            "For several related options that stay visible, use a Button group (3.1).",
        ),
    ),
    playground = Playground(
        controls = listOf(
            PlaygroundControl.Text("label", "Label", "Button"),
            PlaygroundControl.Choice("size", "Size", SIZES, "md"),
            PlaygroundControl.Choice("emphasis", "Emphasis", EMPHASIS, "primary"),
            PlaygroundControl.Choice("tone", "Tone", TONES, "brand"),
            PlaygroundControl.Icon("leadingIcon", "Leading icon"),
            PlaygroundControl.Icon("trailingIcon", "Trailing icon"),
            PlaygroundControl.Toggle("iconOnly", "Icon only", false),
            PlaygroundControl.Toggle("loading", "State=loading", false),
            PlaygroundControl.Toggle("disabled", "State=disabled", false),
        ),
        render = { v ->
            DsButton(
                label = v.text("label"),
                onClick = {},
                size = sizeOf(v.choice("size")),
                emphasis = emphasisOf(v.choice("emphasis")),
                tone = toneOf(v.choice("tone")),
                leadingIcon = v.icon("leadingIcon")?.let(DsIcons::named),
                trailingIcon = v.icon("trailingIcon")?.let(DsIcons::named),
                iconOnly = v.toggle("iconOnly"),
                loading = v.toggle("loading"),
                enabled = !v.toggle("disabled"),
            )
        },
        code = { v ->
            val args = buildList {
                add("label = \"${v.text("label")}\"")
                add("onClick = onClick")
                sizeOf(v.choice("size")).takeIf { it != DsSize.Md }?.let { add("size = DsSize.${it.name}") }
                emphasisOf(v.choice("emphasis")).takeIf { it != DsEmphasis.Primary }?.let { add("emphasis = DsEmphasis.${it.name}") }
                toneOf(v.choice("tone")).takeIf { it != DsTone.Brand }?.let { add("tone = DsTone.${it.name}") }
                v.icon("leadingIcon")?.let { add("leadingIcon = DsIcons.${iconProperty(it)}") }
                v.icon("trailingIcon")?.let { add("trailingIcon = DsIcons.${iconProperty(it)}") }
                if (v.toggle("iconOnly")) add("iconOnly = true")
                if (v.toggle("loading")) add("loading = true")
                if (v.toggle("disabled")) add("enabled = false")
            }
            "DsButton(\n" + args.joinToString(separator = ",\n", postfix = ",\n") { "    $it" } + ")"
        },
    ),
    matrices = TONES.flatMap { t ->
        EMPHASIS.map { e ->
            DocMatrix(
                title = "Tone=$t · Emphasis=$e",
                rowProp = "Size",
                rows = SIZES,
                colProp = "State",
                cols = STATES,
            ) { size, state -> Variant(size = size, emphasis = e, tone = t, state = state) }
        }
    } + DocMatrix(
        title = "Icon only=true",
        rowProp = "Emphasis",
        rows = EMPHASIS,
        colProp = "State",
        cols = STATES,
    ) { e, state -> Variant(emphasis = e, tone = "brand", state = state, iconOnly = true) },
    anatomy = DocAnatomy(
        render = {
            Actions {
                DsButton(label = "Button", onClick = {}, leadingIcon = DsIcons.Plus, trailingIcon = DsIcons.ArrowRight)
                DsButton(label = "Saving…", onClick = {}, loading = true)
            }
        },
        parts = listOf(
            AnatomyPart("Root", "The tappable container. Its height and padding are set by the size.", listOf("size/control/md", "button/padding-x/md", "radius/control")),
            AnatomyPart("Leading icon", "An optional icon before the label. While loading, a spinner takes its place.", listOf("size/icon/md")),
            AnatomyPart("Text padding", "A thin wrapper around the label that evens out the space, so buttons with and without icons both look centered.", listOf("space/optical")),
            AnatomyPart("Label", "One line of text that sets the button’s width. Larger sizes use a larger text style.", listOf("type/body/sm/semibold")),
            AnatomyPart("Trailing icon", "An optional icon after the label. It hides while the button is loading."),
            AnatomyPart("Spinner", "A Spinner (2.15) that replaces the leading icon while loading, in the same color as the label."),
        ),
    ),
    props = listOf(
        DocProp("label", "String", "The visible label. When iconOnly is set, it becomes the name TalkBack announces.", figma = "Label"),
        DocProp("onClick", "() -> Unit", "Called on a tap, or on Enter or Space with a keyboard. Not called while loading."),
        DocProp("modifier", "Modifier", "Layout and placement from the screen around the button.", default = "Modifier"),
        DocProp("size", "DsSize", "Sets the height, padding, gap and label style.", figma = "Size", default = "DsSize.Md"),
        DocProp("emphasis", "DsEmphasis", "Primary is a solid fill, secondary a bordered surface, and tertiary has no container.", figma = "Emphasis", default = "DsEmphasis.Primary"),
        DocProp("tone", "DsTone", "Use Danger for destructive actions.", figma = "Tone", default = "DsTone.Brand"),
        DocProp("leadingIcon", "ImageVector?", "The icon before the label, or the only icon when iconOnly is set.", figma = "Show leading icon + Leading icon", default = "null"),
        DocProp("trailingIcon", "ImageVector?", "The icon after the label.", figma = "Show trailing icon + Trailing icon", default = "null"),
        DocProp("iconOnly", "Boolean", "Makes a square button with one icon. The label becomes its contentDescription.", figma = "Icon only", default = "false"),
        DocProp("loading", "Boolean", "Shows a spinner in the leading slot, ignores taps and adds a Loading state for TalkBack.", figma = "State=loading", default = "false"),
        DocProp("showLoadingText", "Boolean", "Keeps the label next to the spinner while loading.", figma = "Show loading text", default = "true"),
        DocProp("enabled", "Boolean", "false renders the disabled state; TalkBack announces it as disabled.", figma = "State=disabled", default = "true"),
        DocProp("fullWidth", "Boolean", "Stretches the button to fill its container. The content stays centered.", default = "false"),
        DocProp("previewState", "DsPreviewState?", "For documentation only. Pins a hover, pressed or focus state.", default = "null"),
        DocProp("interactionSource", "MutableInteractionSource?", "Observe or share the button’s press, hover and focus interactions.", default = "null"),
    ),
    tokens = listOf(
        "color/fill/brand/solid", "color/fill/brand/solid/hover", "color/fill/brand/solid/pressed", "color/text/on-solid", "color/icon/on-solid",
        "color/surface/base", "color/surface/base/hover", "color/surface/base/pressed", "color/border/default", "color/text/secondary", "color/text/primary",
        "color/fill/neutral/subtle/hover", "color/fill/neutral/subtle/pressed",
        "color/fill/danger/solid", "color/fill/danger/solid/hover", "color/fill/danger/solid/pressed",
        "color/fill/danger/subtle/hover", "color/fill/danger/subtle/pressed", "color/border/danger/subtle", "color/text/danger", "color/text/danger/hover",
        "color/fill/neutral/subtle/disabled", "color/border/disabled", "color/text/disabled",
        "radius/control", "border/width/default", "size/control/md", "button/padding-x/md", "button/gap/md", "space/optical", "size/icon/md",
        "type/body/sm/semibold", "motion/duration/fast", "motion/easing/standard", "elevation/control", "focus/default", "focus/danger",
    ),
    guidelines = listOf(
        DocGuideline(
            title = "Make buttons look clickable",
            body = "People spot a button by its container, border, contrast and the way it reacts when they press it. " +
                "Take those cues away and the same label reads as plain text.",
            doExample = DoDont("A real button, with a visible container and states.") {
                DsButton(label = "Upload files", onClick = {}, leadingIcon = DsIcons.Upload)
            },
            dontExample = DoDont("Text styled like a label doesn’t look clickable.") {
                ShowText("Upload files", style = DsTextStyles.bodySmSemibold, color = DsTheme.colors.textSecondary)
            },
        ),
        DocGuideline(
            title = "Use one primary action",
            body = "Primary, secondary and tertiary emphasis set a clear order of importance. " +
                "Keep one primary action per view or dialog, so the next step is obvious.",
            doExample = DoDont("One primary action, backed by secondary and tertiary.") {
                Actions {
                    DsButton(label = "Skip", onClick = {}, emphasis = DsEmphasis.Tertiary)
                    DsButton(label = "Back", onClick = {}, emphasis = DsEmphasis.Secondary)
                    DsButton(label = "Continue", onClick = {})
                }
            },
            dontExample = DoDont("Three primary buttons fight for attention.") {
                Actions {
                    DsButton(label = "Skip", onClick = {})
                    DsButton(label = "Back", onClick = {})
                    DsButton(label = "Continue", onClick = {})
                }
            },
        ),
        DocGuideline(
            title = "Save the danger tone for real consequences",
            body = "Not every negative action is dangerous. Use the danger tone only on the button that does the damage, " +
                "like delete, remove or revoke. Cancel is the safe way out, so it stays neutral.",
            doExample = DoDont("Danger on “Delete project”, the action with the consequence.") {
                DsButton(label = "Delete project", onClick = {}, tone = DsTone.Danger)
            },
            dontExample = DoDont("Danger on “Cancel”, which is the safe choice.") {
                DsButton(label = "Cancel", onClick = {}, tone = DsTone.Danger, emphasis = DsEmphasis.Secondary)
            },
        ),
        DocGuideline(
            title = "Balance buttons optically",
            body = "Icons carry a little empty space inside their box, which can make a button look off-center. " +
                "To fix it, the label gets a small extra padding on each side and the outer padding shrinks by the same amount. " +
                "Buttons with and without icons then look evenly centered.",
            render = {
                Actions {
                    DsButton(label = "Label only", onClick = {}, emphasis = DsEmphasis.Secondary)
                    DsButton(label = "Leading icon", onClick = {}, emphasis = DsEmphasis.Secondary, leadingIcon = DsIcons.Plus)
                    DsButton(label = "Trailing icon", onClick = {}, emphasis = DsEmphasis.Secondary, trailingIcon = DsIcons.ArrowRight)
                }
            },
        ),
        DocGuideline(
            title = "Content",
            body = "Write labels as a verb, or a verb and a noun: “Save changes”, “Delete project”. " +
                "Use sentence case and aim for three words or fewer.\n\n" +
                "While loading, say what’s happening (“Saving…”). Icon-only buttons need a name for TalkBack and a Tooltip (2.13) on long-press.",
        ),
    ),
    accessibility = listOf(
        "Label text meets contrast requirements against the fill in every state. Disabled buttons are exempt, but stay legible.",
        "Every button has a touch area of at least 48 × 48 dp, even the extra-small size.",
        "With a hardware keyboard, focus shows a visible ring (focus/default, or focus/danger on danger buttons) that looks different from hover.",
        "While loading, the button ignores taps. TalkBack reads the progress label with a Loading state, such as “Saving…, Loading”.",
        "Icon-only buttons use label as the name TalkBack announces.",
    ),
    platformNotes = listOf(
        "Extra-small and small buttons keep their Figma size, but their touch area grows to 48 dp so they’re easy to tap.",
        "Pressing changes the color to the Figma pressed state instead of showing a ripple.",
        "Hover appears only with a mouse or trackpad, and the focus ring only with a hardware keyboard.",
        "At the largest text sizes, the button grows taller and the label can wrap to a second line instead of being cut off.",
    ),
    usage = """
        DsButton(
            label = "Save changes",
            onClick = { save() },
            leadingIcon = DsIcons.Check,
        )
    """.trimIndent(),
)

