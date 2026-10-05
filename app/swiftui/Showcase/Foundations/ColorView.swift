import SwiftUI
import DesignSystem

/// 1.1 Color: the color roles with live swatches in the current mode and their contrast.
///
/// The generated file has no list of its members, so this screen names the roles it shows.
/// A build lists every role from its 1.1 page (or the generator emits a catalog; see README).
struct ColorView: View {
    struct Swatch: Identifiable {
        let name: String
        let color: DSColor
        /// Contrast is measured against this color (text and icons on a surface, a label on a fill).
        let pair: DSColor
        let pairName: String
        /// 4.5 for text, 3 for borders, icons and large shapes, 0 when exempt (disabled).
        let minimum: Double
        var id: String { name }
    }

    struct RoleGroup: Identifiable {
        let title: String
        let intro: String
        let swatches: [Swatch]
        var id: String { title }
    }

    private typealias C = DSTokens.Color

    private var groups: [RoleGroup] {
        let onBase = (C.surfaceBase, "surface/base")
        let onSolid = (C.textOnSolid, "text/on-solid")
        func s(_ name: String, _ color: DSColor, _ pair: (DSColor, String), min minimum: Double = 4.5) -> Swatch {
            Swatch(name: name, color: color, pair: pair.0, pairName: pair.1, minimum: minimum)
        }
        return [
            RoleGroup(title: "Text", intro: "Pick a text color by how important the text is. Disabled text is exempt from contrast rules, but stays legible.", swatches: [
                s("color/text/primary", C.textPrimary, onBase),
                s("color/text/secondary", C.textSecondary, onBase),
                s("color/text/tertiary", C.textTertiary, onBase),
                s("color/text/brand", C.textBrand, onBase),
                s("color/text/danger", C.textDanger, onBase),
                s("color/text/disabled", C.textDisabled, onBase, min: 0),
            ]),
            RoleGroup(title: "Icon", intro: "Icons follow the text next to them.", swatches: [
                s("color/icon/primary", C.iconPrimary, onBase, min: 3),
                s("color/icon/secondary", C.iconSecondary, onBase, min: 3),
                s("color/icon/brand", C.iconBrand, onBase, min: 3),
            ]),
            RoleGroup(title: "Border", intro: "Borders separate and outline. Strong and focus borders need 3:1 against the surface. Subtle dividers are decorative.", swatches: [
                s("color/border/subtle", C.borderSubtle, onBase, min: 0),
                s("color/border/default", C.borderDefault, onBase, min: 0),
                s("color/border/strong", C.borderStrong, onBase, min: 3),
                s("color/border/focus", C.borderFocus, onBase, min: 3),
            ]),
            RoleGroup(title: "Surface", intro: "Surfaces are the layers content sits on.", swatches: [
                s("color/surface/base", C.surfaceBase, (C.textPrimary, "text/primary")),
                s("color/surface/sunken", C.surfaceSunken, (C.textPrimary, "text/primary")),
                s("color/surface/raised", C.surfaceRaised, (C.textPrimary, "text/primary")),
                s("color/surface/inverse", C.surfaceInverse, (C.textInverse, "text/inverse")),
            ]),
            RoleGroup(title: "Fill", intro: "Each solid fill is measured with the label color that sits on it.", swatches: [
                s("color/fill/brand/solid", C.fillBrandSolid, onSolid),
                s("color/fill/danger/solid", C.fillDangerSolid, onSolid),
                s("color/fill/success/solid", C.fillSuccessSolid, onSolid),
                s("color/fill/warning/solid", C.fillWarningSolid, onSolid),
                s("color/fill/neutral/subtle", C.fillNeutralSubtle, (C.textPrimary, "text/primary")),
            ]),
        ]
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: DSTokens.Space.space4xl) {
                Text("Colors come in roles, not raw values, so Light and Dark stay consistent. Each swatch shows its contrast in the current mode.")
                    .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                    .dsForeground(DSTokens.Color.textSecondary)

                ForEach(groups) { group in
                    VStack(alignment: .leading, spacing: DSTokens.Space.lg) {
                        Text(group.title)
                            .dsTextStyle(DSTokens.TextStyle.headingSmSemibold)
                            .dsForeground(DSTokens.Color.textPrimary)
                            .accessibilityAddTraits(.isHeader)
                        Text(group.intro)
                            .dsTextStyle(DSTokens.TextStyle.bodySmRegular)
                            .dsForeground(DSTokens.Color.textTertiary)
                        ForEach(group.swatches) { SwatchRow(swatch: $0) }
                    }
                }
            }
            .padding(DSTokens.Size.containerMarginMobile)
        }
        .dsBackground(DSTokens.Color.surfaceBase)
        .navigationTitle("1.1 Color")
    }
}

private struct SwatchRow: View {
    let swatch: ColorView.Swatch
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let ratio = DSColor.contrast(swatch.color.argb(scheme), swatch.pair.argb(scheme))
        let passes = ratio >= swatch.minimum
        let verdict = swatch.minimum == 0 ? "Exempt" : passes ? "Passes \(format(swatch.minimum)):1" : "Below \(format(swatch.minimum)):1"
        let shape = RoundedRectangle(cornerRadius: DSTokens.Radius.sm, style: .continuous)

        HStack(alignment: .top, spacing: DSTokens.Space.lg) {
            shape
                .fill(swatch.color)
                .overlay { shape.strokeBorder(DSTokens.Color.borderSubtle, lineWidth: DSTokens.BorderWidth.default) }
                .frame(width: DSTokens.Size.avatarLg, height: DSTokens.Size.avatarLg)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: DSTokens.Space.xxs) {
                Text(swatch.name)
                    .dsTextStyle(DSTokens.TextStyle.codeSmMedium)
                    .dsForeground(DSTokens.Color.textPrimary)
                Text(String(format: "#%06X", swatch.color.argb(scheme) & 0xFFFFFF))
                    .dsTextStyle(DSTokens.TextStyle.codeSmRegular)
                    .dsForeground(DSTokens.Color.textTertiary)
                Text("\(String(format: "%.2f", ratio)):1 with \(swatch.pairName) · \(verdict)")
                    .dsTextStyle(DSTokens.TextStyle.bodyXsMedium)
                    .dsForeground(passes ? DSTokens.Color.textSuccess : DSTokens.Color.textWarning)
            }
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }

    private func format(_ value: Double) -> String {
        value == value.rounded() ? String(Int(value)) : String(value)
    }
}
