package ro.autofans.app.data

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.HttpUrl.Companion.toHttpUrl
import java.time.LocalDate
import java.io.IOException
import java.util.UUID

/** Authenticated companion to the public listing repository. All mutations
 * travel through the server façade so Android and a later Swift client share
 * input validation and error shapes. */
class MobileApi(
    private val config: SupabaseConfig,
    private val auth: SupabaseAuthRepository,
    private val clientSessionId: String,
    private val client: OkHttpClient = OkHttpClient(),
    private val json: Json = Json { ignoreUnknownKeys = true },
) {
    fun currentUserId(): String? = auth.session?.user?.id

    suspend fun subscribeToMessages(onEvent: (RealtimeMessageEvent) -> Unit, onError: (Throwable) -> Unit): java.io.Closeable = withContext(Dispatchers.IO) {
        val session = auth.activeSession()
        val websocketUrl = config.url.toHttpUrl().newBuilder()
            .scheme(if (config.url.startsWith("https://")) "wss" else "ws")
            .addPathSegments("realtime/v1/websocket")
            .addQueryParameter("apikey", config.anonKey)
            .addQueryParameter("vsn", "1.0.0")
            .build()
        val (listener, makeSubscription) = realtimeMessageListener(json, session.access_token, onEvent, onError)
        val socket = client.newWebSocket(
            Request.Builder().url(websocketUrl).header("apikey", config.anonKey).header("Authorization", "Bearer ${session.access_token}").build(),
            listener,
        )
        makeSubscription(socket)
    }

    suspend fun call(operation: String, payload: JsonObject = buildJsonObject {}): JsonObject = withContext(Dispatchers.IO) {
        val session = auth.activeSession()
        val body = buildJsonObject { put("operation", operation); put("payload", payload) }.toString()
        val functionName = if (operation in CHAT_OPERATIONS) "chat-v1" else "mobile-v1"
        val request = Request.Builder().url("${config.url.trimEnd('/')}/functions/v1/$functionName")
            .header("apikey", config.anonKey)
            .header("Authorization", "Bearer ${session.access_token}")
            .post(body.toRequestBody(JSON)).build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw SupabaseException(response.code, mobileApiError(response.code, response.header("Content-Type"), text))
            return@withContext runCatching { json.parseToJsonElement(text) as? JsonObject }.getOrNull()
                ?: throw IOException("Serverul AutoFans a trimis un răspuns invalid. Încearcă din nou mai târziu.")
        }
    }

    /** Registers the current physical device for server-side FCM delivery.
     * The FCM token is never a credential and is always tied to the active
     * authenticated AutoFans user by the Edge Function. */
    suspend fun registerPushToken(token: String) {
        if (token.length < 30) return
        call("register_push_token", buildJsonObject {
            put("token", token)
            put("platform", "android")
        })
    }

    suspend fun uploadListingImage(context: Context, uri: Uri): String = withContext(Dispatchers.IO) {
        val session = auth.activeSession()
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: error("Nu am putut citi imaginea.")
        require(bytes.size <= 10 * 1024 * 1024) { "Imaginea poate avea cel mult 10 MB." }
        val path = "${session.user.id}/mobile/${UUID.randomUUID()}.jpg"
        val request = Request.Builder().url("${config.url.trimEnd('/')}/storage/v1/object/listing-images/$path")
            .header("apikey", config.anonKey).header("Authorization", "Bearer ${session.access_token}")
            .header("Content-Type", context.contentResolver.getType(uri) ?: "image/jpeg")
            .post(bytes.toRequestBody()).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw SupabaseException(response.code, response.body?.string().orEmpty())
        }
        path
    }

    /** Uploads an avatar to its dedicated public bucket. The app only receives
     * a public URL after Storage has accepted an authenticated upload. */
    suspend fun uploadProfileAvatar(context: Context, uri: Uri): String = withContext(Dispatchers.IO) {
        val session = auth.activeSession()
        val contentType = context.contentResolver.getType(uri) ?: "image/jpeg"
        require(contentType in PROFILE_AVATAR_MIME_TYPES) { "Alege o imagine JPEG, PNG sau WebP." }
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            ?: error("Nu am putut citi fotografia.")
        require(bytes.size <= PROFILE_AVATAR_MAX_BYTES) { "Fotografia de profil poate avea cel mult 5 MB." }
        val extension = when (contentType) {
            "image/png" -> "png"
            "image/webp" -> "webp"
            else -> "jpg"
        }
        val path = "${session.user.id}/avatar-${UUID.randomUUID()}.$extension"
        val request = Request.Builder().url("${config.url.trimEnd('/')}/storage/v1/object/profile-avatars/$path")
            .header("apikey", config.anonKey)
            .header("Authorization", "Bearer ${session.access_token}")
            .header("Content-Type", contentType)
            .post(bytes.toRequestBody()).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw SupabaseException(response.code, response.body?.string().orEmpty())
        }
        "${config.url.trimEnd('/')}/storage/v1/object/public/profile-avatars/$path"
    }

    suspend fun signListingImageUrls(paths: List<String>): Map<String, String> = withContext(Dispatchers.IO) {
        val distinctPaths = paths.filter(String::isNotBlank).distinct()
        if (distinctPaths.isEmpty()) return@withContext emptyMap()
        val session = auth.activeSession()
        val requestJson = json.encodeToString(SignRequest(distinctPaths, 3_600))
        val request = Request.Builder()
            .url("${config.url.trimEnd('/')}/storage/v1/object/sign/listing-images")
            .header("apikey", config.anonKey)
            .header("Authorization", "Bearer ${session.access_token}")
            .post(requestJson.toRequestBody(JSON))
            .build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw SupabaseException(response.code, mobileApiError(response.code, response.header("Content-Type"), text))
            json.decodeFromString<List<SignedUrlDto>>(text).mapNotNull { signed ->
                val path = signed.path ?: signed.name ?: return@mapNotNull null
                val signedPath = signed.signedUrl ?: return@mapNotNull null
                val fullUrl = if (signedPath.startsWith("http")) signedPath else "${config.url.trimEnd('/')}/storage/v1$signedPath"
                path to fullUrl
            }.toMap()
        }
    }

    suspend fun recordListingView(listingId: Long) {
        recordPublicActivity(
            table = "listing_views",
            payload = buildJsonObject {
                put("listing_id", listingId)
                put("visitor_id", kotlinx.serialization.json.JsonNull)
                put("session_id", clientSessionId)
                put("viewed_on", currentActivityDay())
            },
        )
    }

    suspend fun recordListingContact(listingId: Long, contactType: String) {
        recordPublicActivity(
            table = "listing_contacts",
            payload = buildJsonObject {
                put("listing_id", listingId)
                put("visitor_id", kotlinx.serialization.json.JsonNull)
                put("contact_type", normalizeContactType(contactType))
                put("session_id", clientSessionId)
                put("contacted_on", currentActivityDay())
            },
        )
    }

    private companion object {
        val CHAT_OPERATIONS = setOf("conversations", "messages", "start_conversation", "send_message", "mark_conversation_read")
        val JSON = "application/json; charset=utf-8".toMediaType()
        val PROFILE_AVATAR_MIME_TYPES = setOf("image/jpeg", "image/png", "image/webp")
        const val PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024
    }

    @Serializable
    private data class SignRequest(val paths: List<String>, @SerialName("expiresIn") val expiresIn: Int)

    @Serializable
    private data class SignedUrlDto(
        val name: String? = null,
        val path: String? = null,
        @SerialName("signedURL") val signedUrl: String? = null,
    )

    private suspend fun recordPublicActivity(table: String, payload: JsonObject) = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("${config.url.trimEnd('/')}/rest/v1/$table")
            .header("apikey", config.anonKey)
            .header("Authorization", "Bearer ${config.anonKey}")
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .post(payload.toString().toRequestBody(JSON))
            .build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (response.isSuccessful) return@withContext
            if (response.code == 409 && text.contains("\"code\":\"23505\"")) return@withContext
            throw SupabaseException(response.code, mobileApiError(response.code, response.header("Content-Type"), text))
        }
    }

    private fun currentActivityDay(): String = LocalDate.now().toString()

    private fun normalizeContactType(value: String): String = when (value) {
        "phone", "whatsapp", "viewing" -> value
        else -> "message"
    }

    private fun mobileApiError(status: Int, contentType: String?, body: String): String {
        val isHtml = contentType?.contains("text/html", ignoreCase = true) == true || body.trimStart().startsWith("<!DOCTYPE", ignoreCase = true)
        return when {
            status == 404 && isHtml -> "Serviciul mobil AutoFans nu este încă disponibil pe server. Actualizează aplicația după ce serverul a fost publicat."
            isHtml -> "Serverul AutoFans a trimis o pagină web în locul răspunsului aplicației. Încearcă din nou mai târziu."
            else -> body.ifBlank { "Cererea către AutoFans a eșuat (cod $status)." }
        }
    }
}
