import SwiftUI

/// Icon registry: the one place that maps the system's icon names (`Icon/{category}/{name}` on
/// 1.7 Iconography) to images. Components only ever take a `DSIcon`, never an image name.
///
/// The raw value is the Figma name, so it matches the web registry and the Figma instance swap.
/// A3 adds the 1.7 library as an asset catalog (`Resources/Icons.xcassets`, one symbol or PDF per
/// name, "Provides Namespace" on each category folder, so `general/check` is the asset name).
/// Add every name from the build's 1.7 page; this template lists a starter set.
public enum DSIcon: String, CaseIterable, Sendable, Identifiable {
    case placeholder = "general/placeholder"
    case check = "general/check"
    case minus = "general/minus"
    case plus = "general/plus"
    case x = "general/x"
    case search = "general/search"
    case moreHorizontal = "general/more-horizontal"
    case copy = "general/copy"
    case edit = "general/edit"
    case trash = "general/trash"
    case settings = "general/settings"
    case home = "general/home"
    case share = "general/share"
    case download = "general/download"
    case upload = "general/upload"
    case link = "general/link"
    case filter = "general/filter"
    case eye = "general/eye"
    case eyeOff = "general/eye-off"
    case bell = "general/bell"
    case chevronDown = "arrows/chevron-down"
    case chevronUp = "arrows/chevron-up"
    case chevronLeft = "arrows/chevron-left"
    case chevronRight = "arrows/chevron-right"
    case arrowRight = "arrows/arrow-right"
    case arrowLeft = "arrows/arrow-left"
    case externalLink = "arrows/external-link"
    case user = "users/user"
    case infoCircle = "alerts/info-circle"
    case alertCircle = "alerts/alert-circle"
    case alertTriangle = "alerts/alert-triangle"
    case checkCircle = "alerts/check-circle"
    case xCircle = "alerts/x-circle"
    case mail = "communication/mail"
    case calendar = "time/calendar"
    case lock = "security/lock"
    case play = "media/play"
    case pause = "media/pause"

    public var id: String { rawValue }

    /// Asset catalog name (A3).
    public var assetName: String { rawValue }

    /// The image to draw.
    ///
    /// STAND-IN: SF Symbols until A3 adds the 1.7 asset catalog. Then replace the body with
    /// `Image(assetName, bundle: .module)` (and add `resources: [.process("Resources")]` to the
    /// target in Package.swift). No component changes.
    public var image: Image {
        Image(systemName: standInSymbol)
    }

    /// STAND-IN mapping to SF Symbols. Delete with the asset catalog.
    private var standInSymbol: String {
        switch self {
        case .placeholder: "circle.dashed"
        case .check: "checkmark"
        case .minus: "minus"
        case .plus: "plus"
        case .x: "xmark"
        case .search: "magnifyingglass"
        case .moreHorizontal: "ellipsis"
        case .copy: "doc.on.doc"
        case .edit: "pencil"
        case .trash: "trash"
        case .settings: "gearshape"
        case .home: "house"
        case .share: "square.and.arrow.up"
        case .download: "arrow.down.to.line"
        case .upload: "arrow.up.to.line"
        case .link: "link"
        case .filter: "line.3.horizontal.decrease"
        case .eye: "eye"
        case .eyeOff: "eye.slash"
        case .bell: "bell"
        case .chevronDown: "chevron.down"
        case .chevronUp: "chevron.up"
        case .chevronLeft: "chevron.left"
        case .chevronRight: "chevron.right"
        case .arrowRight: "arrow.right"
        case .arrowLeft: "arrow.left"
        case .externalLink: "arrow.up.right.square"
        case .user: "person"
        case .infoCircle: "info.circle"
        case .alertCircle: "exclamationmark.circle"
        case .alertTriangle: "exclamationmark.triangle"
        case .checkCircle: "checkmark.circle"
        case .xCircle: "xmark.circle"
        case .mail: "envelope"
        case .calendar: "calendar"
        case .lock: "lock"
        case .play: "play"
        case .pause: "pause"
        }
    }
}

/// Draws a registry icon in a fixed square (`DSTokens.Size.icon*`), tinted by the foreground style.
/// Decorative by default: the control that holds it carries the name screen readers announce.
public struct DSIconView: View {
    let icon: DSIcon
    let size: CGFloat
    let isDecorative: Bool

    public init(_ icon: DSIcon, size: CGFloat = DSTokens.Size.iconMd, isDecorative: Bool = true) {
        self.icon = icon
        self.size = size
        self.isDecorative = isDecorative
    }

    public var body: some View {
        icon.image
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .accessibilityHidden(isDecorative)
    }
}
