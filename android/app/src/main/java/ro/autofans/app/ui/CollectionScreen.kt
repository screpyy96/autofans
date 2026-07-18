package ro.autofans.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*
import ro.autofans.app.data.MobileApi

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionRoute(api: MobileApi, kind: String, onBack: () -> Unit, onCatalog: () -> Unit, onListing: (String) -> Unit, embedded: Boolean = false) {
    val operation=when(kind){"saved"->"saved_searches";"notifications"->"notifications";else->"favorites"}; val key=when(kind){"saved"->"searches";"notifications"->"notifications";else->"favorites"}; val title=when(kind){"saved"->"Căutări salvate";"notifications"->"Notificări";else->"Favorite"}
    var rows by remember { mutableStateOf(emptyList<JsonObject>()) }; var error by remember { mutableStateOf<String?>(null) }; var editing by remember { mutableStateOf<JsonObject?>(null) }; var name by remember { mutableStateOf("") }; val scope=rememberCoroutineScope()
    fun reload()=scope.launch{runCatching{api.call(operation)[key]?.jsonArray?.map{it.jsonObject}.orEmpty()}.onSuccess{rows=it}.onFailure{error=it.message}}
    LaunchedEffect(kind){reload()}
    Scaffold(topBar={if (!embedded) TopAppBar(title={Text(title)},navigationIcon={IconButton(onClick=onBack){Text("‹")}})}){padding->LazyColumn(Modifier.padding(padding).padding(16.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){
        error?.let{item{Text(it,color=MaterialTheme.colorScheme.error)}}
        items(rows,key={it["id"]?.jsonPrimitive?.content?:it["listing_id"]?.jsonPrimitive?.content?:""}){row->Card(Modifier.fillMaxWidth()){Column(Modifier.padding(12.dp)){
            val listing = when (val value = row["listings"]) {
                is JsonObject -> value
                is JsonArray -> value.firstOrNull()?.jsonObject
                else -> null
            }
            val headline=when(kind){"favorites"->listing?.get("title")?.jsonPrimitive?.content ?: "Anunț indisponibil";"saved"->row["name"]?.jsonPrimitive?.content.orEmpty();else->row["title"]?.jsonPrimitive?.content.orEmpty()}; Text(headline,style=MaterialTheme.typography.titleMedium)
            if (kind == "favorites") {
                val details = listOfNotNull(listing?.get("year")?.jsonPrimitive?.content, listing?.get("mileage")?.jsonPrimitive?.content?.let { "$it km" }, listing?.get("fuel_type")?.jsonPrimitive?.content, listing?.get("transmission")?.jsonPrimitive?.content).joinToString(" · ")
                if (details.isNotBlank()) Text(details, style=MaterialTheme.typography.bodySmall)
                listing?.get("price")?.jsonPrimitive?.content?.let { price -> Text("$price ${listing["currency"]?.jsonPrimitive?.content ?: "EUR"}", style=MaterialTheme.typography.titleSmall) }
                listing?.get("slug")?.jsonPrimitive?.content?.let { slug -> TextButton(onClick = { onListing(slug) }) { Text("Deschide anunțul") } }
            }
            row["body"]?.jsonPrimitive?.content?.let{Text(it)}
            if(kind=="saved") {
                Row {
                    TextButton(onClick={row["query"]?.jsonObject?.let { SavedSearchStore.apply(it); onCatalog() }}) { Text("Aplică") }
                    TextButton(onClick={editing=row;name=row["name"]?.jsonPrimitive?.content.orEmpty()}) { Text("Redenumește") }
                    TextButton(onClick={val id=row["id"]?.jsonPrimitive?.content?.toLongOrNull()?:return@TextButton;scope.launch{api.call("delete_saved_search",buildJsonObject{put("id",id)});reload()}}){Text("Șterge")}
                }
            }
            if(kind=="notifications" && row["read_at"]?.toString()=="null")TextButton(onClick={val id=row["id"]?.jsonPrimitive?.content?.toLongOrNull()?:return@TextButton;scope.launch{api.call("read_notification",buildJsonObject{put("id",id)});reload()}}){Text("Marchează citit")}
        }}}
        if(rows.isEmpty()&&error==null)item{Text("Nu există elemente încă.")}
    }}
    editing?.let { search -> AlertDialog(
        onDismissRequest = { editing = null }, title = { Text("Redenumește căutarea") },
        text = { OutlinedTextField(name, { name = it }, label = { Text("Nume") }, singleLine = true) },
        confirmButton = { Button(enabled = name.isNotBlank(), onClick = { val id=search["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: return@Button; scope.launch { runCatching { api.call("update_saved_search",buildJsonObject{put("id",id);put("name",name)}) }.onSuccess { editing=null;reload() }.onFailure { error=it.message } } }) { Text("Salvează") } },
        dismissButton = { TextButton(onClick = { editing = null }) { Text("Renunță") } },
    ) }
}
