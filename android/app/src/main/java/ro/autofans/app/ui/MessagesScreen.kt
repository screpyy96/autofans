package ro.autofans.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.ErrorOutline
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
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import ro.autofans.app.data.MobileApi
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun MessagesRoute(api: MobileApi, onBack: () -> Unit, embedded: Boolean = false) {
    var conversations by remember { mutableStateOf(emptyList<JsonObject>()) }
    var activeConversation by remember { mutableStateOf<JsonObject?>(null) }
    var messages by remember { mutableStateOf(emptyList<JsonObject>()) }
    var body by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val viewerId = api.currentUserId()
    val context = LocalContext.current
    val notificationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }

    fun loadConversations() = scope.launch {
        loading = true
        runCatching { api.call("conversations")["conversations"]?.jsonArray?.map { it.jsonObject }.orEmpty() }
            .onSuccess { refreshed ->
                conversations = refreshed
                activeConversation?.string("id")?.let { activeId -> activeConversation = refreshed.firstOrNull { it.string("id") == activeId } ?: activeConversation }
                error = null
            }
            .onFailure { error = it.message ?: "Nu am putut încărca mesajele." }
        loading = false
    }
    fun openConversation(conversation: JsonObject) {
        val id = conversation.string("id")?.toLongOrNull() ?: return
        activeConversation = conversation
        error = null
        scope.launch {
            runCatching { api.call("messages", buildJsonObject { put("conversationId", id) })["messages"]?.jsonArray?.map { it.jsonObject }.orEmpty() }
                .onSuccess { messages = it }
                .onFailure { error = it.message ?: "Nu am putut încărca conversația." }
        }
    }
    LaunchedEffect(Unit) { loadConversations() }
    LaunchedEffect(Unit) {
        if (android.os.Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
    DisposableEffect(Unit) {
        var subscription: java.io.Closeable? = null
        val job = scope.launch {
            subscription = runCatching {
                api.subscribeToMessages(
                    onEvent = { event ->
                        scope.launch {
                            loadConversations()
                            if (activeConversation?.string("id") == event.conversationId.toString()) activeConversation?.let(::openConversation)
                            if (event.senderId != null && event.senderId != viewerId) {
                                val conversation = conversations.firstOrNull { it.string("id") == event.conversationId.toString() }
                                val sender = conversation?.objectOrNull("counterpart")?.displayName() ?: "Mesaj nou"
                                val preview = conversation?.objectOrNull("last_message")?.string("body") ?: "Ai primit un mesaj nou."
                                if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED || android.os.Build.VERSION.SDK_INT < 33) {
                                    MessageNotification.show(context, sender, preview, event.conversationId.toInt())
                                }
                            }
                        }
                    },
                    onError = { },
                )
            }.getOrNull()
        }
        onDispose { job.cancel(); subscription?.close() }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (activeConversation == null) {
                TopAppBar(title = { Text("Mesaje", fontWeight = FontWeight.ExtraBold) })
            }
        },
    ) { padding ->
        val active = activeConversation
        if (active == null) {
            ConversationInbox(conversations, loading, error, ::openConversation, Modifier.padding(padding))
        } else {
            ConversationThread(
                conversation = active,
                messages = messages,
                viewerId = viewerId,
                body = body,
                error = error,
                sending = sending,
                onBodyChange = { body = it },
                onBack = { activeConversation = null; messages = emptyList(); error = null },
                onSend = {
                    val id = active.string("id")?.toLongOrNull()
                    val text = body.trim()
                    if (id == null || text.isBlank() || sending) return@ConversationThread
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
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Text("Discuțiile tale", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(4.dp))
            Text("Mesaje primite de la cumpărători și vânzători.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        error?.let { item { ErrorNotice(it) } }
        when {
            loading -> item { Box(Modifier.fillMaxWidth().padding(top = 44.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
            conversations.isEmpty() -> item { EmptyInbox() }
            else -> items(conversations, key = { it.string("id").orEmpty() }) { ConversationCard(it, onClick = { onOpen(it) }) }
        }
    }
}

@Composable
private fun ConversationCard(conversation: JsonObject, onClick: () -> Unit) {
    val counterpart = conversation.objectOrNull("counterpart")
    val listing = conversation.objectOrNull("listing")
    val name = counterpart?.displayName() ?: "Utilizator AutoFans"
    val listingTitle = listing?.string("title") ?: "Anunț auto indisponibil"
    val preview = conversation.objectOrNull("last_message")?.string("body") ?: "Conversație nouă"
    val timestamp = conversation.objectOrNull("last_message")?.string("created_at") ?: conversation.string("updated_at")
    ElevatedCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            ProfileAvatar(counterpart, name, 50.dp)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                    Spacer(Modifier.width(8.dp)); Text(formatMessageTime(timestamp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text(listingTitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(preview, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Spacer(Modifier.width(4.dp)); Icon(Icons.AutoMirrored.Filled.ArrowForward, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun ProfileAvatar(profile: JsonObject?, fallbackName: String, size: androidx.compose.ui.unit.Dp) {
    val avatar = profile?.string("avatar_url")
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(size)) {
        if (!avatar.isNullOrBlank()) AsyncImage(model = avatar, contentDescription = "Profil $fallbackName", modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
        else Box(contentAlignment = Alignment.Center) { Text(fallbackName.firstOrNull()?.uppercase() ?: "A", color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.ExtraBold) }
    }
}

@Composable
private fun EmptyInbox() = Column(Modifier.fillMaxWidth().padding(top = 48.dp), horizontalAlignment = Alignment.CenterHorizontally) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(74.dp)) { Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.padding(20.dp), tint = MaterialTheme.colorScheme.secondary) }
    Spacer(Modifier.height(18.dp)); Text("Încă nu ai conversații", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
    Spacer(Modifier.height(7.dp)); Text("Când contactezi un vânzător, discuția apare aici.", color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable
private fun ConversationThread(conversation: JsonObject, messages: List<JsonObject>, viewerId: String?, body: String, error: String?, sending: Boolean, onBodyChange: (String) -> Unit, onBack: () -> Unit, onSend: () -> Unit, modifier: Modifier = Modifier) {
    val counterpart = conversation.objectOrNull("counterpart")
    val listing = conversation.objectOrNull("listing")
    val name = counterpart?.displayName() ?: "Utilizator AutoFans"
    val listingTitle = listing?.string("title") ?: "Anunț auto"
    val listState = rememberLazyListState()
    LaunchedEffect(conversation.string("id"), messages.size) { if (messages.isNotEmpty()) listState.animateScrollToItem(messages.lastIndex) }
    Column(modifier.fillMaxSize()) {
        Surface(tonalElevation = 1.dp, shadowElevation = 2.dp) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi la mesaje") }
                Spacer(Modifier.width(3.dp)); ProfileAvatar(counterpart, name, 42.dp); Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(name, fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(listingTitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
        error?.let { ErrorNotice(it, Modifier.padding(horizontal = 20.dp, vertical = 10.dp)) }
        if (messages.isEmpty()) {
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Începe conversația cu un mesaj.", color = MaterialTheme.colorScheme.onSurfaceVariant) }
        } else {
            LazyColumn(state = listState, modifier = Modifier.weight(1f), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(messages, key = { it.string("id").orEmpty() }) { message -> MessageBubble(message, message.string("sender_id") == viewerId) }
            }
        }
        Row(modifier = Modifier.fillMaxWidth().imePadding().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
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
private fun MessageBubble(message: JsonObject, sentByMe: Boolean) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (sentByMe) Arrangement.End else Arrangement.Start) {
        Surface(
            shape = RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = if (sentByMe) 18.dp else 5.dp, bottomEnd = if (sentByMe) 5.dp else 18.dp),
            color = if (sentByMe) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.fillMaxWidth(.82f),
        ) {
            Column(Modifier.padding(horizontal = 14.dp, vertical = 10.dp), horizontalAlignment = if (sentByMe) Alignment.End else Alignment.Start) {
                Text(message.string("body").orEmpty(), style = MaterialTheme.typography.bodyLarge, color = if (sentByMe) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.height(3.dp)); Text(formatMessageTime(message.string("created_at")), style = MaterialTheme.typography.labelSmall, color = if (sentByMe) MaterialTheme.colorScheme.onPrimary.copy(alpha = .76f) else MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun ErrorNotice(message: String, modifier: Modifier = Modifier) = Surface(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.error.copy(alpha = .10f)) {
    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.ErrorOutline, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text(message, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
}

private fun JsonObject.string(key: String): String? = this[key]?.jsonPrimitive?.contentOrNull
private fun JsonObject.objectOrNull(key: String): JsonObject? = this[key] as? JsonObject
private fun JsonObject.displayName(): String = string("display_name")?.takeIf(String::isNotBlank) ?: string("email")?.substringBefore('@') ?: "Utilizator AutoFans"
private fun formatMessageTime(value: String?): String = runCatching { OffsetDateTime.parse(value).format(DateTimeFormatter.ofPattern("HH:mm", Locale("ro", "RO"))) }.getOrDefault("")
