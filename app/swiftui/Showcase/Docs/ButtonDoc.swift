import SwiftUI
import DesignSystem

/// 2.1 Button: the reference doc. Content follows `web/src/docs/stories/2.1-button.doc.tsx`,
/// adapted to SwiftUI (props, code and platform notes); words follow `web/COPY-GUIDE.md`.
@MainActor
enum ButtonDoc {
    static let sizes = DSButton.Size.allCases.map(\.rawValue)
    static let states = ["rest", "hover", "pressed", "focus", "disabled", "loading"]
    static let emphases = DSButton.Emphasis.allCases.map(\.rawValue)

    /// One Figma variant: `State` → `previewState`, `.disabled` or `isLoading`.
    static func variant(size: DSButton.Size = .md, emphasis: DSButton.Emphasis, tone: DSButton.Tone, state: String, iconOnly: Bool = false) -> AnyView {
        AnyView(
            DSButton(
                state == "loading" ? "Saving…" : "Button",
                size: size,
                emphasis: emphasis,
                tone: tone,
                leadingIcon: iconOnly ? .plus : nil,
                iconOnly: iconOnly,
                isLoading: state == "loading",
                previewState: DSButton.PreviewState(rawValue: state)
            ) {}
            .disabled(state == "disabled")
        )
    }

    static var doc: ComponentDoc {
        ComponentDoc(
            id: "2.1",
            name: "Button",
            level: .parts,
            status: .beta,
            since: "1.0",
            spec: "parts/2.1-button.md",
            summary: "Buttons start actions, like saving a form, creating a project or confirming a delete. Choose the emphasis by how important the action is on the screen, and the size by the space around it.",
            hero: AnyView(DSButton("Save changes", size: .lg, leadingIcon: .check) {}),
            examples: examples,
            whenToUse: [
                "For actions that change data or move a task forward: save, submit, create, delete.",
                "For the main action in a dialog, form or screen header.",
            ],
            whenNotToUse: [
                "For navigation to another screen, use a Link (2.3).",
                "For a compact tool action without a label, use an Icon button (2.2).",
                "For several related options that stay visible, use a Button group (3.1).",
            ],
            matrices: matrices,
            playground: AnyView(ButtonPlayground()),
            anatomySpecimen: AnyView(
                HStack(spacing: DSTokens.Space.xl) {
                    DSButton("Button", leadingIcon: .plus, trailingIcon: .arrowRight) {}
                    DSButton("Saving…", isLoading: true) {}
                }
            ),
            anatomy: [
                .init(name: "Root", description: "The tappable container. Its height and padding are set by the size.", tokens: ["size/control/md", "button/padding-x/md", "radius/control"]),
                .init(name: "Leading icon", description: "An optional icon before the label. While loading, a spinner takes its place.", tokens: ["size/icon/md"]),
                .init(name: "Text padding", description: "A thin inset around the label that evens out the space, so buttons with and without icons both look centered.", tokens: ["space/optical"]),
                .init(name: "Label", description: "One line of text that sets the button’s width. Larger sizes use a larger text style.", tokens: ["type/body/sm/semibold"]),
                .init(name: "Trailing icon", description: "An optional icon after the label. It hides while the button is loading.", tokens: []),
                .init(name: "Spinner", description: "A Spinner (2.15) that replaces the leading icon while loading, in the same color as the label.", tokens: []),
            ],
            props: [
                .init(name: "label", figma: "Label", type: "String", defaultValue: nil, description: "The visible label. When iconOnly is set, it becomes the name VoiceOver announces."),
                .init(name: "size", figma: "Size", type: "DSButton.Size", defaultValue: ".md", description: "Sets the height, padding, gap and label style."),
                .init(name: "emphasis", figma: "Emphasis", type: "DSButton.Emphasis", defaultValue: ".primary", description: "Primary is a solid fill, secondary a bordered surface, and tertiary has no container."),
                .init(name: "tone", figma: "Tone", type: "DSButton.Tone", defaultValue: ".brand", description: "Use danger for destructive actions."),
                .init(name: "leadingIcon", figma: "Show leading icon + Leading icon", type: "DSIcon?", defaultValue: "nil", description: "The icon before the label, or the only icon when iconOnly is set."),
                .init(name: "trailingIcon", figma: "Show trailing icon + Trailing icon", type: "DSIcon?", defaultValue: "nil", description: "The icon after the label."),
                .init(name: "iconOnly", figma: "Icon only", type: "Bool", defaultValue: "false", description: "Makes a square button with one icon. The label becomes its accessibility label."),
                .init(name: "isLoading", figma: "State=loading", type: "Bool", defaultValue: "false", description: "Shows a spinner in the leading slot, ignores taps and adds the accessibility value “Loading”."),
                .init(name: "showLoadingText", figma: "Show loading text", type: "Bool", defaultValue: "true", description: "Keeps the label next to the spinner while loading."),
                .init(name: "fullWidth", figma: nil, type: "Bool", defaultValue: "false", description: "Stretches the button to fill its container. The content stays centered."),
                .init(name: ".disabled(_:)", figma: "State=disabled", type: "View modifier", defaultValue: "false", description: "The standard SwiftUI modifier. VoiceOver reads the button as dimmed."),
                .init(name: "action", figma: nil, type: "@MainActor () -> Void", defaultValue: nil, description: "Runs on tap, on Return or Space with a hardware keyboard, and on VoiceOver activate."),
                .init(name: "previewState", figma: "State", type: "DSButton.PreviewState?", defaultValue: "nil", description: "For documentation only. Pins a hover, pressed or focus state.", isInternal: true),
            ],
            tokens: [
                "color/fill/brand/solid", "color/fill/brand/solid/hover", "color/fill/brand/solid/pressed", "color/text/on-solid",
                "color/surface/base", "color/surface/base/hover", "color/surface/base/pressed", "color/border/default", "color/text/secondary", "color/text/primary",
                "color/fill/neutral/subtle/hover", "color/fill/neutral/subtle/pressed",
                "color/fill/danger/solid", "color/fill/danger/solid/hover", "color/fill/danger/subtle/hover", "color/border/danger/subtle", "color/text/danger",
                "color/fill/neutral/subtle/disabled", "color/border/disabled", "color/text/disabled",
                "radius/control", "size/control/md", "button/padding-x/md", "button/gap/md", "space/optical", "size/icon/md", "size/touch-min",
                "type/body/sm/semibold", "elevation/control", "focus/default", "focus/danger", "motion/duration/fast", "motion/easing/standard",
            ],
            guidelines: guidelines,
            accessibility: [
                "Label text meets contrast requirements against the fill in every state. Disabled buttons are exempt, but stay legible.",
                "Every button has a tappable area of at least 44 × 44 pt, even when the small sizes look smaller.",
                "With a hardware keyboard, focus always shows a visible ring (focus/default, or focus/danger on danger buttons) that looks different from hover.",
                "While loading, the button ignores taps. VoiceOver reads the progress label and the value “Loading”, such as “Saving…, Loading, Button”.",
                "Icon-only buttons use label as the name VoiceOver announces.",
            ],
            platformNotes: [
                "Small sizes keep their look, but the tappable area grows to 44 × 44 pt. Keep at least a small gap between small buttons so their tappable areas don’t overlap.",
                "Pressed comes from the touch, hover appears with a pointer on iPad, and focus appears with a hardware keyboard.",
                "At accessibility text sizes the label can wrap and the button grows taller, so the text is never cut off.",
                "Reduced motion removes the color transition between states.",
                "Icon-only buttons show their tooltip on long-press and give VoiceOver a hint with the same text.",
            ],
            code: """
            import DesignSystem

            DSButton("Save changes", leadingIcon: .check) {
                save()
            }

            DSButton("Delete project", tone: .danger) {
                delete()
            }

            DSButton("Add", leadingIcon: .plus, iconOnly: true) {
                add()
            }

            DSButton("Saving…", isLoading: true) {}
            """
        )
    }

    // MARK: Overview examples

    private static var examples: [ComponentDoc.Example] {
        [
            .init(
                title: "Dialog footer",
                caption: "Use one primary action per view, and let the secondary action support it.",
                code: """
                HStack(spacing: DSTokens.Space.md) {
                    DSButton("Cancel", emphasis: .secondary) { dismiss() }
                    DSButton("Save changes") { save() }
                }
                """,
                content: AnyView(HStack(spacing: DSTokens.Space.md) {
                    DSButton("Cancel", emphasis: .secondary) {}
                    DSButton("Save changes") {}
                })
            ),
            .init(
                title: "Delete confirmation",
                caption: "Give the danger tone only to the action that has the consequence.",
                code: """
                DSButton("Cancel", emphasis: .secondary) { dismiss() }
                DSButton("Delete project", tone: .danger) { delete() }
                """,
                content: AnyView(HStack(spacing: DSTokens.Space.md) {
                    DSButton("Cancel", emphasis: .secondary) {}
                    DSButton("Delete project", tone: .danger) {}
                })
            ),
            .init(
                title: "Screen header actions",
                caption: "Three levels of emphasis let the main action stand out from the rest.",
                code: """
                DSButton("Export", emphasis: .tertiary, leadingIcon: .download) { export() }
                DSButton("Share", emphasis: .secondary) { share() }
                DSButton("New report", leadingIcon: .plus) { create() }
                """,
                content: AnyView(HStack(spacing: DSTokens.Space.md) {
                    DSButton("Export", emphasis: .tertiary, leadingIcon: .download) {}
                    DSButton("Share", emphasis: .secondary) {}
                    DSButton("New report", leadingIcon: .plus) {}
                })
            ),
            .init(
                title: "Form submit in progress",
                caption: "While it saves, the button keeps its place and width, so the layout doesn’t jump.",
                code: """
                DSButton("Cancel", emphasis: .secondary) {}.disabled(true)
                DSButton("Saving…", isLoading: true) {}
                """,
                content: AnyView(HStack(spacing: DSTokens.Space.md) {
                    DSButton("Cancel", emphasis: .secondary) {}.disabled(true)
                    DSButton("Saving…", isLoading: true) {}
                })
            ),
            .init(
                title: "Full-width action",
                caption: "On a phone, the main action of a form can span the screen so it’s easy to reach.",
                code: """
                DSButton("Continue", size: .lg, fullWidth: true) { next() }
                """,
                content: AnyView(DSButton("Continue", size: .lg, fullWidth: true) {}.frame(width: DSTokens.Size.widthXxs))
            ),
        ]
    }

    // MARK: Component matrices

    private static var matrices: [ComponentDoc.Matrix] {
        var list: [ComponentDoc.Matrix] = []
        for tone in DSButton.Tone.allCases {
            for emphasis in DSButton.Emphasis.allCases {
                list.append(.init(
                    title: "Tone=\(tone.rawValue) · Emphasis=\(emphasis.rawValue)",
                    rowAxis: "Size",
                    columnAxis: "State",
                    rows: sizes,
                    columns: states,
                    cell: { row, column in
                        variant(size: DSButton.Size(rawValue: row) ?? .md, emphasis: emphasis, tone: tone, state: column)
                    }
                ))
            }
        }
        list.append(.init(
            title: "Icon only=true",
            rowAxis: "Emphasis",
            columnAxis: "State",
            rows: emphases,
            columns: states,
            cell: { row, column in
                variant(emphasis: DSButton.Emphasis(rawValue: row) ?? .primary, tone: .brand, state: column, iconOnly: true)
            }
        ))
        return list
    }

    // MARK: Guidelines

    private static var guidelines: [ComponentDoc.Guideline] {
        [
            .init(
                title: "Make buttons look clickable",
                body: "People spot a button by its container, border, contrast and the way it reacts when they press it. Take those cues away and the same label reads as plain text.",
                doExample: ("A real button, with a visible container and states.", AnyView(DSButton("Upload files", leadingIcon: .upload) {})),
                dontExample: ("Text styled like a label doesn’t look tappable.", AnyView(
                    Text("Upload files")
                        .dsTextStyle(DSTokens.TextStyle.bodySmSemibold)
                        .dsForeground(DSTokens.Color.textSecondary)
                ))
            ),
            .init(
                title: "Use one primary action",
                body: "Primary, secondary and tertiary emphasis set a clear order of importance. Keep one primary action per view or dialog, so the next step is obvious.",
                doExample: ("One primary action, backed by secondary and tertiary.", AnyView(HStack(spacing: DSTokens.Space.md) {
                    DSButton("Skip", emphasis: .tertiary) {}
                    DSButton("Back", emphasis: .secondary) {}
                    DSButton("Continue") {}
                })),
                dontExample: ("Three primary buttons fight for attention.", AnyView(HStack(spacing: DSTokens.Space.md) {
                    DSButton("Skip") {}
                    DSButton("Back") {}
                    DSButton("Continue") {}
                }))
            ),
            .init(
                title: "Save the danger tone for real consequences",
                body: "Not every negative action is dangerous. Use the danger tone only on the button that does the damage, like delete, remove or revoke. Cancel is the safe way out, so it stays neutral.",
                doExample: ("Danger on “Delete project”, the action with the consequence.", AnyView(DSButton("Delete project", tone: .danger) {})),
                dontExample: ("Danger on “Cancel”, which is the safe choice.", AnyView(DSButton("Cancel", emphasis: .secondary, tone: .danger) {}))
            ),
            .init(
                title: "Balance buttons optically",
                body: "Icons carry a little empty space inside their box, which can make a button look off-center. To fix it, the label gets a small extra padding on each side and the outer padding shrinks by the same amount. Buttons with and without icons then look evenly centered.",
                example: AnyView(VStack(alignment: .leading, spacing: DSTokens.Space.md) {
                    DSButton("Label only", emphasis: .secondary) {}
                    DSButton("Leading icon", emphasis: .secondary, leadingIcon: .plus) {}
                    DSButton("Trailing icon", emphasis: .secondary, trailingIcon: .arrowRight) {}
                })
            ),
            .init(
                title: "Content",
                body: "Write labels as a verb, or a verb and a noun: “Save changes”, “Delete project”. Use sentence case and aim for three words or fewer.\n\nWhile loading, say what’s happening (“Saving…”). Icon-only buttons need a name for VoiceOver and a Tooltip (2.13)."
            ),
        ]
    }
}

/// The Component tab playground. Its controls are native stand-ins until the system's own
/// controls exist: swap in DSTextField (3.2), DSSelect (3.5) and DSSwitch (2.9) as they are built.
private struct ButtonPlayground: View {
    @State private var label = "Button"
    @State private var size: DSButton.Size = .md
    @State private var emphasis: DSButton.Emphasis = .primary
    @State private var tone: DSButton.Tone = .brand
    @State private var leadingIcon: DSIcon?
    @State private var trailingIcon: DSIcon?
    @State private var iconOnly = false
    @State private var isLoading = false
    @State private var isDisabled = false

    var body: some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.xl) {
            Stage {
                DSButton(label, size: size, emphasis: emphasis, tone: tone, leadingIcon: leadingIcon, trailingIcon: trailingIcon, iconOnly: iconOnly, isLoading: isLoading) {}
                    .disabled(isDisabled)
            }
            CodeBlock(code: code)

            VStack(alignment: .leading, spacing: DSTokens.Space.lg) {
                TextField("Label", text: $label)
                    .textFieldStyle(.roundedBorder)
                picker("Size", selection: $size, options: DSButton.Size.allCases) { $0.rawValue }
                picker("Emphasis", selection: $emphasis, options: DSButton.Emphasis.allCases) { $0.rawValue }
                picker("Tone", selection: $tone, options: DSButton.Tone.allCases) { $0.rawValue }
                iconPicker("Leading icon", selection: $leadingIcon)
                iconPicker("Trailing icon", selection: $trailingIcon)
                Toggle("Icon only", isOn: $iconOnly)
                Toggle("Loading", isOn: $isLoading)
                Toggle("Disabled", isOn: $isDisabled)
            }
            .dsTextStyle(DSTokens.TextStyle.bodySmMedium)
            .dsForeground(DSTokens.Color.textPrimary)
        }
    }

    private func picker<T: Hashable>(_ title: String, selection: Binding<T>, options: [T], name: @escaping (T) -> String) -> some View {
        VStack(alignment: .leading, spacing: DSTokens.Space.xs) {
            Text(title)
            Picker(title, selection: selection) {
                ForEach(options, id: \.self) { Text(name($0)).tag($0) }
            }
            .pickerStyle(.segmented)
        }
    }

    private func iconPicker(_ title: String, selection: Binding<DSIcon?>) -> some View {
        Picker(title, selection: selection) {
            Text("None").tag(DSIcon?.none)
            ForEach(DSIcon.allCases) { Text($0.rawValue).tag(DSIcon?.some($0)) }
        }
        .pickerStyle(.menu)
    }

    /// Copy-ready Swift for the current settings, defaults left out.
    private var code: String {
        var args = ["\"\(label)\""]
        if size != .md { args.append("size: .\(size.rawValue)") }
        if emphasis != .primary { args.append("emphasis: .\(emphasis.rawValue)") }
        if tone != .brand { args.append("tone: .\(tone.rawValue)") }
        if let leadingIcon { args.append("leadingIcon: .\(String(describing: leadingIcon))") }
        if let trailingIcon { args.append("trailingIcon: .\(String(describing: trailingIcon))") }
        if iconOnly { args.append("iconOnly: true") }
        if isLoading { args.append("isLoading: true") }
        var line = "DSButton(\(args.joined(separator: ", "))) { }"
        if isDisabled { line += "\n.disabled(true)" }
        return line
    }
}
