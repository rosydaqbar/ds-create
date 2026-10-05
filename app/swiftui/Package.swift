// swift-tools-version: 6.0
// Reference skeleton — not compiled in ds-create. The first build compiles it (APP.md A1).
import PackageDescription

let package = Package(
    name: "DesignSystem",
    defaultLocalization: "en",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "DesignSystem", targets: ["DesignSystem"]),
    ],
    targets: [
        .target(
            name: "DesignSystem",
            path: "Sources/DesignSystem",
            exclude: ["Components/COMPONENTS.md"]
            // A3: add `resources: [.process("Resources")]` with the icon and brand asset catalogs and fonts.
        ),
        .testTarget(
            name: "DesignSystemTests",
            dependencies: ["DesignSystem"],
            path: "Tests/DesignSystemTests"
            // Snapshot tests: add .product(name: "SnapshotTesting", package: "swift-snapshot-testing")
            // and the package dependency below (see Tests/DesignSystemTests/DSButtonTests.swift).
        ),
    ]
)
// The Showcase app (Showcase/) is an Xcode iOS app target that depends on this package; see README.md.
