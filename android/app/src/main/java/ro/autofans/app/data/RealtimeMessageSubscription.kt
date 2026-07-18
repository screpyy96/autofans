package ro.autofans.app.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.io.Closeable
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong

data class RealtimeMessageEvent(val conversationId: Long, val senderId: String?)

internal class RealtimeMessageSubscription(
    private val socket: WebSocket,
    private val heartbeat: java.util.concurrent.ScheduledExecutorService,
) : Closeable {
    override fun close() {
        heartbeat.shutdownNow()
        socket.close(1000, "Screen closed")
    }
}

internal fun realtimeMessageListener(
    json: Json,
    onEvent: (RealtimeMessageEvent) -> Unit,
    onError: (Throwable) -> Unit,
): Pair<WebSocketListener, (WebSocket) -> RealtimeMessageSubscription> {
    val reference = AtomicLong(1)
    val listener = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
            val join = """{"topic":"realtime:public:messages","event":"phx_join","payload":{"config":{"broadcast":{"self":false},"presence":{"key":""},"postgres_changes":[{"event":"INSERT","schema":"public","table":"messages"}]}},"ref":"${reference.getAndIncrement()}"}"""
            webSocket.send(join)
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            runCatching {
                val root = json.parseToJsonElement(text).jsonObject
                if (root["event"]?.jsonPrimitive?.content != "postgres_changes") return@runCatching
                val record = root["payload"]?.jsonObject?.get("data")?.jsonObject?.get("record")?.jsonObject ?: return@runCatching
                val conversationId = record["conversation_id"]?.jsonPrimitive?.content?.toLongOrNull() ?: return@runCatching
                onEvent(RealtimeMessageEvent(conversationId, record["sender_id"]?.jsonPrimitive?.content))
            }.onFailure(onError)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) = onError(t)
    }
    val subscription = { socket: WebSocket ->
        val executor = Executors.newSingleThreadScheduledExecutor()
        executor.scheduleAtFixedRate({
            socket.send("""{"topic":"phoenix","event":"heartbeat","payload":{},"ref":"${reference.getAndIncrement()}"}""")
        }, 25, 25, TimeUnit.SECONDS)
        RealtimeMessageSubscription(socket, executor)
    }
    return listener to subscription
}
