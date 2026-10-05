import SwiftUI
import DesignSystem
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Doc model

/// Everything a component screen shows, one value per component (`Docs/{Name}Doc.swift`).
/// The fields mirror the web doc modules (`web/src/docs/stories/*.doc.tsx`), sized for a phone.
struct ComponentDoc {
    enum Status: String { case stable = "Stable", beta = "Beta", deprecated = "Deprecated" }

    struct Example: Identifiable {
        let title: String
        /// One sentence that says why the example is right.
        let caption: String
        let code: String
        let content: AnyView
        var id: String { title }
    }

    /// Every variant in a grid, like the Figma matrix (rows × columns).
    struct Matrix: Identifiable {
        let title: String
        let rowAxis: String
        let columnAxis: String
        let rows: [String]
        let columns: [String]
        let cell: @MainActor (_ row: String, _ column: String) -> AnyView
        var id: String { title }
    }

    struct AnatomyPart: Identifiable {
        let name: String
        let description: String
        let tokens: [String]
        var id: String { name }
    }

    struct Prop: Identifiable {
        let name: String
        /// The Figma property this prop implements.
        let figma: String?
        let type: String
        let defaultValue: String?
        let description: String
        /// Documentation-only props (`previewState`) are listed apart.
        var isInternal = false
        var id: String { name }
    }

    struct Guideline: Identifiable {
        let title: String
        /// Paragraphs separated by a blank line.
        let body: String
        var example: AnyView?
        var doExample: (caption: String, content: AnyView)?
        var dontExample: (caption: String, content: AnyView)?
        var id: String { title }
    }

    let id: String
    let name: String
    let level: CatalogPage.Level
    let status: Status
    /// The release the component arrived in (A6).
    let since: String
    let spec: String
    let summary: String
    let hero: AnyView
    let examples: [Example]
    let whenToUse: [String]
    let whenNotToUse: [String]
    let matrices: [Matrix]
    let playground: AnyView
    let anatomySpecimen: AnyView
    let anatomy: [AnatomyPart]
    let props: [Prop]
    let tokens: [String]
    let guidelines: [Guideline]
    let accessibility: [String]
    /// How iOS differs from Figma and the web (APP.md §6.2 Native patterns).
    let platformNotes: [String]
    let code: String
}

// MARK: - Screen

/// The generic component screen: the web's tabs, in the same order (APP.md §7).
struct ComponentScreen: View {
    enum Tab: String, CaseIterable, Identifiable {
        case overview = "Overview", component = "Component", anatomy = "Anatomy", guidelines = "Guidelines", code = "Code"
        var id: String { rawValue }
    }

    let doc: ComponentDoc
    @State private var tab: Tab = .overview

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
                header
                tabBar
                switch tab {
                case .overview: overview
                case .component: component
                case .anatomy: anatomy
                case .guidelines: guidelines
                case .code: code
                }
            }
            .padding(DSTokens.Size.containerMarginMobile)
        }
        .dsBackground(DSTokens.Color.surfaceBase)
        .navigationTitle("\(doc.id) \(doc.name)")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.md) {
            Text("\(doc.level.rawValue) › \(doc.id) \(doc.name)")
                .dsTextStyle(DSTokens.TextStyle.bodySmMedium)
                .dsForeground(DSTokens.Color.textTertiary)
            Text(doc.name)
                .dsTextStyle(DSTokens.TextStyle.headingXlSemibold)
                .dsForeground(DSTokens.Color.textPrimary)
                .accessibilityAddTraits(.isHeader)
            // STAND-IN for 2.4 Badge until it is built.
            Text("\(doc.status.rawValue) on iOS · since \(doc.since)")
                .dsTextStyle(DSTokens.TextStyle.bodyXsMedium)
                .dsForeground(DSTokens.Color.textBrand)
                .padding(.horizontal, DSTokens.Space.md)
                .padding(.vertical, DSTokens.Space.xxs)
                .dsBackground(DSTokens.Color.fillBrandSubtle, in: Capsule())
            Text(doc.summary)
                .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                .dsForeground(DSTokens.Color.textSecondary)
        }
    }

    /// Tabs drawn with the system's own Button, scrolling sideways at large text sizes.
    private var tabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: DSTokens.Space.xs) {
                ForEach(Tab.allCases) { item in
                    DSButton(item.rawValue, size: .sm, emphasis: tab == item ? .secondary : .tertiary) {
                        tab = item
                    }
                    .accessibilityAddTraits(tab == item ? .isSelected : [])
                }
            }
        }
    }

    // MARK: Overview

    private var overview: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
            Stage { doc.hero }
            ForEach(doc.examples) { example in
                VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                    SectionTitle(example.title)
                    Stage { example.content }
                    Caption(example.caption)
                    CodeBlock(code: example.code)
                }
            }
            SectionTitle("When to use")
            BulletList(items: doc.whenToUse)
            SectionTitle("When not to use")
            BulletList(items: doc.whenNotToUse)
        }
    }

    // MARK: Component

    private var component: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
            SectionTitle("Playground")
            doc.playground
            ForEach(doc.matrices) { matrix in
                VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                    SectionTitle(matrix.title)
                    Caption("Rows: \(matrix.rowAxis) · Columns: \(matrix.columnAxis)")
                    MatrixGrid(matrix: matrix)
                }
            }
        }
    }

    // MARK: Anatomy

    private var anatomy: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
            Stage { doc.anatomySpecimen }
            VStack(alignment: .leading, spacing: DSTokens.Space.lg) {
                SectionTitle("Parts")
                ForEach(Array(doc.anatomy.enumerated()), id: \.element.id) { index, part in
                    VStack(alignment: .leading, spacing: DSTokens.Space.xxs) {
                        Text("\(index + 1). \(part.name)")
                            .dsTextStyle(DSTokens.TextStyle.bodyMdSemibold)
                            .dsForeground(DSTokens.Color.textPrimary)
                        Caption(part.description)
                        if !part.tokens.isEmpty { TokenList(tokens: part.tokens) }
                    }
                }
            }
            VStack(alignment: .leading, spacing: DSTokens.Space.lg) {
                SectionTitle("Props")
                ForEach(doc.props.filter { !$0.isInternal }) { PropRow(prop: $0) }
                let internalProps = doc.props.filter(\.isInternal)
                if !internalProps.isEmpty {
                    Caption("For documentation only")
                    ForEach(internalProps) { PropRow(prop: $0) }
                }
            }
            VStack(alignment: .leading, spacing: DSTokens.Space.lg) {
                SectionTitle("Token map")
                TokenList(tokens: doc.tokens)
            }
        }
    }

    // MARK: Guidelines

    private var guidelines: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
            ForEach(doc.guidelines) { guideline in
                VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                    SectionTitle(guideline.title)
                    ForEach(guideline.body.components(separatedBy: "\n\n"), id: \.self) { paragraph in
                        Text(paragraph)
                            .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                            .dsForeground(DSTokens.Color.textSecondary)
                    }
                    if let example = guideline.example { Stage { example } }
                    if let item = guideline.doExample { DoDont(isDo: true, caption: item.caption, content: item.content) }
                    if let item = guideline.dontExample { DoDont(isDo: false, caption: item.caption, content: item.content) }
                }
            }
            VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                SectionTitle("Accessibility")
                BulletList(items: doc.accessibility)
            }
            VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                SectionTitle("Full guidelines")
                Caption("This is a summary. The full page, with every visual comparison, is on the documentation site and in the Figma file.")
                if let url = DesignSystemConfig.docsURL { Link("Open the documentation site", destination: url) }
                if let url = DesignSystemConfig.figmaURL { Link("Open the Figma file", destination: url) }
                Caption("Spec: \(doc.spec)")
            }
        }
    }

    // MARK: Code

    private var code: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.space3xl) {
            VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                SectionTitle("Install")
                Caption("Add the package in Xcode (File › Add Package Dependencies) or in Package.swift.")
                CodeBlock(code: """
                .package(url: "https://github.com/your-org/\(DesignSystemConfig.packageName)", from: "\(DesignSystemConfig.version).0")
                """)
            }
            VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                SectionTitle("Usage")
                CodeBlock(code: doc.code)
            }
            VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                SectionTitle("On iOS")
                BulletList(items: doc.platformNotes)
            }
        }
    }
}

// MARK: - Building blocks

struct SectionTitle: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .dsTextStyle(DSTokens.TextStyle.headingSmSemibold)
            .dsForeground(DSTokens.Color.textPrimary)
            .accessibilityAddTraits(.isHeader)
    }
}

struct Caption: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .dsTextStyle(DSTokens.TextStyle.bodySmRegular)
            .dsForeground(DSTokens.Color.textTertiary)
    }
}

/// A specimen area on the sunken surface. Wide content scrolls sideways instead of clipping.
struct Stage<Content: View>: View {
    @ViewBuilder let content: Content
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            content
                .padding(DSTokens.Space.space2xl)
        }
        .frame(maxWidth: .infinity)
        .dsBackground(DSTokens.Color.surfaceSunken, in: RoundedRectangle(cornerRadius: DSTokens.Radius.surface, style: .continuous))
    }
}

struct BulletList: View {
    let items: [String]
    var body: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.md) {
            ForEach(items, id: \.self) { item in
                HStack(alignment: .firstTextBaseline, spacing: DSTokens.Space.md) {
                    Text("•").accessibilityHidden(true)
                    Text(item)
                }
                .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                .dsForeground(DSTokens.Color.textSecondary)
            }
        }
    }
}

struct CodeBlock: View {
    let code: String
    var body: some View {
        VStack(alignment: .trailing, spacing: DSTokens.Space.xs) {
            ScrollView(.horizontal, showsIndicators: false) {
                Text(code)
                    .dsTextStyle(DSTokens.TextStyle.codeSmRegular)
                    .dsForeground(DSTokens.Color.textPrimary)
                    .textSelection(.enabled)
                    .padding(DSTokens.Space.lg)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .dsBackground(DSTokens.Color.surfaceSunken, in: RoundedRectangle(cornerRadius: DSTokens.Radius.sm, style: .continuous))
            DSButton("Copy", size: .xs, emphasis: .tertiary, leadingIcon: .copy) {
                #if canImport(UIKit)
                UIPasteboard.general.string = code
                #endif
            }
        }
    }
}

struct TokenList: View {
    let tokens: [String]
    var body: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.xs) {
            ForEach(tokens, id: \.self) { token in
                VStack(alignment: .leading, spacing: 0) {
                    Text(token)
                        .dsTextStyle(DSTokens.TextStyle.codeSmMedium)
                        .dsForeground(DSTokens.Color.textPrimary)
                    Text(TokenName.swift(token))
                        .dsTextStyle(DSTokens.TextStyle.codeSmRegular)
                        .dsForeground(DSTokens.Color.textTertiary)
                }
                .accessibilityElement(children: .combine)
            }
        }
    }
}

struct PropRow: View {
    let prop: ComponentDoc.Prop
    var body: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.xxs) {
            Text(prop.name)
                .dsTextStyle(DSTokens.TextStyle.codeMdMedium)
                .dsForeground(DSTokens.Color.textPrimary)
            Text([prop.type, prop.defaultValue.map { "default \($0)" }, prop.figma.map { "Figma: \($0)" }].compactMap { $0 }.joined(separator: " · "))
                .dsTextStyle(DSTokens.TextStyle.codeSmRegular)
                .dsForeground(DSTokens.Color.textTertiary)
            Text(prop.description)
                .dsTextStyle(DSTokens.TextStyle.bodySmRegular)
                .dsForeground(DSTokens.Color.textSecondary)
        }
        .accessibilityElement(children: .combine)
    }
}

struct DoDont: View {
    let isDo: Bool
    let caption: String
    let content: AnyView
    var body: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.md) {
            Stage { content }
            HStack(alignment: .firstTextBaseline, spacing: DSTokens.Space.xs) {
                DSIconView(isDo ? .checkCircle : .xCircle, size: DSTokens.Size.iconSm)
                    .dsForeground(isDo ? DSTokens.Color.iconSuccess : DSTokens.Color.iconDanger)
                Text(isDo ? "Do" : "Don’t")
                    .dsTextStyle(DSTokens.TextStyle.bodySmSemibold)
                    .dsForeground(isDo ? DSTokens.Color.textSuccess : DSTokens.Color.textDanger)
            }
            Caption(caption)
        }
        .accessibilityElement(children: .combine)
    }
}

/// The variant matrix: a header row of column values, then one row per row value.
struct MatrixGrid: View {
    let matrix: ComponentDoc.Matrix
    var body: some View {
        ScrollView(.horizontal) {
            Grid(alignment: .leading, horizontalSpacing: DSTokens.Space.xl, verticalSpacing: DSTokens.Space.lg) {
                GridRow {
                    Color.clear.gridCellUnsizedAxes([.horizontal, .vertical])
                    ForEach(matrix.columns, id: \.self) { AxisLabel(text: $0) }
                }
                ForEach(matrix.rows, id: \.self) { row in
                    GridRow {
                        AxisLabel(text: row)
                        ForEach(matrix.columns, id: \.self) { column in
                            matrix.cell(row, column)
                        }
                    }
                }
            }
            .padding(DSTokens.Space.space2xl)
        }
        .dsBackground(DSTokens.Color.surfaceSunken, in: RoundedRectangle(cornerRadius: DSTokens.Radius.surface, style: .continuous))
    }

    private struct AxisLabel: View {
        let text: String
        var body: some View {
            Text(text)
                .dsTextStyle(DSTokens.TextStyle.codeSmMedium)
                .dsForeground(DSTokens.Color.textTertiary)
        }
    }
}

/// Figma token name → Swift member, following the generator's naming (APP.md §5), for the token map.
enum TokenName {
    static func swift(_ figma: String) -> String {
        let parts = figma.split(separator: "/").map(String.init)
        guard let domain = parts.first, parts.count > 1 else { return figma }
        let rest = camel(Array(parts.dropFirst()))
        let member = rest.first?.isNumber == true ? camel(parts) : rest
        switch domain {
        case "color": return "DSTokens.Color.\(member)"
        case "space": return "DSTokens.Space.\(member)"
        case "size": return "DSTokens.Size.\(member)"
        case "radius": return "DSTokens.Radius.\(member)"
        case "type": return "DSTokens.TextStyle.\(member)"
        case "elevation", "focus": return "DSTokens.Shadow.\(camel(parts))"
        case "border" where parts.count > 2: return "DSTokens.BorderWidth.\(camel(Array(parts.dropFirst(2))))"
        case "motion": return "DSTokens.Motion.\(member)"
        default: return "DSTokens.Component.\(camel(parts))"
        }
    }

    private static func camel(_ parts: [String]) -> String {
        let words = parts.joined(separator: "-").split(whereSeparator: { $0 == "-" || $0 == " " }).map(String.init)
        return words.enumerated().map { i, w in i == 0 ? w.lowercased() : w.prefix(1).uppercased() + w.dropFirst() }.joined()
    }
}
