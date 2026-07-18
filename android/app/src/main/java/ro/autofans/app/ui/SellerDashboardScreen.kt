package ro.autofans.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import ro.autofans.app.data.MobileApi

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SellerDashboardRoute(api: MobileApi, onBack: () -> Unit) {
    var content by remember { mutableStateOf<String?>(null) }; var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { runCatching { api.call("seller_dashboard") }.onSuccess { response ->
        val metrics=response["metrics"]?.jsonArray.orEmpty(); val views=metrics.sumOf{it.jsonObject["view_count"]?.jsonPrimitive?.content?.toLongOrNull()?:0}; val contacts=metrics.sumOf{it.jsonObject["contact_count"]?.jsonPrimitive?.content?.toLongOrNull()?:0}; val favorites=metrics.sumOf{it.jsonObject["favorite_count"]?.jsonPrimitive?.content?.toLongOrNull()?:0}; content="${metrics.size} anunțuri cu activitate\n$views vizualizări · $contacts contacte · $favorites favorite"
    }.onFailure { error=it.message } }
    Scaffold(topBar={TopAppBar(title={Text("Dashboard seller")},navigationIcon={IconButton(onClick=onBack){Text("‹")}})}){padding->Column(Modifier.padding(padding).padding(24.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text(content?:"Se încarcă…",style=MaterialTheme.typography.titleLarge); error?.let{Text(it,color=MaterialTheme.colorScheme.error)}}}
}
