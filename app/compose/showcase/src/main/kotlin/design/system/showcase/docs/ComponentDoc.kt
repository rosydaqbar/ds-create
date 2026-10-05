package design.system.showcase.docs

import androidx.compose.runtime.Composable

/*
 * The data behind one component screen. Each published Figma set gets one `{Name}Doc.kt` in this
 * folder, written from its page spec and the web story (`web/src/docs/stories/{id}-{slug}.doc.tsx`),
 * and added to DocRegistry. Words follow web/COPY-GUIDE.md.
 */

enum class DocLevel(val label: String, val slug: String) {
    Parts("Parts", "parts"),
    Components("Components", "components"),
    Sections("Sections", "sections"),
}

/** A6: one status per component and platform; a component can be Stable on the web and Beta here. */
enum class DocStatus(val label: String) { Stable("Stable"), Beta("Beta"), Deprecated("Deprecated") }

class DocExample(
    val title: String,
    val caption: String,
    val code: String,
    val render: @Composable () -> Unit,
)

class WhenToUse(val use: List<String>, val dont: List<String>)

/** One block of the variant matrix: rows × columns of real instances, titled with the Figma axes. */
class DocMatrix(
    val title: String,
    val rowProp: String,
    val rows: List<String>,
    val colProp: String,
    val cols: List<String>,
    val cell: @Composable (row: String, col: String) -> Unit,
)

/** Playground controls. Values are Figma values (`"md"`, `"primary"`) or Figma icon names. */
sealed interface PlaygroundControl {
    val name: String
    val figma: String?

    class Text(override val name: String, override val figma: String?, val default: String) : PlaygroundControl
    class Choice(override val name: String, override val figma: String?, val options: List<String>, val default: String) : PlaygroundControl
    class Toggle(override val name: String, override val figma: String?, val default: Boolean) : PlaygroundControl
    class Icon(override val name: String, override val figma: String?, val default: String? = null) : PlaygroundControl
}

val PlaygroundControl.defaultValue: Any?
    get() = when (this) {
        is PlaygroundControl.Text -> default
        is PlaygroundControl.Choice -> default
        is PlaygroundControl.Toggle -> default
        is PlaygroundControl.Icon -> default
    }

class PlaygroundValues(private val values: Map<String, Any?>) {
    fun text(name: String): String = values[name] as String
    fun choice(name: String): String = values[name] as String
    fun toggle(name: String): Boolean = values[name] as Boolean
    fun icon(name: String): String? = values[name] as String?
}

class Playground(
    val controls: List<PlaygroundControl>,
    val render: @Composable (PlaygroundValues) -> Unit,
    val code: (PlaygroundValues) -> String,
)

class AnatomyPart(val name: String, val description: String, val tokens: List<String> = emptyList())

class DocAnatomy(val render: @Composable () -> Unit, val parts: List<AnatomyPart>)

/** A prop row: the Compose name and type, and the Figma property it comes from. */
class DocProp(
    val name: String,
    val type: String,
    val description: String,
    val figma: String? = null,
    val default: String? = null,
)

class DoDont(val caption: String, val render: @Composable () -> Unit)

class DocGuideline(
    val title: String,
    val body: String,
    val render: (@Composable () -> Unit)? = null,
    val doExample: DoDont? = null,
    val dontExample: DoDont? = null,
)

class ComponentDoc(
    val id: String,
    val name: String,
    val level: DocLevel,
    /** The ds-create page spec, for example `parts/2.1-button.md`. */
    val spec: String,
    val status: DocStatus,
    /** The release the component arrived in, and the release it last changed in (A6). */
    val since: String,
    val updated: String,
    /** Fully qualified names the Code tab imports. */
    val exports: List<String>,
    val summary: String,
    val hero: @Composable () -> Unit,
    val examples: List<DocExample>,
    val whenToUse: WhenToUse,
    val playground: Playground,
    val matrices: List<DocMatrix>,
    val anatomy: DocAnatomy,
    val props: List<DocProp>,
    /** Figma token names; the Anatomy tab shows the Compose member next to each. */
    val tokens: List<String>,
    val guidelines: List<DocGuideline>,
    val accessibility: List<String>,
    /** How this component differs on Android (APP.md §6.2 "Native patterns"). */
    val platformNotes: List<String>,
    /** The basic usage snippet for the Code tab. */
    val usage: String,
) {
    /** The page's path on the web explorer, for example `parts/2.1-button`. */
    val webPath: String
        get() = "${level.slug}/$id-${name.lowercase().replace(Regex("[^a-z0-9]+"), "-").trimEnd('-')}"
}

/** Every component screen, in page order. A4 adds each new doc here. */
object DocRegistry {
    val all: List<ComponentDoc> by lazy { listOf(ButtonDoc) }

    fun find(id: String): ComponentDoc? = all.firstOrNull { it.id == id }
}

/** `general/check` → `Check`, `arrows/arrow-right` → `ArrowRight`: the DsIcons property for a Figma icon name. */
fun iconProperty(figmaName: String): String =
    figmaName.substringAfter('/').split('-').joinToString("") { part -> part.replaceFirstChar { it.uppercase() } }
