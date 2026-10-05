import SwiftUI

/// One layer of a Figma effect style (`elevation/*`, `focus/*`). `DSTokens.Shadow` holds every
/// layer of each style, in Figma order (the first layer is drawn at the bottom). iOS draws all of
/// them (APP.md §6.2 Shadows).
public struct DSShadow: Sendable, Hashable {
    public let x: CGFloat
    public let y: CGFloat
    /// Figma blur. SwiftUI blur and shadow radii are about half of it.
    public let blur: CGFloat
    /// Figma spread. `.shadow` has no spread, so spread is drawn with `dsShadow(_:in:)`.
    public let spread: CGFloat
    public let color: DSColor

    public init(x: CGFloat, y: CGFloat, blur: CGFloat, spread: CGFloat, color: DSColor) {
        self.x = x
        self.y = y
        self.blur = blur
        self.spread = spread
        self.color = color
    }
}

/// Draws every layer behind the view in the shape's outline, with spread, and keeps the inside
/// clear like a CSS box-shadow (so a transparent tertiary button still shows its focus ring only
/// outside its edge). Use through `.dsShadow(_:in:)`.
struct DSShapeShadowModifier<S: Shape>: ViewModifier {
    let layers: [DSShadow]
    let shape: S

    func body(content: Content) -> some View {
        content.background {
            if !layers.isEmpty {
                let reach = layers.map { abs($0.x) + abs($0.y) + abs($0.spread) + $0.blur * 2 }.max() ?? 0
                ZStack {
                    ForEach(Array(layers.enumerated()), id: \.offset) { _, layer in
                        shape
                            .fill(layer.color)
                            .padding(-layer.spread)
                            .offset(x: layer.x, y: layer.y)
                            .blur(radius: layer.blur / 2)
                    }
                }
                .mask {
                    Rectangle()
                        .inset(by: -(reach + 1))
                        .subtracting(shape)
                }
                .allowsHitTesting(false)
                .accessibilityHidden(true)
            }
        }
    }
}

/// Stacked `.shadow` modifiers for content without a fixed outline (text, icons). Spread is
/// ignored and later layers also shadow earlier ones; prefer `dsShadow(_:in:)` for surfaces.
struct DSStackedShadowModifier: ViewModifier {
    let layers: [DSShadow]
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        layers.reduce(AnyView(content)) { view, layer in
            AnyView(view.shadow(color: layer.color.resolve(colorScheme), radius: layer.blur / 2, x: layer.x, y: layer.y))
        }
    }
}
