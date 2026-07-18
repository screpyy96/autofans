package ro.autofans.app.data

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.UUID

/** Authenticated companion to the public listing repository. All mutations
 * travel through the server façade so Android and a later Swift client share
 * input validation and error shapes. */
class MobileApi(
    private val appUrl: String,
    private val config: SupabaseConfig,
    private val auth: SupabaseAuthRepository,
    private val client: OkHttpClient = OkHttpClient(),
    private val json: Json = Json { ignoreUnknownKeys = true },
) {
    suspend fun call(operation: String, payload: JsonObject = buildJsonObject {}): JsonObject = withContext(Dispatchers.IO) {
        val session = auth.activeSession()
        val body = buildJsonObject { put("operation", operation); put("payload", payload) }.toString()
        val request = Request.Builder().url("${appUrl.trimEnd('/')}/api/mobile/v1")
            .header("Authorization", "Bearer ${session.access_token}")
            .post(body.toRequestBody(JSON)).build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw SupabaseException(response.code, mobileApiError(response.code, response.header("Content-Type"), text))
            return@withContext runCatching { json.parseToJsonElement(text) as? JsonObject }.getOrNull()
                ?: throw IOException("Serverul AutoFans a trimis un răspuns invalid. Încearcă din nou mai târziu.")
        }
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

    private companion object { val JSON = "application/json; charset=utf-8".toMediaType() }

    private fun mobileApiError(status: Int, contentType: String?, body: String): String {
        val isHtml = contentType?.contains("text/html", ignoreCase = true) == true || body.trimStart().startsWith("<!DOCTYPE", ignoreCase = true)
        return when {
            status == 404 && isHtml -> "Serviciul mobil AutoFans nu este încă disponibil pe server. Actualizează aplicația după ce serverul a fost publicat."
            isHtml -> "Serverul AutoFans a trimis o pagină web în locul răspunsului aplicației. Încearcă din nou mai târziu."
            else -> body.ifBlank { "Cererea către AutoFans a eșuat (cod $status)." }
        }
    }
}
