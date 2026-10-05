import SwiftUI
import DesignSystem

/// 1.2 Typography: the type scale at the current text size, straight from the text style tokens.
///
/// Like 1.1, this screen names the styles it shows; a build lists every style from its 1.2 page.
struct TypographyView: View {
    struct Specimen: Identifiable {
        let name: String
        let style: DSTextStyle
        let sample: String
        var id: String { name }
    }

    private typealias T = DSTokens.TextStyle

    private let specimens: [Specimen] = [
        .init(name: "type/display/lg/semibold", style: T.displayLgSemibold, sample: "Plan the week"),
        .init(name: "type/display/sm/semibold", style: T.displaySmSemibold, sample: "Plan the week"),
        .init(name: "type/heading/xl/semibold", style: T.headingXlSemibold, sample: "Project overview"),
        .init(name: "type/heading/lg/semibold", style: T.headingLgSemibold, sample: "Project overview"),
        .init(name: "type/heading/md/semibold", style: T.headingMdSemibold, sample: "Recent activity"),
        .init(name: "type/heading/sm/semibold", style: T.headingSmSemibold, sample: "Recent activity"),
        .init(name: "type/heading/xs/semibold", style: T.headingXsSemibold, sample: "Team members"),
        .init(name: "type/body/lg/regular", style: T.bodyLgRegular, sample: "Invite your team to start sharing reports."),
        .init(name: "type/body/md/regular", style: T.bodyMdRegular, sample: "Invite your team to start sharing reports."),
        .init(name: "type/body/md/semibold", style: T.bodyMdSemibold, sample: "Save changes"),
        .init(name: "type/body/sm/regular", style: T.bodySmRegular, sample: "Last edited 3 minutes ago"),
        .init(name: "type/body/sm/semibold", style: T.bodySmSemibold, sample: "Save changes"),
        .init(name: "type/body/xs/regular", style: T.bodyXsRegular, sample: "3 new messages"),
        .init(name: "type/code/md/regular", style: T.codeMdRegular, sample: "DSButton(\"Save\")"),
    ]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
                Text("Every style scales with the text size people choose in Settings. Use the display settings to check the scale from the smallest size to the largest accessibility size.")
                    .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                    .dsForeground(DSTokens.Color.textSecondary)

                ForEach(specimens) { specimen in
                    VStack(alignment: .leading, spacing: DSTokens.Space.xs) {
                        Text(specimen.sample)
                            .dsTextStyle(specimen.style)
                            .dsForeground(DSTokens.Color.textPrimary)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(specimen.name)
                            .dsTextStyle(DSTokens.TextStyle.codeSmMedium)
                            .dsForeground(DSTokens.Color.textTertiary)
                        Text(Self.metrics(specimen.style))
                            .dsTextStyle(DSTokens.TextStyle.bodyXsRegular)
                            .dsForeground(DSTokens.Color.textTertiary)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            .padding(DSTokens.Size.containerMarginMobile)
        }
        .dsBackground(DSTokens.Color.surfaceBase)
        .navigationTitle("1.2 Typography")
    }

    /// Figma values at the default text size, e.g. "14 / 20 · weight 600 · tracking 0".
    static func metrics(_ style: DSTextStyle) -> String {
        func n(_ v: CGFloat) -> String { v == v.rounded() ? String(Int(v)) : String(format: "%.2f", Double(v)) }
        let family = style.family ?? (style.monospaced ? "System mono" : "System")
        return "\(family) · \(n(style.size)) / \(n(style.lineHeight)) · weight \(Int(style.weight)) · tracking \(n(style.letterSpacing))"
    }
}
