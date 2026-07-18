package ro.autofans.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.PublishedWithChanges
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import ro.autofans.app.data.MobileApi

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SellerListingsRoute(api: MobileApi, onBack: () -> Unit, onEdit: (Long) -> Unit) {
    var listings by remember { mutableStateOf(emptyList<JsonObject>()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var listingToDelete by remember { mutableStateOf<JsonObject?>(null) }
    val scope = rememberCoroutineScope()
    fun reload() = scope.launch {
        loading = true
        runCatching { api.call("seller_listings")["listings"]?.jsonArray?.map { it as JsonObject }.orEmpty() }
            .onSuccess { listings = it; error = null }
            .onFailure { error = it.message ?: "Nu am putut încărca anunțurile." }
        loading = false
    }
    fun setStatus(listing: JsonObject) = scope.launch {
        val id = listing["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: return@launch
        val newStatus = if (listing["status"]?.jsonPrimitive?.content == "draft") "published" else "draft"
        runCatching { api.call("set_listing_status", buildJsonObject { put("id", id); put("status", newStatus) }) }
            .onSuccess { reload() }
            .onFailure { error = it.message ?: "Nu am putut actualiza anunțul." }
    }
    LaunchedEffect(Unit) { reload() }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TopAppBar(title = { Text("Anunțurile mele", fontWeight = FontWeight.Bold) }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi") } }) },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding).fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            item { SellerSummary(listings) }
            error?.let { item { SellerError(it) } }
            if (loading) {
                item { Box(Modifier.fillMaxWidth().padding(top = 44.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            } else if (listings.isEmpty()) {
                item { SellerListingsEmpty() }
            } else {
                items(listings, key = { it["id"]?.jsonPrimitive?.content ?: "" }) { listing ->
                    SellerListingCard(listing, onEdit = onEdit, onToggleStatus = { setStatus(listing) }, onDelete = { listingToDelete = listing })
                }
            }
        }
    }
    listingToDelete?.let { listing ->
        val id = listing["id"]?.jsonPrimitive?.content?.toLongOrNull()
        AlertDialog(
            onDismissRequest = { listingToDelete = null },
            title = { Text("Ștergi anunțul?") },
            text = { Text("Anunțul va fi eliminat definitiv și nu mai poate fi recuperat.") },
            confirmButton = {
                TextButton(onClick = {
                    if (id == null) return@TextButton
                    scope.launch {
                        runCatching { api.call("delete_listing", buildJsonObject { put("id", id) }) }
                            .onSuccess { listingToDelete = null; reload() }
                            .onFailure { error = it.message ?: "Nu am putut șterge anunțul." }
                    }
                }) { Text("Șterge", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { listingToDelete = null }) { Text("Renunță") } },
        )
    }
}

@Composable
private fun SellerSummary(listings: List<JsonObject>) {
    val published = listings.count { it["status"]?.jsonPrimitive?.content == "published" }
    Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.secondary) {
        Column(Modifier.padding(20.dp)) {
            Text("Garajul tău AutoFans", color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .72f), style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(5.dp))
            Text("${listings.size} anunțuri · $published publicate", color = MaterialTheme.colorScheme.onSecondary, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(12.dp))
            Text("Editează detaliile, păstrează drafturile sau retrage temporar un anunț.", color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .78f), style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun SellerListingCard(listing: JsonObject, onEdit: (Long) -> Unit, onToggleStatus: () -> Unit, onDelete: () -> Unit) {
    val id = listing["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: 0L
    val status = listing["status"]?.jsonPrimitive?.content ?: "draft"
    val isPublished = status == "published"
    val title = listing["title"]?.jsonPrimitive?.content ?: "Anunț"
    val price = listing["price"]?.jsonPrimitive?.content.orEmpty()
    val currency = listing["currency"]?.jsonPrimitive?.content ?: "EUR"
    val details = listOfNotNull(listing["year"]?.jsonPrimitive?.content, listing["mileage"]?.jsonPrimitive?.content?.let { "$it km" }).joinToString(" · ")
    ElevatedCard(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(22.dp), colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface), elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(13.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(16.dp), color = if (isPublished) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.size(56.dp)) {
                    Icon(Icons.Default.DirectionsCar, null, modifier = Modifier.padding(15.dp), tint = if (isPublished) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Spacer(Modifier.width(13.dp))
                Column(Modifier.weight(1f)) {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    if (details.isNotBlank()) Text(details, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$price $currency", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                }
                StatusPill(isPublished)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                FilledTonalButton(onClick = { onEdit(id) }, modifier = Modifier.weight(1f)) { Icon(Icons.Default.Edit, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.width(6.dp)); Text("Editează") }
                OutlinedButton(onClick = onToggleStatus, modifier = Modifier.weight(1f)) { Icon(if (isPublished) Icons.Default.Visibility else Icons.Default.PublishedWithChanges, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.width(6.dp)); Text(if (isPublished) "Retrage" else "Publică") }
            }
            TextButton(onClick = onDelete, modifier = Modifier.align(Alignment.End)) { Icon(Icons.Default.DeleteOutline, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.width(5.dp)); Text("Șterge", color = MaterialTheme.colorScheme.error) }
        }
    }
}

@Composable
private fun StatusPill(published: Boolean) = Surface(shape = RoundedCornerShape(50), color = if (published) Color(0xFFE5F5EA) else MaterialTheme.colorScheme.surfaceVariant) {
    Text(if (published) "Publicat" else "Draft", modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = if (published) Color(0xFF166534) else MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun SellerListingsEmpty() = Column(Modifier.fillMaxWidth().padding(top = 42.dp), horizontalAlignment = Alignment.CenterHorizontally) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(76.dp)) { Icon(Icons.Default.DirectionsCar, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(20.dp)) }
    Spacer(Modifier.height(18.dp)); Text("Garajul tău e liber", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(7.dp)); Text("Primul anunț pe care îl creezi apare aici.", color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun SellerError(message: String) = Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.error.copy(alpha = .10f)) {
    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.ErrorOutline, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
}
