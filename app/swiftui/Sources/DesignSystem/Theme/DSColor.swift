import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// One color role with its Light and Dark values, as generated in `DSTokens.Color` (APP.md §5).
///
/// Values are 0xAARRGGBB, straight from the Figma variables. `DSColor` is a `ShapeStyle`, so it
/// resolves against the color scheme of the view it is drawn in, including a subtree forced with
/// `.dsTheme(colorScheme:)`:
///
/// ```swift
/// Text("Saved").foregroundStyle(DSTokens.Color.textPrimary)
/// RoundedRectangle(cornerRadius: DSTokens.Radius.control).fill(DSTokens.Color.fillBrandSolid)
/// ```
public struct DSColor: Sendable, Hashable, ShapeStyle {
    public let light: UInt32
    public let dark: UInt32

    public init(light: UInt32, dark: UInt32) {
        self.light = light
        self.dark = dark
    }

    /// The value for one color scheme.
    public func resolve(_ scheme: ColorScheme) -> Color {
        Self.color(argb: scheme == .dark ? dark : light)
    }

    /// The raw 0xAARRGGBB value for one color scheme (contrast checks, snapshot tests).
    public func argb(_ scheme: ColorScheme) -> UInt32 {
        scheme == .dark ? dark : light
    }

    /// `ShapeStyle`: SwiftUI asks for the value in the current environment.
    public func resolve(in environment: EnvironmentValues) -> Color {
        resolve(environment.colorScheme)
    }

    /// A dynamic `Color` that follows the trait collection. Use it where a plain `Color` is
    /// required outside a view (UIKit bridges, `UIColor` APIs). Inside views, use the
    /// `DSColor` itself as a `ShapeStyle`.
    public var dynamic: Color {
        #if canImport(UIKit)
        Color(uiColor: uiColor)
        #else
        resolve(.light)
        #endif
    }

    #if canImport(UIKit)
    public var uiColor: UIColor {
        let light = light
        let dark = dark
        return UIColor { traits in
            Self.uiColor(argb: traits.userInterfaceStyle == .dark ? dark : light)
        }
    }

    static func uiColor(argb: UInt32) -> UIColor {
        let c = Components(argb: argb)
        return UIColor(red: c.red, green: c.green, blue: c.blue, alpha: c.alpha)
    }
    #endif

    static func color(argb: UInt32) -> Color {
        let c = Components(argb: argb)
        return Color(.sRGB, red: c.red, green: c.green, blue: c.blue, opacity: c.alpha)
    }

    /// sRGB channels in 0...1.
    public struct Components: Sendable, Hashable {
        public let alpha: Double
        public let red: Double
        public let green: Double
        public let blue: Double

        public init(argb: UInt32) {
            alpha = Double((argb >> 24) & 0xFF) / 255
            red = Double((argb >> 16) & 0xFF) / 255
            green = Double((argb >> 8) & 0xFF) / 255
            blue = Double(argb & 0xFF) / 255
        }

        /// WCAG 2.x relative luminance (alpha ignored: the swatch is treated as opaque).
        public var relativeLuminance: Double {
            func linear(_ v: Double) -> Double { v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
            return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
        }
    }

    /// WCAG contrast ratio between two opaque colors, from 1 to 21.
    public static func contrast(_ a: UInt32, _ b: UInt32) -> Double {
        let la = Components(argb: a).relativeLuminance
        let lb = Components(argb: b).relativeLuminance
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }
}
