package ro.autofans.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import ro.autofans.app.data.MobileApi

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionRoute(
    api: MobileApi,
    kind: String,
    onBack: () -> Unit,
    onCatalog: () -> Unit,
    onListing: (String) -> Unit,
    embedded: Boolean = false,
) {
    val operation = when (kind) { "saved" -> "saved_searches"; "notifications" -> "notifications"; else -> "favorites" }
    val key = when (kind) { "saved" -> "searches"; "notifications" -> "notifications"; else -> "favorites" }
    val title = when (kind) { "saved" -> "Căutări salvate"; "notifications" -> "Notificări"; else -> "Favorite" }
    var rows by remember { mutableStateOf(emptyList<JsonObject>()) }
    var error by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<JsonObject?>(null) }
    var name by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    fun reload() = scope.launch {
        runCatching { api.call(operation)[key]?.jsonArray?.map { it.jsonObject }.orEmpty() }
            .onSuccess { rows = it; error = null }
            .onFailure { error = it.message }
    }

    LaunchedEffect(kind) { reload() }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (!embedded) {
                TopAppBar(
                    title = { Text(title, fontWeight = FontWeight.ExtraBold) },
                    navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi") } },
                )
            }
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (kind == "favorites") {
                item { FavoritesHero(count = rows.size) }
            }
            error?.let { message -> item { CollectionError(message) } }
            if (rows.isEmpty() && error == null) {
                item {
                    if (kind == "favorites") FavoritesEmpty(onCatalog)
                    else Text("Nu există elemente încă.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            items(rows, key = { it["id"]?.jsonPrimitive?.content ?: it["listing_id"]?.jsonPrimitive?.content ?: "" }) { row ->
                when (kind) {
                    "favorites" -> FavoriteListingCard(
                        row = row,
                        onListing = onListing,
                        onRemove = { listingId ->
                            scope.launch {
                                runCatching { api.call("toggle_favorite", buildJsonObject { put("listingId", listingId) }) }
                                    .onSuccess { reload() }
                                    .onFailure { error = it.message ?: "Nu am putut elimina favoritul." }
                            }
                        },
                    )
                    else -> CollectionRow(
                        row = row,
                        kind = kind,
                        onCatalog = onCatalog,
                        onEdit = { editing = row; name = row["name"]?.jsonPrimitive?.content.orEmpty() },
                        onDelete = { id -> scope.launch { api.call("delete_saved_search", buildJsonObject { put("id", id) }); reload() } },
                        onRead = { id -> scope.launch { api.call("read_notification", buildJsonObject { put("id", id) }); reload() } },
                    )
                }
            }
        }
    }

    editing?.let { search ->
        AlertDialog(
            onDismissRequest = { editing = null },
            title = { Text("Redenumește căutarea") },
            text = { OutlinedTextField(name, { name = it }, label = { Text("Nume") }, singleLine = true) },
            confirmButton = {
                Button(enabled = name.isNotBlank(), onClick = {
                    val id = search["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: return@Button
                    scope.launch {
                        runCatching { api.call("update_saved_search", buildJsonObject { put("id", id); put("name", name) }) }
                            .onSuccess { editing = null; reload() }
                            .onFailure { error = it.message }
                    }
                }) { Text("Salvează") }
            },
            dismissButton = { TextButton(onClick = { editing = null }) { Text("Renunță") } },
        )
    }
}

@Composable
private fun FavoritesHero(count: Int) {
    Surface(shape = RoundedCornerShape(26.dp), color = MaterialTheme.colorScheme.secondary) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .14f), modifier = Modifier.size(52.dp)) {
                Icon(Icons.Default.Favorite, null, modifier = Modifier.padding(14.dp), tint = MaterialTheme.colorScheme.onSecondary)
            }
            Column(Modifier.weight(1f)) {
                Text("Mașinile tale favorite", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSecondary)
                Text(if (count == 1) "1 anunț salvat pentru mai târziu" else "$count anunțuri salvate pentru mai târziu", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .76f))
            }
        }
    }
}

@Composable
private fun FavoriteListingCard(row: JsonObject, onListing: (String) -> Unit, onRemove: (Long) -> Unit) {
    val listing = row.listingObject()
    val listingId = row["listing_id"]?.jsonPrimitive?.content?.toLongOrNull()
    val title = listing?.get("title")?.jsonPrimitive?.content ?: "Anunț indisponibil"
    val price = listing?.get("price")?.jsonPrimitive?.content
    val currency = listing?.get("currency")?.jsonPrimitive?.content ?: "EUR"
    val facts = listOfNotNull(
        listing?.get("year")?.jsonPrimitive?.content,
        listing?.get("mileage")?.jsonPrimitive?.content?.let { "$it km" },
        listing?.get("fuel_type")?.jsonPrimitive?.content,
        listing?.get("transmission")?.jsonPrimitive?.content,
    )

    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column {
            Box(
                modifier = Modifier.fillMaxWidth().height(92.dp)
                    .background(Brush.linearGradient(listOf(MaterialTheme.colorScheme.secondary, Color(0xFF173A6B)))),
            ) {
                Surface(
                    modifier = Modifier.padding(14.dp).align(Alignment.TopStart),
                    shape = RoundedCornerShape(50),
                    color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .14f),
                ) { Text("FAVORIT", modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSecondary) }
                Icon(Icons.Default.Favorite, null, modifier = Modifier.align(Alignment.CenterEnd).padding(end = 20.dp).size(42.dp), tint = MaterialTheme.colorScheme.onSecondary.copy(alpha = .88f))
            }
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                price?.let { Text("$it $currency", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary) }
                if (facts.isNotEmpty()) {
                    Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
                        Text(facts.joinToString("  •  "), modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
                listing?.get("city")?.jsonPrimitive?.content?.takeIf { it.isNotBlank() }?.let { city ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(5.dp)); Text(city, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    listing?.get("slug")?.jsonPrimitive?.content?.let { slug ->
                        TextButton(onClick = { onListing(slug) }) { Text("Vezi anunțul"); Spacer(Modifier.width(4.dp)); Icon(Icons.AutoMirrored.Filled.ArrowForward, null, modifier = Modifier.size(16.dp)) }
                    }
                    Spacer(Modifier.weight(1f))
                    if (listingId != null) {
                        IconButton(onClick = { onRemove(listingId) }) { Icon(Icons.Default.DeleteOutline, "Elimină din favorite", tint = MaterialTheme.colorScheme.error) }
                    }
                }
            }
        }
    }
}

@Composable
private fun FavoritesEmpty(onCatalog: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 58.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(76.dp)) {
            Icon(Icons.Default.Favorite, null, modifier = Modifier.padding(21.dp), tint = MaterialTheme.colorScheme.primary)
        }
        Text("Încă nu ai favorite", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Text("Salvează mașinile care îți plac și le găsești rapid aici.", modifier = Modifier.padding(horizontal = 28.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
        FilledTonalButton(onClick = onCatalog) { Text("Caută mașini") }
    }
}

@Composable
private fun CollectionRow(
    row: JsonObject,
    kind: String,
    onCatalog: () -> Unit,
    onEdit: () -> Unit,
    onDelete: (Long) -> Unit,
    onRead: (Long) -> Unit,
) {
    Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .65f))) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (kind == "saved") row["name"]?.jsonPrimitive?.content.orEmpty() else row["title"]?.jsonPrimitive?.content.orEmpty(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            row["body"]?.jsonPrimitive?.content?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            if (kind == "saved") {
                Row {
                    TextButton(onClick = { row["query"]?.jsonObject?.let { SavedSearchStore.apply(it); onCatalog() } }) { Text("Aplică") }
                    TextButton(onClick = onEdit) { Text("Redenumește") }
                    TextButton(onClick = { row["id"]?.jsonPrimitive?.content?.toLongOrNull()?.let(onDelete) }) { Text("Șterge") }
                }
            }
            if (kind == "notifications" && row["read_at"]?.toString() == "null") {
                TextButton(onClick = { row["id"]?.jsonPrimitive?.content?.toLongOrNull()?.let(onRead) }) { Text("Marchează citit") }
            }
        }
    }
}

@Composable
private fun CollectionError(message: String) = Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.errorContainer) {
    Text(message, modifier = Modifier.padding(14.dp), color = MaterialTheme.colorScheme.onErrorContainer, style = MaterialTheme.typography.bodySmall)
}

private fun JsonObject.listingObject(): JsonObject? = when (val value = this["listings"]) {
    is JsonObject -> value
    is JsonArray -> value.firstOrNull()?.jsonObject
    else -> null
}
