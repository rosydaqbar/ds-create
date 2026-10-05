import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// One Figma text style (`type/body/sm/semibold` → `DSTokens.TextStyle.bodySmSemibold`).
///
/// Sizes are Figma px as pt. Apply it with `.dsTextStyle(_:)`: the size scales with Dynamic Type
/// (relative to the closest system text style), the line height becomes line spacing plus a
/// half-leading above and below, and letter spacing becomes tracking.
public struct DSTextStyle: Sendable, Hashable {
    /// Font family name, or `nil` for the system font (SF Pro / SF Mono).
    public let family: String?
    public let monospaced: Bool
    public let size: CGFloat
    public let lineHeight: CGFloat
    public let letterSpacing: CGFloat
    /// CSS-style weight: 100…900.
    public let weight: Double

    public init(family: String?, monospaced: Bool, size: CGFloat, lineHeight: CGFloat, letterSpacing: CGFloat, weight: Double) {
        self.family = family
        self.monospaced = monospaced
        self.size = size
        self.lineHeight = lineHeight
        self.letterSpacing = letterSpacing
        self.weight = weight
    }

    public var fontWeight: Font.Weight {
        switch weight {
        case ..<150: .ultraLight
        case ..<250: .thin
        case ..<350: .light
        case ..<450: .regular
        case ..<550: .medium
        case ..<650: .semibold
        case ..<750: .bold
        case ..<850: .heavy
        default: .black
        }
    }

    /// The system text style this one scales with under Dynamic Type.
    public var relativeTextStyle: Font.TextStyle {
        switch size {
        case 34...: .largeTitle
        case 28..<34: .title
        case 22..<28: .title2
        case 20..<22: .title3
        case 17..<20: .body
        case 16..<17: .callout
        case 15..<16: .subheadline
        case 13..<15: .footnote
        case 12..<13: .caption
        default: .caption2
        }
    }

    /// The font at an already scaled point size.
    ///
    /// A brand family must be bundled and registered (A3). `Font.custom` takes the PostScript or
    /// family name; when the brand ships one file per weight, map `weight` to the file's name here.
    public func font(size scaledSize: CGFloat) -> Font {
        if let family {
            return Font.custom(family, fixedSize: scaledSize).weight(fontWeight)
        }
        return .system(size: scaledSize, weight: fontWeight, design: monospaced ? .monospaced : .default)
    }

    /// The font's own line height at a point size, so the Figma line height can be matched exactly.
    func naturalLineHeight(size scaledSize: CGFloat) -> CGFloat {
        #if canImport(UIKit)
        let uiWeight: UIFont.Weight = switch fontWeight {
        case .ultraLight: .ultraLight
        case .thin: .thin
        case .light: .light
        case .medium: .medium
        case .semibold: .semibold
        case .bold: .bold
        case .heavy: .heavy
        case .black: .black
        default: .regular
        }
        let font: UIFont
        if let family, let custom = UIFont(name: family, size: scaledSize) {
            font = custom
        } else if monospaced {
            font = .monospacedSystemFont(ofSize: scaledSize, weight: uiWeight)
        } else {
            font = .systemFont(ofSize: scaledSize, weight: uiWeight)
        }
        return font.lineHeight
        #else
        return scaledSize * 1.2
        #endif
    }
}

/// Applies a `DSTextStyle` with Dynamic Type. Use through `.dsTextStyle(_:)`.
struct DSTextStyleModifier: ViewModifier {
    let style: DSTextStyle
    @ScaledMetric private var scaledSize: CGFloat

    init(_ style: DSTextStyle) {
        self.style = style
        _scaledSize = ScaledMetric(wrappedValue: style.size, relativeTo: style.relativeTextStyle)
    }

    func body(content: Content) -> some View {
        let scale = style.size > 0 ? scaledSize / style.size : 1
        let leading = max(0, style.lineHeight * scale - style.naturalLineHeight(size: scaledSize))
        content
            .font(style.font(size: scaledSize))
            .tracking(style.letterSpacing * scale)
            .lineSpacing(leading)
            .padding(.vertical, leading / 2)
    }
}
