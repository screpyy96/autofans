package ro.autofans.app.ui

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.json.JsonObject

/** Small in-process handoff used when a saved search returns to the catalog. */
object SavedSearchStore {
    private val _query = MutableStateFlow<JsonObject?>(null)
    val query = _query.asStateFlow()

    fun apply(query: JsonObject) { _query.value = query }
    fun consume() { _query.value = null }
}
