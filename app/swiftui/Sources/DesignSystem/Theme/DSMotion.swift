import SwiftUI

/// A Figma motion duration with its Standard and Reduced values, in milliseconds as exported.
///
/// ```swift
/// @Environment(\.dsReduceMotion) private var reduceMotion
/// .animation(DSTokens.Motion.durationFast.animation(DSTokens.Motion.easingStandard, reduced: reduceMotion), value: state)
/// ```
public struct DSDuration: Sendable, Hashable {
    /// Milliseconds.
    public let standard: Double
    /// Milliseconds, used when the system or the showcase asks for reduced motion.
    public let reduced: Double

    public init(standard: Double, reduced: Double) {
        self.standard = standard
        self.reduced = reduced
    }

    /// Seconds, for SwiftUI animations and `Task.sleep`.
    public func value(reduced isReduced: Bool) -> TimeInterval {
        (isReduced ? reduced : standard) / 1000
    }

    /// The animation for this duration and easing, or `nil` (no animation) when it is 0.
    public func animation(_ easing: DSEasing, reduced isReduced: Bool) -> Animation? {
        let seconds = value(reduced: isReduced)
        return seconds > 0 ? easing.animation(duration: seconds) : nil
    }
}

/// A Figma easing as cubic-bezier control points (`motion/easing/standard` → `DSTokens.Motion.easingStandard`).
public struct DSEasing: Sendable, Hashable {
    public let x1: Double
    public let y1: Double
    public let x2: Double
    public let y2: Double

    public init(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double) {
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
    }

    public func animation(duration: TimeInterval) -> Animation {
        .timingCurve(x1, y1, x2, y2, duration: duration)
    }
}
