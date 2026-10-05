package design.system.showcase

import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import design.system.showcase.docs.DocLevel
import design.system.showcase.docs.DocRegistry

/** Home: the system name and version, starting points, recently updated, then every level (APP.md §7). */
@Composable
fun HomeScreen(onOpen: (Route) -> Unit) {
    val docs = DocRegistry.all
    ScreenScaffold(title = BuildConfig.DS_NAME, eyebrow = "Version ${BuildConfig.DS_VERSION}") {
        item {
            Paragraph(
                "Try every component on a real phone, in Light and Dark and at every text size. " +
                    "The controls at the bottom change every screen at once.",
            )
        }

        item { SectionHeading("Start here") }
        item { NavRow("Color", "Color roles in the current mode, with the contrast of each pair") { onOpen(Route.Color) } }
        item { NavRow("Typography", "The type scale at the current text size") { onOpen(Route.Typography) } }
        docs.firstOrNull()?.let { first ->
            item { NavRow(first.name, first.summary) { onOpen(Route.Component(first.id)) } }
        }

        // A6: sort by the release each page last changed in, from the shared changelog.
        item { SectionHeading("Recently updated") }
        items(docs.sortedByDescending { it.updated }.take(5), key = { "recent-${it.id}" }) { doc ->
            NavRow("${doc.id} ${doc.name}", "${doc.status.label} · updated in ${doc.updated}") { onOpen(Route.Component(doc.id)) }
        }

        item { SectionHeading("Foundations") }
        // A5: one row per foundation page (1.1–1.8) once its screen exists.
        item { NavRow("1.1 Color") { onOpen(Route.Color) } }
        item { NavRow("1.2 Typography") { onOpen(Route.Typography) } }

        DocLevel.entries.forEach { level ->
            val inLevel = docs.filter { it.level == level }
            if (inLevel.isNotEmpty()) {
                item { SectionHeading(level.label) }
                items(inLevel, key = { it.id }) { doc ->
                    NavRow("${doc.id} ${doc.name}", doc.status.label) { onOpen(Route.Component(doc.id)) }
                }
            }
        }
    }
}
