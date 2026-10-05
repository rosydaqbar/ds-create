import SwiftUI
import DesignSystem

/// The Showcase app target: the system's documentation, on a phone (APP.md §7).
@main
struct ShowcaseApp: App {
    @State private var settings = ShowcaseSettings()

    var body: some Scene {
        WindowGroup {
            ShowcaseRoot()
                .environment(settings)
        }
    }
}

/// Global controls: Light/Dark, text size and Reduced motion, so anyone can check a component
/// under every condition without changing the device settings.
@MainActor
@Observable
final class ShowcaseSettings {
    enum Appearance: String, CaseIterable, Identifiable {
        case system = "System", light = "Light", dark = "Dark"
        var id: String { rawValue }
        var colorScheme: ColorScheme? {
            switch self {
            case .system: nil
            case .light: .light
            case .dark: .dark
            }
        }
    }

    enum Motion: String, CaseIterable, Identifiable {
        case system = "System", standard = "Standard", reduced = "Reduced"
        var id: String { rawValue }
        var reduceMotion: Bool? {
            switch self {
            case .system: nil
            case .standard: false
            case .reduced: true
            }
        }
    }

    var appearance: Appearance = .system
    /// `nil` follows the device text size.
    var textSize: DynamicTypeSize?
    var motion: Motion = .system
}

struct ShowcaseRoot: View {
    @Environment(ShowcaseSettings.self) private var settings
    @Environment(\.dynamicTypeSize) private var systemTextSize
    @State private var showsControls = false

    var body: some View {
        NavigationStack {
            HomeView()
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showsControls = true
                        } label: {
                            DSIconView(.settings, size: DSTokens.Size.iconLg)
                        }
                        .accessibilityLabel("Display settings")
                    }
                }
        }
        .sheet(isPresented: $showsControls) {
            GlobalControlsView()
                .environment(settings)
                .presentationDetents([.medium, .large])
        }
        .preferredColorScheme(settings.appearance.colorScheme)
        .dsTheme(colorScheme: settings.appearance.colorScheme, reduceMotion: settings.motion.reduceMotion)
        .dynamicTypeSize(settings.textSize ?? systemTextSize)
        .tint(DSTokens.Color.textBrand)
    }
}

/// The settings sheet. Native form controls are fine here: this is app chrome, not a specimen.
struct GlobalControlsView: View {
    @Environment(ShowcaseSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss

    private let sizes = DynamicTypeSize.allCases

    var body: some View {
        @Bindable var settings = settings
        NavigationStack {
            Form {
                Section {
                    Picker("Appearance", selection: $settings.appearance) {
                        ForEach(ShowcaseSettings.Appearance.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("Appearance")
                } footer: {
                    Text("Check every screen in Light and Dark.")
                }

                Section {
                    Toggle("Use the device text size", isOn: Binding(
                        get: { settings.textSize == nil },
                        set: { settings.textSize = $0 ? nil : .large }
                    ))
                    if let current = settings.textSize {
                        Slider(
                            value: Binding(
                                get: { Double(sizes.firstIndex(of: current) ?? 0) },
                                set: { settings.textSize = sizes[Int($0.rounded())] }
                            ),
                            in: 0...Double(sizes.count - 1),
                            step: 1
                        ) {
                            Text("Text size")
                        }
                        Text(Self.name(of: current))
                            .dsTextStyle(DSTokens.TextStyle.bodySmRegular)
                            .dsForeground(DSTokens.Color.textTertiary)
                    }
                } header: {
                    Text("Text size")
                } footer: {
                    Text("Every component should still work at the largest accessibility size.")
                }

                Section {
                    Picker("Motion", selection: $settings.motion) {
                        ForEach(ShowcaseSettings.Motion.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("Motion")
                } footer: {
                    Text("Reduced uses the Reduced motion tokens, as when Reduce Motion is on in Settings.")
                }
            }
            .navigationTitle("Display settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    static func name(of size: DynamicTypeSize) -> String {
        switch size {
        case .xSmall: "Extra small"
        case .small: "Small"
        case .medium: "Medium"
        case .large: "Large (default)"
        case .xLarge: "Extra large"
        case .xxLarge: "Extra extra large"
        case .xxxLarge: "Extra extra extra large"
        case .accessibility1: "Accessibility 1"
        case .accessibility2: "Accessibility 2"
        case .accessibility3: "Accessibility 3"
        case .accessibility4: "Accessibility 4"
        case .accessibility5: "Accessibility 5 (largest)"
        @unknown default: "Custom"
        }
    }
}
