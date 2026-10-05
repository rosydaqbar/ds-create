import Foundation

/// System identity, shown in the showcase header and Home. Fill from the Figma build
/// (00 Cover, 1.8 Brand assets) at A3. Everything here is a placeholder until a build replaces it.
public enum DesignSystemConfig {
    public static let name = "Design System"
    public static let version = "1.0"
    /// Swift package product that ships the tokens and components.
    public static let packageName = "DesignSystem"
    /// Bundle identifier of the Showcase app target.
    public static let showcaseBundleID = "com.your-org.designsystem.showcase"
    public static let description = "Tokens, components and guidance generated with ds-create. Replace this text with the system description from 00 Cover."
    /// The web documentation site, when the system has one. Component screens link to it from Guidelines.
    public static let docsURL: URL? = nil
    /// The generated Figma file.
    public static let figmaURL: URL? = nil
}
