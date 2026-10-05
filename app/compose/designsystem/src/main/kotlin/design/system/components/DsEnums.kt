package design.system.components

/*
 * Shared variant enums. Each value keeps its Figma value in `figma`, so docs, tests and the showcase
 * can show and match the exact Figma property (SYSTEM.md Part C §4.2). A component that has its own
 * values for a property (for example a Size axis without `xl`) declares its own enum next to it.
 *
 * Size tokens are generated as `DsSizes` (design.system.tokens.DsSizes), so they never clash
 * with this `DsSize` variant enum.
 */

/** Figma `Size`. */
enum class DsSize(val figma: String) {
    Xs("xs"),
    Sm("sm"),
    Md("md"),
    Lg("lg"),
    Xl("xl"),
}

/** Figma `Emphasis`: how much attention the control asks for. */
enum class DsEmphasis(val figma: String) {
    Primary("primary"),
    Secondary("secondary"),
    Tertiary("tertiary"),
}

/** Figma `Tone`: the intent. `Danger` marks actions with consequences. */
enum class DsTone(val figma: String) {
    Brand("brand"),
    Danger("danger"),
}

/**
 * Documentation only: pins one interaction state of Figma `State` so the showcase matrix can show it.
 * Never set it in product code; the platform reports hover, press and focus by itself.
 * `disabled` and `loading` are real parameters on each component (`enabled`, `loading`).
 */
enum class DsPreviewState(val figma: String) {
    Hovered("hover"),
    Pressed("pressed"),
    Focused("focus"),
}
