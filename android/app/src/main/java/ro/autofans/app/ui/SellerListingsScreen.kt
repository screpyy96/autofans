package ro.autofans.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import ro.autofans.app.data.MobileApi

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SellerListingsRoute(api: MobileApi, onBack: () -> Unit, onEdit: (Long) -> Unit) {
    var listings by remember { mutableStateOf(emptyList<kotlinx.serialization.json.JsonObject>()) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope()
    fun reload() = scope.launch { runCatching { api.call("seller_listings")["listings"]?.jsonArray?.map { it.jsonObject }.orEmpty() }.onSuccess { listings=it }.onFailure { error=it.message } }
    LaunchedEffect(Unit) { reload() }
    Scaffold(topBar={ TopAppBar(title={Text("Anunțurile mele")}, navigationIcon={ IconButton(onClick=onBack){ Text("‹") } }) }) { padding ->
        LazyColumn(Modifier.padding(padding).padding(16.dp), verticalArrangement=Arrangement.spacedBy(10.dp)) {
            error?.let { item { Text(it, color=MaterialTheme.colorScheme.error) } }
            items(listings, key={it["id"]?.jsonPrimitive?.content ?: ""}) { listing ->
                val id=listing["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: 0L; val status=listing["status"]?.jsonPrimitive?.content ?: "draft"
                Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(14.dp)) {
                    Text(listing["title"]?.jsonPrimitive?.content ?: "Anunț", style=MaterialTheme.typography.titleMedium)
                    Text("${listing["price"]?.jsonPrimitive?.content ?: ""} ${listing["currency"]?.jsonPrimitive?.content ?: "EUR"} · $status")
                    Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick={ onEdit(id) }) { Text("Editează") }
                        TextButton(onClick={ scope.launch { api.call("set_listing_status", kotlinx.serialization.json.buildJsonObject { put("id",id); put("status", if(status=="draft") "published" else "draft") }); reload() } }) { Text(if(status=="draft") "Publică" else "Draft") }
                        TextButton(onClick={ scope.launch { api.call("delete_listing", kotlinx.serialization.json.buildJsonObject { put("id",id) }); reload() } }) { Text("Șterge") }
                    }
                } }
            }
            if (listings.isEmpty() && error==null) item { Text("Nu ai încă anunțuri.") }
        }
    }
}
