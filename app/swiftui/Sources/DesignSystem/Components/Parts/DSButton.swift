import SwiftUI

/// 2.1 Button: actions people can take.
///
/// Figma: `Button` · Size × Emphasis × Tone × State × Icon only (360 variants).
/// The Figma `State` comes from the platform (pressed, hover with a pointer, keyboard focus);
/// `disabled` is `.disabled(_:)` and `loading` is `isLoading`. Spec: `parts/2.1-button.md`.
///
/// ```swift
/// DSButton("Save changes", size: .lg, leadingIcon: .check) { save() }
/// DSButton("Delete project", tone: .danger, action: delete)
/// DSButton("Add", leadingIcon: .plus, iconOnly: true, action: add)   // label = VoiceOver name
/// ```
public struct DSButton: View {
    /// Figma `Size`.
    public enum Size: String, CaseIterable, Sendable {
        case xs, sm, md, lg, xl
    }

    /// Figma `Emphasis`: solid fill, bordered surface, or no container.
    public enum Emphasis: String, CaseIterable, Sendable {
        case primary, secondary, tertiary
    }

    /// Figma `Tone`. Use `danger` for destructive actions only.
    public enum Tone: String, CaseIterable, Sendable {
        case brand, danger
    }

    /// Documentation only: pins a platform state in the showcase matrix (web `forceState`).
    public enum PreviewState: String, CaseIterable, Sendable {
        case hover, pressed, focus
    }

    let label: String
    let size: Size
    let emphasis: Emphasis
    let tone: Tone
    let leadingIcon: DSIcon?
    let trailingIcon: DSIcon?
    let iconOnly: Bool
    let isLoading: Bool
    let showLoadingText: Bool
    let fullWidth: Bool
    let previewState: PreviewState?
    let action: @MainActor () -> Void

    /// - Parameters:
    ///   - label: Figma `Label`. With `iconOnly`, it is the name VoiceOver announces. Pass localized text.
    ///   - size: Figma `Size`: height, padding, gap and label style.
    ///   - emphasis: Figma `Emphasis`.
    ///   - tone: Figma `Tone`.
    ///   - leadingIcon: Figma `Show leading icon` + `Leading icon`. The only glyph when `iconOnly` (default `.plus`).
    ///   - trailingIcon: Figma `Show trailing icon` + `Trailing icon`.
    ///   - iconOnly: Figma `Icon only`: a square button with one icon.
    ///   - isLoading: Figma `State=loading`: a spinner in the leading slot; the button ignores taps.
    ///   - showLoadingText: Figma `Show loading text`: keeps the label next to the spinner.
    ///   - fullWidth: Stretches to the container; the content stays centered.
    ///   - previewState: Documentation only. Never set it in product code.
    ///   - action: Runs on tap, Return/Space with a hardware keyboard, or VoiceOver activate.
    public init(
        _ label: String,
        size: Size = .md,
        emphasis: Emphasis = .primary,
        tone: Tone = .brand,
        leadingIcon: DSIcon? = nil,
        trailingIcon: DSIcon? = nil,
        iconOnly: Bool = false,
        isLoading: Bool = false,
        showLoadingText: Bool = true,
        fullWidth: Bool = false,
        previewState: PreviewState? = nil,
        action: @escaping @MainActor () -> Void
    ) {
        self.label = label
        self.size = size
        self.emphasis = emphasis
        self.tone = tone
        self.iconOnly = iconOnly
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.isLoading = isLoading
        self.showLoadingText = showLoadingText
        self.fullWidth = fullWidth
        self.previewState = previewState
        self.action = action
    }

    public var body: some View {
        Button {
            // Hit testing is off while loading; this also stops keyboard and VoiceOver activation.
            guard !isLoading else { return }
            action()
        } label: {
            Text(label)
        }
        .buttonStyle(DSButtonStyle(button: self))
        // Hardware keyboard (iPad, Full Keyboard Access): focusable in order, token focus ring
        // instead of the system halo. A1: confirm taps still land with `.focusable` on the target iOS.
        .focusable(interactions: .activate)
        .focusEffectDisabled()
        .hoverEffectDisabled()
        .allowsHitTesting(!isLoading)
        .accessibilityLabel(Text(label))
        .accessibilityAddTraits(.isButton)
        .accessibilityValue(isLoading ? Text("Loading") : Text(""))
    }
}

// MARK: - Tokens per size

extension DSButton.Size {
    /// `size/control/{Size}`
    var height: CGFloat {
        switch self {
        case .xs: DSTokens.Size.controlXs
        case .sm: DSTokens.Size.controlSm
        case .md: DSTokens.Size.controlMd
        case .lg: DSTokens.Size.controlLg
        case .xl: DSTokens.Size.controlXl
        }
    }

    /// `button/padding-x/{Size}` (the visual padding minus `space/optical`).
    var paddingX: CGFloat {
        switch self {
        case .xs: DSTokens.Component.buttonPaddingXXs
        case .sm: DSTokens.Component.buttonPaddingXSm
        case .md: DSTokens.Component.buttonPaddingXMd
        case .lg: DSTokens.Component.buttonPaddingXLg
        case .xl: DSTokens.Component.buttonPaddingXXl
        }
    }

    /// `button/gap/{Size}`
    var gap: CGFloat {
        switch self {
        case .xs: DSTokens.Component.buttonGapXs
        case .sm: DSTokens.Component.buttonGapSm
        case .md: DSTokens.Component.buttonGapMd
        case .lg: DSTokens.Component.buttonGapLg
        case .xl: DSTokens.Component.buttonGapXl
        }
    }

    /// `type/body/sm/semibold` (xs–md) or `type/body/md/semibold` (lg–xl).
    var textStyle: DSTextStyle {
        switch self {
        case .xs, .sm, .md: DSTokens.TextStyle.bodySmSemibold
        case .lg, .xl: DSTokens.TextStyle.bodyMdSemibold
        }
    }
}

// MARK: - Token map (parts/2.1-button.md §7)

extension DSButton {
    /// The Figma `State` a button is drawn in.
    enum VisualState: String, CaseIterable, Sendable {
        case rest, hover, pressed, focus, disabled, loading
    }

    struct Palette: Equatable, Sendable {
        let fill: DSColor
        /// `nil` = no border (drawn as `color/fill/none` so the box keeps its size).
        let border: DSColor?
        let text: DSColor
        let icon: DSColor
    }

    static func palette(emphasis: Emphasis, tone: Tone, state: VisualState) -> Palette {
        typealias C = DSTokens.Color
        let hover = state == .hover
        let pressed = state == .pressed

        if state == .disabled {
            switch emphasis {
            case .primary: return Palette(fill: C.fillNeutralSubtleDisabled, border: C.borderDisabled, text: C.textDisabled, icon: C.textDisabled)
            case .secondary: return Palette(fill: C.surfaceBase, border: C.borderDisabled, text: C.textDisabled, icon: C.textDisabled)
            case .tertiary: return Palette(fill: C.fillNone, border: nil, text: C.textDisabled, icon: C.textDisabled)
            }
        }

        // rest, focus and loading use the rest tokens.
        switch (tone, emphasis) {
        case (.brand, .primary):
            let fill = pressed ? C.fillBrandSolidPressed : hover ? C.fillBrandSolidHover : C.fillBrandSolid
            return Palette(fill: fill, border: nil, text: C.textOnSolid, icon: C.iconOnSolid)
        case (.brand, .secondary):
            let fill = pressed ? C.surfaceBasePressed : hover ? C.surfaceBaseHover : C.surfaceBase
            let text = pressed || hover ? C.textPrimary : C.textSecondary
            return Palette(fill: fill, border: C.borderDefault, text: text, icon: text)
        case (.brand, .tertiary):
            let fill = pressed ? C.fillNeutralSubtlePressed : hover ? C.fillNeutralSubtleHover : C.fillNone
            let text = pressed || hover ? C.textPrimary : C.textSecondary
            return Palette(fill: fill, border: nil, text: text, icon: text)
        case (.danger, .primary):
            let fill = pressed ? C.fillDangerSolidPressed : hover ? C.fillDangerSolidHover : C.fillDangerSolid
            return Palette(fill: fill, border: nil, text: C.textOnSolid, icon: C.iconOnSolid)
        case (.danger, .secondary):
            let fill = pressed ? C.fillDangerSubtlePressed : hover ? C.fillDangerSubtleHover : C.surfaceBase
            let text = pressed || hover ? C.textDangerHover : C.textDanger
            return Palette(fill: fill, border: C.borderDangerSubtle, text: text, icon: text)
        case (.danger, .tertiary):
            let fill = pressed ? C.fillDangerSubtlePressed : hover ? C.fillDangerSubtleHover : C.fillNone
            let text = pressed || hover ? C.textDangerHover : C.textDanger
            return Palette(fill: fill, border: nil, text: text, icon: text)
        }
    }

    /// `elevation/control` on primary and secondary (not disabled); focus replaces it with the ring.
    static func shadow(emphasis: Emphasis, tone: Tone, state: VisualState, focused: Bool) -> [DSShadow] {
        if state == .disabled { return [] }
        // Generated names keep their domain: `focus/default` → `Shadow.focusDefault`, `elevation/control` → `Shadow.elevationControl`.
        if focused { return tone == .danger ? DSTokens.Shadow.focusDanger : DSTokens.Shadow.focusDefault }
        return emphasis == .tertiary ? [] : DSTokens.Shadow.elevationControl
    }
}

// MARK: - Style

/// Draws the button from tokens. Reads pressed from the configuration, enabled/focus from the
/// environment, and hover from a pointer (iPad).
struct DSButtonStyle: ButtonStyle {
    let button: DSButton

    func makeBody(configuration: Configuration) -> some View {
        DSButtonChrome(configuration: configuration, button: button)
    }
}

private struct DSButtonChrome: View {
    let configuration: ButtonStyleConfiguration
    let button: DSButton

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.isFocused) private var isFocused
    @Environment(\.dsReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var isHovered = false

    // Control metrics grow with Dynamic Type so the label never clips; at the default text
    // size they equal the Figma values exactly.
    @ScaledMetric private var height: CGFloat
    @ScaledMetric private var paddingX: CGFloat
    @ScaledMetric private var gap: CGFloat
    @ScaledMetric private var iconSide: CGFloat

    init(configuration: ButtonStyleConfiguration, button: DSButton) {
        self.configuration = configuration
        self.button = button
        let relative = button.size.textStyle.relativeTextStyle
        _height = ScaledMetric(wrappedValue: button.size.height, relativeTo: relative)
        _paddingX = ScaledMetric(wrappedValue: button.size.paddingX, relativeTo: relative)
        _gap = ScaledMetric(wrappedValue: button.size.gap, relativeTo: relative)
        _iconSide = ScaledMetric(wrappedValue: DSTokens.Size.iconMd, relativeTo: relative)
    }

    private var state: DSButton.VisualState {
        if !isEnabled { return .disabled }
        if button.isLoading { return .loading }
        if configuration.isPressed || button.previewState == .pressed { return .pressed }
        if isFocused || button.previewState == .focus { return .focus }
        if isHovered || button.previewState == .hover { return .hover }
        return .rest
    }

    private var showsFocusRing: Bool {
        isEnabled && (isFocused || button.previewState == .focus)
    }

    var body: some View {
        let state = self.state
        let palette = DSButton.palette(emphasis: button.emphasis, tone: button.tone, state: state)
        let shape = RoundedRectangle(cornerRadius: DSTokens.Radius.control, style: .continuous)
        let showText = !button.iconOnly && (!button.isLoading || button.showLoadingText)
        let leading: DSIcon? = button.leadingIcon ?? (button.iconOnly ? .plus : nil)

        HStack(spacing: gap) {
            if button.isLoading {
                // STAND-IN for 2.15 Spinner: replace with DSSpinner(size: .md, tone: .current) once built.
                ProgressView()
                    .progressViewStyle(.circular)
                    .controlSize(.small)
                    .tint(palette.icon)
                    .frame(width: iconSide, height: iconSide)
                    .accessibilityHidden(true)
            } else if let leading {
                DSIconView(leading, size: iconSide)
                    .foregroundStyle(palette.icon)
            }

            if showText {
                // Text padding: the optical inset that keeps label-only and icon buttons centered.
                configuration.label
                    .dsTextStyle(button.size.textStyle)
                    .foregroundStyle(palette.text)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 1)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, DSTokens.Space.optical)
            }

            if let trailing = button.trailingIcon, !button.iconOnly, !button.isLoading {
                DSIconView(trailing, size: iconSide)
                    .foregroundStyle(palette.icon)
            }
        }
        .padding(.horizontal, button.iconOnly ? 0 : paddingX)
        .frame(minWidth: button.iconOnly ? height : nil, maxWidth: button.fullWidth ? .infinity : nil, minHeight: height)
        .background(palette.fill, in: shape)
        .overlay {
            shape.strokeBorder(palette.border ?? DSTokens.Color.fillNone, lineWidth: DSTokens.BorderWidth.default)
        }
        .dsShadow(DSButton.shadow(emphasis: button.emphasis, tone: button.tone, state: state, focused: showsFocusRing), in: shape)
        .animation(DSTokens.Motion.durationFast.animation(DSTokens.Motion.easingStandard, reduced: reduceMotion), value: state)
        .modifier(DSMinimumHitArea(visualHeight: height, visualWidth: button.iconOnly ? height : nil))
        .onHover { isHovered = $0 }
    }
}

/// Expands the tappable area to `size/touch-min` (44 pt) without changing the visual size or the
/// layout (APP.md §6.2 Touch targets). Neighbors closer than the expansion share the overlap, so
/// keep at least `space/md` between small buttons. A1: verify with the Accessibility Inspector.
struct DSMinimumHitArea: ViewModifier {
    let visualHeight: CGFloat
    /// `nil` when the visual is always wider than the minimum (text buttons).
    let visualWidth: CGFloat?

    func body(content: Content) -> some View {
        let vertical = max(0, (DSTokens.Size.touchMin - visualHeight) / 2)
        let horizontal = visualWidth.map { max(0, (DSTokens.Size.touchMin - $0) / 2) } ?? 0
        content
            .padding(.vertical, vertical)
            .padding(.horizontal, horizontal)
            .contentShape(Rectangle())
            .padding(.vertical, -vertical)
            .padding(.horizontal, -horizontal)
    }
}

#Preview("Button") {
    VStack(spacing: DSTokens.Space.lg) {
        DSButton("Save changes", size: .lg, leadingIcon: .check) {}
        DSButton("Cancel", emphasis: .secondary) {}
        DSButton("Delete project", tone: .danger) {}
        DSButton("Saving…", isLoading: true) {}
        DSButton("Add", leadingIcon: .plus, iconOnly: true) {}
        DSButton("Disabled") {}.disabled(true)
    }
    .padding(DSTokens.Space.xl)
}
