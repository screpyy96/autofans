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
fun SellerProfileRoute(api: MobileApi, sellerId: String, onBack: () -> Unit) {
    var profile by remember { mutableStateOf<JsonObject?>(null) }; var reviews by remember { mutableStateOf(emptyList<JsonObject>()) }; var rating by remember { mutableStateOf("5") }; var comment by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; val scope=rememberCoroutineScope()
    fun load()=scope.launch{runCatching{api.call("seller_profile",buildJsonObject{put("sellerId",sellerId)})}.onSuccess{profile=it["profile"]?.jsonObject;reviews=it["reviews"]?.jsonArray?.map{row->row.jsonObject}.orEmpty()}.onFailure{error=it.message}}
    LaunchedEffect(sellerId){load()}
    Scaffold(topBar={TopAppBar(title={Text("Vânzător")},navigationIcon={IconButton(onClick=onBack){Text("‹")}})}){padding->LazyColumn(Modifier.padding(padding).padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
        item{Text(profile?.get("display_name")?.jsonPrimitive?.content ?: "Se încarcă…",style=MaterialTheme.typography.headlineSmall); profile?.get("is_verified")?.jsonPrimitive?.booleanOrNull?.let{if(it)Text("Vânzător verificat")}; error?.let{Text(it,color=MaterialTheme.colorScheme.error)}}
        item{Text("Recenzie",style=MaterialTheme.typography.titleMedium);OutlinedTextField(rating,{rating=it},label={Text("Rating 1–5")},modifier=Modifier.fillMaxWidth());OutlinedTextField(comment,{comment=it},label={Text("Comentariu (minim 10 caractere)")},modifier=Modifier.fillMaxWidth());Button(onClick={scope.launch{runCatching{api.call("save_review",buildJsonObject{put("sellerId",sellerId);put("rating",rating.toIntOrNull()?:0);put("comment",comment)})}.onSuccess{comment="";load()}.onFailure{error=it.message}}},enabled=comment.length>=10){Text("Trimite recenzia")}}
        item{Text("Recenzii",style=MaterialTheme.typography.titleMedium)}
        items(reviews){review->Card(Modifier.fillMaxWidth()){Column(Modifier.padding(12.dp)){Text("${review["rating"]?.jsonPrimitive?.content}/5");Text(review["comment"]?.jsonPrimitive?.content.orEmpty())}}}
    }}
}
