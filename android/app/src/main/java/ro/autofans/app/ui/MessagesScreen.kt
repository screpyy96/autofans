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
fun MessagesRoute(api: MobileApi, onBack: () -> Unit, embedded: Boolean = false) {
    var conversations by remember { mutableStateOf(emptyList<kotlinx.serialization.json.JsonObject>()) }; var activeId by remember { mutableStateOf<Long?>(null) }; var messages by remember { mutableStateOf(emptyList<kotlinx.serialization.json.JsonObject>()) }; var body by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; val scope=rememberCoroutineScope()
    fun loadConversations()=scope.launch { runCatching { api.call("conversations")["conversations"]?.jsonArray?.map{it.jsonObject}.orEmpty() }.onSuccess{conversations=it}.onFailure{error=it.message} }
    fun loadMessages(id:Long)=scope.launch { runCatching { api.call("messages", kotlinx.serialization.json.buildJsonObject { put("conversationId",id) })["messages"]?.jsonArray?.map{it.jsonObject}.orEmpty() }.onSuccess{messages=it}.onFailure{error=it.message} }
    LaunchedEffect(Unit){loadConversations()}
    Scaffold(topBar={if (!embedded) TopAppBar(title={Text("Mesaje")},navigationIcon={IconButton(onClick=onBack){Text("‹")}})}){padding-> Column(Modifier.padding(padding).padding(16.dp)) {
        error?.let{Text(it,color=MaterialTheme.colorScheme.error)}
        if(activeId==null) LazyColumn(verticalArrangement=Arrangement.spacedBy(8.dp), modifier=Modifier.weight(1f)){ items(conversations,key={it["id"]?.jsonPrimitive?.content?:""}){c-> Card(Modifier.fillMaxWidth()){TextButton(onClick={val id=c["id"]?.jsonPrimitive?.content?.toLongOrNull()?:return@TextButton;activeId=id;loadMessages(id)}){Text("Conversație pentru anunțul #${c["listing_id"]?.jsonPrimitive?.content}")}}}; if(conversations.isEmpty())item{Text("Nu ai conversații.")}}
        else { LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){items(messages){m->Card{Text(m["body"]?.jsonPrimitive?.content.orEmpty(),Modifier.padding(10.dp))}}}; OutlinedTextField(body,{body=it},label={Text("Mesaj")},modifier=Modifier.fillMaxWidth()); Button(onClick={val id=activeId?:return@Button;scope.launch{runCatching{api.call("send_message",kotlinx.serialization.json.buildJsonObject{put("conversationId",id);put("message",body)})}.onSuccess{body="";loadMessages(id)}.onFailure{error=it.message}}},enabled=body.isNotBlank(),modifier=Modifier.fillMaxWidth()){Text("Trimite")}; TextButton(onClick={activeId=null;messages=emptyList()}){Text("Înapoi la conversații")}}
    }}
}
