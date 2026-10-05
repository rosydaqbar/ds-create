import SwiftUI

/// Theme state in the SwiftUI environment (APP.md §3 Theme, §5 Rules).
///
/// By default everything follows the system: color scheme, Dynamic Type and Reduce Motion.
/// Any subtree can be forced into one mode, like `data-theme` on the web, and the showcase can
/// preview Reduced motion without changing the device setting.
public struct DSTheme: Sendable, Hashable {
    /// `nil` follows the system color scheme.
    public var colorScheme: ColorScheme?
    /// `nil` follows the system Reduce Motion setting.
    public var reduceMotion: Bool?

    public init(colorScheme: ColorScheme? = nil, reduceMotion: Bool? = nil) {
        self.colorScheme = colorScheme
        self.reduceMotion = reduceMotion
    }
}

extension EnvironmentValues {
    /// The overrides set with `.dsTheme(...)`. Components read the resolved values below.
    @Entry public var dsTheme = DSTheme()

    /// Whether to use the Reduced motion tokens: the showcase override, else the system setting.
    public var dsReduceMotion: Bool {
        dsTheme.reduceMotion ?? accessibilityReduceMotion
    }
}

extension View {
    /// Forces Light or Dark and/or Reduced motion for this subtree. `nil` keeps the system value.
    ///
    /// ```swift
    /// SettingsPanel().dsTheme(colorScheme: .dark)
    /// ```
    public func dsTheme(colorScheme: ColorScheme? = nil, reduceMotion: Bool? = nil) -> some View {
        modifier(DSThemeModifier(theme: DSTheme(colorScheme: colorScheme, reduceMotion: reduceMotion)))
    }

    /// Foreground (text, icons, shape strokes) from a color token.
    public func dsForeground(_ color: DSColor) -> some View {
        foregroundStyle(color)
    }

    /// Background from a color token, filling the view's frame.
    public func dsBackground(_ color: DSColor) -> some View {
        background(color)
    }

    /// Background from a color token in a shape (radius from `DSTokens.Radius`).
    public func dsBackground<S: Shape>(_ color: DSColor, in shape: S) -> some View {
        background(color, in: shape)
    }

    /// A Figma text style, scaled with Dynamic Type.
    public func dsTextStyle(_ style: DSTextStyle) -> some View {
        modifier(DSTextStyleModifier(style))
    }

    /// Every layer of an effect style in the shape's outline, with spread. Use for surfaces and controls.
    public func dsShadow<S: Shape>(_ layers: [DSShadow], in shape: S) -> some View {
        modifier(DSShapeShadowModifier(layers: layers, shape: shape))
    }

    /// Effect style layers as stacked `.shadow` modifiers (spread ignored). Use for text and icons.
    public func dsShadow(_ layers: [DSShadow]) -> some View {
        modifier(DSStackedShadowModifier(layers: layers))
    }
}

struct DSThemeModifier: ViewModifier {
    let theme: DSTheme
    @Environment(\.colorScheme) private var systemScheme
    @Environment(\.dsTheme) private var inherited

    func body(content: Content) -> some View {
        content
            .environment(\.colorScheme, theme.colorScheme ?? systemScheme)
            .environment(\.dsTheme, DSTheme(
                colorScheme: theme.colorScheme ?? inherited.colorScheme,
                reduceMotion: theme.reduceMotion ?? inherited.reduceMotion
            ))
    }
}
