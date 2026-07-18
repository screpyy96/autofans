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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
fun MessagesRoute(api: MobileApi, onBack: () -> Unit, embedded: Boolean = false) {
    var conversations by remember { mutableStateOf(emptyList<JsonObject>()) }
    var activeConversation by remember { mutableStateOf<JsonObject?>(null) }
    var messages by remember { mutableStateOf(emptyList<JsonObject>()) }
    var body by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun loadConversations() = scope.launch {
        loading = true
        runCatching { api.call("conversations")["conversations"]?.jsonArray?.map { it as JsonObject }.orEmpty() }
            .onSuccess { conversations = it; error = null }
            .onFailure { error = it.message ?: "Nu am putut încărca mesajele." }
        loading = false
    }
    fun openConversation(conversation: JsonObject) {
        val id = conversation["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: return
        activeConversation = conversation
        error = null
        scope.launch {
            runCatching { api.call("messages", buildJsonObject { put("conversationId", id) })["messages"]?.jsonArray?.map { it as JsonObject }.orEmpty() }
                .onSuccess { messages = it }
                .onFailure { error = it.message ?: "Nu am putut încărca conversația." }
        }
    }
    LaunchedEffect(Unit) { loadConversations() }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (!embedded) androidx.compose.material3.TopAppBar(
                title = { Text(if (activeConversation == null) "Mesaje" else "Conversație", fontWeight = FontWeight.Bold) },
                navigationIcon = { IconButton(onClick = { if (activeConversation == null) onBack() else { activeConversation = null; messages = emptyList(); error = null } }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi") } },
            )
        },
    ) { padding ->
        val active = activeConversation
        if (active == null) {
            ConversationInbox(
                conversations = conversations,
                loading = loading,
                error = error,
                onOpen = ::openConversation,
                modifier = Modifier.padding(padding),
            )
        } else {
            ConversationThread(
                conversation = active,
                messages = messages,
                body = body,
                error = error,
                sending = sending,
                onBodyChange = { body = it },
                onBack = { activeConversation = null; messages = emptyList(); error = null },
                onSend = {
                    val id = active["id"]?.jsonPrimitive?.content?.toLongOrNull() ?: return@ConversationThread
                    val text = body.trim()
                    if (text.isBlank() || sending) return@ConversationThread
                    scope.launch {
                        sending = true
                        runCatching { api.call("send_message", buildJsonObject { put("conversationId", id); put("message", text) }) }
                            .onSuccess { body = ""; openConversation(active); loadConversations() }
                            .onFailure { error = it.message ?: "Mesajul nu a putut fi trimis." }
                        sending = false
                    }
                },
                modifier = Modifier.padding(padding),
            )
        }
    }
}

@Composable
private fun ConversationInbox(conversations: List<JsonObject>, loading: Boolean, error: String?, onOpen: (JsonObject) -> Unit, modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text("Discuțiile tale", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(4.dp))
            Text("Păstrează toate întrebările și răspunsurile despre anunțuri într-un singur loc.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        error?.let { message -> item { ErrorNotice(message) } }
        if (loading) {
            item { Box(Modifier.fillMaxWidth().padding(top = 44.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
        } else if (conversations.isEmpty()) {
            item { EmptyInbox() }
        } else {
            items(conversations, key = { it["id"]?.jsonPrimitive?.content ?: "" }) { conversation ->
                ConversationCard(conversation, onClick = { onOpen(conversation) })
            }
        }
    }
}

@Composable
private fun ConversationCard(conversation: JsonObject, onClick: () -> Unit) {
    val listingId = conversation["listing_id"]?.jsonPrimitive?.content.orEmpty()
    ElevatedCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
    ) {
        Row(Modifier.padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = RoundedCornerShape(15.dp), color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(52.dp)) {
                Icon(Icons.Default.DirectionsCar, null, modifier = Modifier.padding(14.dp), tint = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.width(13.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text("Discuție despre anunț", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                Text("Anunțul #$listingId", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("Apasă pentru a vedea mesajele", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.AutoMirrored.Filled.ArrowBack, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun EmptyInbox() = Column(
    modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(74.dp)) {
        Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.padding(20.dp), tint = MaterialTheme.colorScheme.secondary)
    }
    Spacer(Modifier.height(18.dp))
    Text("Încă nu ai conversații", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(7.dp))
    Text("Când contactezi un vânzător, discuția apare aici.", color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun ConversationThread(conversation: JsonObject, messages: List<JsonObject>, body: String, error: String?, sending: Boolean, onBodyChange: (String) -> Unit, onBack: () -> Unit, onSend: () -> Unit, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi la mesaje") }
            Spacer(Modifier.width(5.dp))
            Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(40.dp)) {
                Icon(Icons.Default.DirectionsCar, null, modifier = Modifier.padding(10.dp), tint = MaterialTheme.colorScheme.secondary)
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text("Conversație AutoFans", fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleMedium)
                Text("Anunțul #${conversation["listing_id"]?.jsonPrimitive?.content.orEmpty()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        error?.let { ErrorNotice(it, Modifier.padding(horizontal = 20.dp)) }
        if (messages.isEmpty()) {
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("Începe conversația cu un mesaj.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(messages, key = { it["id"]?.jsonPrimitive?.content ?: "" }) { message ->
                    Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.fillMaxWidth()) {
                        Text(message["body"]?.jsonPrimitive?.content.orEmpty(), modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp), style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().imePadding().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(value = body, onValueChange = onBodyChange, modifier = Modifier.weight(1f), placeholder = { Text("Scrie un mesaj…") }, maxLines = 4, shape = RoundedCornerShape(18.dp))
            Spacer(Modifier.width(9.dp))
            Surface(onClick = onSend, enabled = body.trim().isNotBlank() && !sending, shape = CircleShape, color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(52.dp)) {
                if (sending) CircularProgressIndicator(modifier = Modifier.padding(15.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                else Icon(Icons.AutoMirrored.Filled.Send, "Trimite", modifier = Modifier.padding(15.dp), tint = MaterialTheme.colorScheme.onPrimary)
            }
        }
    }
}

@Composable
private fun ErrorNotice(message: String, modifier: Modifier = Modifier) = Surface(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.error.copy(alpha = .10f)) {
    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.ErrorOutline, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp)); Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
    }
}
