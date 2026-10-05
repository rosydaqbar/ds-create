import SwiftUI
import DesignSystem

/// One page of the ds-create tree, as the showcase lists it.
struct CatalogPage: Identifiable, Hashable {
    enum Level: String, CaseIterable {
        case foundations = "Foundations", parts = "Parts", components = "Components", sections = "Sections"
    }

    let id: String
    let name: String
    let level: Level
    /// `false` until the build adds the page's screen (A4, A5).
    let isAvailable: Bool

    var title: String { "\(id) \(name)" }
}

enum ShowcaseCatalog {
    /// Every page in page order. A build sets `isAvailable` as it adds each screen and removes
    /// pages that are out of scope.
    static let pages: [CatalogPage] = [
        .init(id: "1.1", name: "Color", level: .foundations, isAvailable: true),
        .init(id: "1.2", name: "Typography", level: .foundations, isAvailable: true),
        .init(id: "1.3", name: "Space & layout", level: .foundations, isAvailable: false),
        .init(id: "1.4", name: "Shape", level: .foundations, isAvailable: false),
        .init(id: "1.5", name: "Elevation", level: .foundations, isAvailable: false),
        .init(id: "1.6", name: "Motion", level: .foundations, isAvailable: false),
        .init(id: "1.7", name: "Iconography", level: .foundations, isAvailable: false),
        .init(id: "1.8", name: "Brand assets", level: .foundations, isAvailable: false),
        .init(id: "2.1", name: "Button", level: .parts, isAvailable: true),
        .init(id: "2.2", name: "Icon button", level: .parts, isAvailable: false),
        .init(id: "2.3", name: "Link", level: .parts, isAvailable: false),
        .init(id: "2.4", name: "Badge", level: .parts, isAvailable: false),
        .init(id: "2.5", name: "Tag", level: .parts, isAvailable: false),
        .init(id: "2.6", name: "Avatar", level: .parts, isAvailable: false),
        .init(id: "2.7", name: "Checkbox", level: .parts, isAvailable: false),
        .init(id: "2.8", name: "Radio", level: .parts, isAvailable: false),
        .init(id: "2.9", name: "Switch", level: .parts, isAvailable: false),
        .init(id: "2.10", name: "Text control", level: .parts, isAvailable: false),
        .init(id: "2.11", name: "Label", level: .parts, isAvailable: false),
        .init(id: "2.12", name: "Help text", level: .parts, isAvailable: false),
        .init(id: "2.13", name: "Tooltip", level: .parts, isAvailable: false),
        .init(id: "2.14", name: "Progress", level: .parts, isAvailable: false),
        .init(id: "2.15", name: "Spinner", level: .parts, isAvailable: false),
        .init(id: "2.16", name: "Divider", level: .parts, isAvailable: false),
        .init(id: "2.17", name: "Kbd", level: .parts, isAvailable: false),
        .init(id: "2.18", name: "Slider", level: .parts, isAvailable: false),
        .init(id: "2.19", name: "Featured icon", level: .parts, isAvailable: false),
        .init(id: "3.1", name: "Button group", level: .components, isAvailable: false),
        .init(id: "3.2", name: "Text field", level: .components, isAvailable: false),
        .init(id: "3.3", name: "Choice field", level: .components, isAvailable: false),
        .init(id: "3.4", name: "Avatar group", level: .components, isAvailable: false),
        .init(id: "3.5", name: "Select", level: .components, isAvailable: false),
        .init(id: "3.6", name: "Menu", level: .components, isAvailable: false),
        .init(id: "3.7", name: "Social button", level: .components, isAvailable: false),
        .init(id: "3.8", name: "Badge group", level: .components, isAvailable: false),
        .init(id: "4.1", name: "Rich text editor", level: .sections, isAvailable: false),
        .init(id: "4.2", name: "Video player", level: .sections, isAvailable: false),
    ]

    /// The screen for a page. Add one case per screen as the build adds it.
    @MainActor @ViewBuilder
    static func destination(for page: CatalogPage) -> some View {
        switch page.id {
        case "1.1": ColorView()
        case "1.2": TypographyView()
        case "2.1": ComponentScreen(doc: ButtonDoc.doc)
        default: ContentUnavailableView(page.title, systemImage: "hammer", description: Text("This screen arrives when the page is built."))
        }
    }

    static var startingPoints: [CatalogPage] { pages.filter { ["1.1", "1.2", "2.1"].contains($0.id) } }
    /// From the changelog (A6). Placeholder until the first release.
    static var recentlyUpdated: [CatalogPage] { pages.filter { $0.id == "2.1" } }
}

struct HomeView: View {
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                    Text(DesignSystemConfig.name)
                        .dsTextStyle(DSTokens.TextStyle.headingLgSemibold)
                        .dsForeground(DSTokens.Color.textPrimary)
                    Text("Version \(DesignSystemConfig.version)")
                        .dsTextStyle(DSTokens.TextStyle.bodySmMedium)
                        .dsForeground(DSTokens.Color.textTertiary)
                    Text(DesignSystemConfig.description)
                        .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                        .dsForeground(DSTokens.Color.textSecondary)
                }
                .padding(.vertical, DSTokens.Space.md)
            }

            Section("Starting points") {
                ForEach(ShowcaseCatalog.startingPoints) { row($0) }
            }

            Section("Recently updated") {
                ForEach(ShowcaseCatalog.recentlyUpdated) { row($0) }
            }

            ForEach(CatalogPage.Level.allCases, id: \.self) { level in
                Section(level.rawValue) {
                    ForEach(ShowcaseCatalog.pages.filter { $0.level == level }) { row($0) }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .dsBackground(DSTokens.Color.surfaceSunken)
        .navigationTitle("Home")
        .navigationDestination(for: CatalogPage.self) { page in
            ShowcaseCatalog.destination(for: page)
        }
    }

    @ViewBuilder
    private func row(_ page: CatalogPage) -> some View {
        if page.isAvailable {
            NavigationLink(value: page) {
                Text(page.title)
                    .dsTextStyle(DSTokens.TextStyle.bodyMdMedium)
                    .dsForeground(DSTokens.Color.textPrimary)
            }
            .listRowBackground(Rectangle().fill(DSTokens.Color.surfaceBase))
        } else {
            HStack {
                Text(page.title)
                    .dsTextStyle(DSTokens.TextStyle.bodyMdRegular)
                    .dsForeground(DSTokens.Color.textDisabled)
                Spacer()
                Text("Not built yet")
                    .dsTextStyle(DSTokens.TextStyle.bodyXsMedium)
                    .dsForeground(DSTokens.Color.textTertiary)
            }
            .accessibilityElement(children: .combine)
            .listRowBackground(Rectangle().fill(DSTokens.Color.surfaceBase))
        }
    }
}
