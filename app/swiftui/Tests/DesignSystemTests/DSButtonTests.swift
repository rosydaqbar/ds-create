import XCTest
import SwiftUI
@testable import DesignSystem

/// 2.1 Button: token contract, props and accessibility (APP.md §9 SwiftUI).
///
/// Run with `xcodebuild test -scheme DesignSystem -destination 'platform=iOS Simulator,name=iPhone 16'`.
@MainActor
final class DSButtonTests: XCTestCase {
    // MARK: Props match the Figma properties

    func testEnumsMatchFigmaValues() {
        XCTAssertEqual(DSButton.Size.allCases.map(\.rawValue), ["xs", "sm", "md", "lg", "xl"])
        XCTAssertEqual(DSButton.Emphasis.allCases.map(\.rawValue), ["primary", "secondary", "tertiary"])
        XCTAssertEqual(DSButton.Tone.allCases.map(\.rawValue), ["brand", "danger"])
        XCTAssertEqual(DSButton.VisualState.allCases.map(\.rawValue), ["rest", "hover", "pressed", "focus", "disabled", "loading"])
    }

    // MARK: Every value comes from a token

    func testSizesUseControlTokens() {
        XCTAssertEqual(DSButton.Size.xs.height, DSTokens.Size.controlXs)
        XCTAssertEqual(DSButton.Size.md.height, DSTokens.Size.controlMd)
        XCTAssertEqual(DSButton.Size.xl.height, DSTokens.Size.controlXl)
        XCTAssertEqual(DSButton.Size.md.paddingX, DSTokens.Component.buttonPaddingXMd)
        XCTAssertEqual(DSButton.Size.lg.gap, DSTokens.Component.buttonGapLg)
        XCTAssertEqual(DSButton.Size.md.textStyle, DSTokens.TextStyle.bodySmSemibold)
        XCTAssertEqual(DSButton.Size.lg.textStyle, DSTokens.TextStyle.bodyMdSemibold)
    }

    func testPaletteFollowsTheTokenMap() {
        typealias C = DSTokens.Color
        let primary = DSButton.palette(emphasis: .primary, tone: .brand, state: .rest)
        XCTAssertEqual(primary.fill, C.fillBrandSolid)
        XCTAssertEqual(primary.text, C.textOnSolid)
        XCTAssertNil(primary.border)

        XCTAssertEqual(DSButton.palette(emphasis: .primary, tone: .brand, state: .pressed).fill, C.fillBrandSolidPressed)
        XCTAssertEqual(DSButton.palette(emphasis: .secondary, tone: .brand, state: .hover).text, C.textPrimary)
        XCTAssertEqual(DSButton.palette(emphasis: .secondary, tone: .danger, state: .rest).border, C.borderDangerSubtle)
        XCTAssertEqual(DSButton.palette(emphasis: .tertiary, tone: .danger, state: .pressed).fill, C.fillDangerSubtlePressed)

        // Loading and focus keep the rest tokens.
        XCTAssertEqual(DSButton.palette(emphasis: .primary, tone: .danger, state: .loading), DSButton.palette(emphasis: .primary, tone: .danger, state: .rest))
        XCTAssertEqual(DSButton.palette(emphasis: .secondary, tone: .brand, state: .focus), DSButton.palette(emphasis: .secondary, tone: .brand, state: .rest))
    }

    func testDisabledIsTheSameForBothTones() {
        for emphasis in DSButton.Emphasis.allCases {
            XCTAssertEqual(
                DSButton.palette(emphasis: emphasis, tone: .brand, state: .disabled),
                DSButton.palette(emphasis: emphasis, tone: .danger, state: .disabled)
            )
            XCTAssertEqual(DSButton.palette(emphasis: emphasis, tone: .brand, state: .disabled).text, DSTokens.Color.textDisabled)
        }
    }

    func testFocusRingReplacesElevation() {
        XCTAssertEqual(DSButton.shadow(emphasis: .primary, tone: .brand, state: .focus, focused: true), DSTokens.Shadow.focusDefault)
        XCTAssertEqual(DSButton.shadow(emphasis: .tertiary, tone: .danger, state: .focus, focused: true), DSTokens.Shadow.focusDanger)
        XCTAssertEqual(DSButton.shadow(emphasis: .secondary, tone: .brand, state: .rest, focused: false), DSTokens.Shadow.elevationControl)
        XCTAssertEqual(DSButton.shadow(emphasis: .tertiary, tone: .brand, state: .rest, focused: false), [])
        XCTAssertEqual(DSButton.shadow(emphasis: .primary, tone: .brand, state: .disabled, focused: false), [])
    }

    // MARK: Touch target

    func testEverySizeReachesTheMinimumTouchTarget() {
        // The hit area expands to touchMin around any visual smaller than it.
        XCTAssertGreaterThanOrEqual(DSTokens.Size.touchMin, 44)
        for size in DSButton.Size.allCases {
            let expansion = max(0, (DSTokens.Size.touchMin - size.height) / 2)
            XCTAssertGreaterThanOrEqual(size.height + expansion * 2, 44, "\(size)")
        }
    }

    // MARK: Motion

    func testReducedMotionUsesReducedTokens() {
        let duration = DSTokens.Motion.durationBase
        XCTAssertEqual(duration.value(reduced: false), duration.standard / 1000)
        XCTAssertEqual(duration.value(reduced: true), duration.reduced / 1000)
        if duration.reduced == 0 {
            XCTAssertNil(duration.animation(DSTokens.Motion.easingStandard, reduced: true))
        }
    }

    // MARK: Accessibility (A1: fill in with ViewInspector or UI tests)
    //
    // - icon-only: the accessibility label equals `label`;
    // - loading: accessibility value "Loading", the action does not run;
    // - disabled: the element is not enabled (`.notEnabled` trait);
    // - every button has the `.isButton` trait.

    // MARK: Snapshot tests (outline)
    //
    // Add https://github.com/pointfreeco/swift-snapshot-testing to the test target, then record:
    //
    //   matrix   = Tone (brand, danger) × Emphasis (primary, secondary, tertiary) × Size (xs…xl)
    //              × State (rest, hover, pressed, focus, disabled, loading), Icon only false
    //            + Icon only true × Emphasis × State (brand)   — every Figma variant, 360 in Figma
    //   modes    = Light, Dark                                    (`.environment(\.colorScheme, …)`)
    //   sizes    = default (.large), largest (.accessibility5)    (`.dynamicTypeSize(…)`)
    //
    // One image per matrix block (the same grids the showcase draws), so a block is one file:
    //
    //   func testSnapshots() {
    //       for scheme in [ColorScheme.light, .dark] {
    //           for textSize in [DynamicTypeSize.large, .accessibility5] {
    //               for tone in DSButton.Tone.allCases {
    //                   for emphasis in DSButton.Emphasis.allCases {
    //                       let grid = ButtonMatrix(tone: tone, emphasis: emphasis)   // rows Size, columns State
    //                           .environment(\.colorScheme, scheme)
    //                           .dynamicTypeSize(textSize)
    //                       assertSnapshot(of: UIHostingController(rootView: grid), as: .image(on: .iPhone13),
    //                                      named: "\(tone)-\(emphasis)-\(scheme)-\(textSize)")
    //                   }
    //               }
    //           }
    //       }
    //   }
    //
    // Pinned states use `previewState`; disabled uses `.disabled(true)`; loading `isLoading: true`.
    // Compare against the Figma Component frame by eye once, then the snapshots guard regressions.
}
