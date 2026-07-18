package ro.autofans.app.data

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import android.net.Uri
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

@Serializable
data class AuthUser(val id: String, val email: String? = null)

@Serializable
data class AuthSession(
    val access_token: String,
    val refresh_token: String? = null,
    val expires_at: Long? = null,
    val user: AuthUser,
)

interface SessionStore {
    fun read(): AuthSession?
    fun save(session: AuthSession)
    fun clear()
}

class SecureSessionStore(context: Context) : SessionStore {
    private val preferences = context.getSharedPreferences("autofans_auth", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    override fun read(): AuthSession? = runCatching {
        val packed = preferences.getString(SESSION_KEY, null) ?: return null
        val bytes = Base64.decode(packed, Base64.NO_WRAP)
        val ivSize = bytes.first().toInt()
        val iv = bytes.copyOfRange(1, ivSize + 1)
        val encrypted = bytes.copyOfRange(ivSize + 1, bytes.size)
        val cipher = Cipher.getInstance(TRANSFORMATION).apply {
            init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv))
        }
        json.decodeFromString<AuthSession>(cipher.doFinal(encrypted).decodeToString())
    }.getOrNull()

    override fun save(session: AuthSession) {
        val cipher = Cipher.getInstance(TRANSFORMATION).apply { init(Cipher.ENCRYPT_MODE, key()) }
        val encrypted = cipher.doFinal(json.encodeToString(session).encodeToByteArray())
        val packed = byteArrayOf(cipher.iv.size.toByte()) + cipher.iv + encrypted
        preferences.edit().putString(SESSION_KEY, Base64.encodeToString(packed, Base64.NO_WRAP)).apply()
    }

    override fun clear() = preferences.edit().remove(SESSION_KEY).apply()

    private fun key() = (KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }
        .getKey(KEY_ALIAS, null) ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE).apply {
            init(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build())
        }.generateKey()) as javax.crypto.SecretKey

    private companion object {
        const val SESSION_KEY = "session"
        const val KEY_ALIAS = "autofans.session.v1"
        const val ANDROID_KEY_STORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}

class SupabaseAuthRepository(
    private val config: SupabaseConfig,
    private val store: SessionStore,
    private val client: OkHttpClient = OkHttpClient(),
    private val json: Json = Json { ignoreUnknownKeys = true; explicitNulls = false },
) {
    private val _session = MutableStateFlow(store.read())
    /** Reactive session state so the UI updates as soon as an OAuth callback
     * returns to the app. */
    val sessionState: StateFlow<AuthSession?> = _session.asStateFlow()
    private val _passwordRecovery = MutableStateFlow(false)
    val passwordRecovery: StateFlow<Boolean> = _passwordRecovery.asStateFlow()
    val session: AuthSession? get() = _session.value

    /** Returns a usable session and refreshes an expiring access token before
     * the mobile gateway or Storage receives it. */
    suspend fun activeSession(): AuthSession = withContext(Dispatchers.IO) {
        val current = checkNotNull(session) { "Autentifică-te pentru această acțiune." }
        val expiry = current.expires_at
        if (expiry == null || expiry > (System.currentTimeMillis() / 1_000) + REFRESH_LEEWAY_SECONDS) return@withContext current
        val refreshToken = checkNotNull(current.refresh_token) { "Sesiunea a expirat. Autentifică-te din nou." }
        try {
            post(
                path = "/auth/v1/token?grant_type=refresh_token",
                payload = "{\"refresh_token\":${json.encodeToString(refreshToken)}}",
                persist = true,
            ) ?: error("Supabase nu a reînnoit sesiunea.")
        } catch (error: SupabaseException) {
            if (error.statusCode in 400..401) clearSession()
            throw error
        }
    }

    suspend fun signIn(email: String, password: String): AuthSession = post(
        path = "/auth/v1/token?grant_type=password",
        payload = "{\"email\":${json.encodeToString(email)},\"password\":${json.encodeToString(password)}}",
        persist = true,
    ) ?: error("Supabase nu a returnat o sesiune.")

    suspend fun signUp(email: String, password: String): AuthSession? = post(
        path = "/auth/v1/signup",
        payload = "{\"email\":${json.encodeToString(email)},\"password\":${json.encodeToString(password)},\"email_redirect_to\":\"autofans://auth/callback\"}",
        persist = true,
    )

    suspend fun sendPasswordReset(email: String) {
        post(path = "/auth/v1/recover", payload = "{\"email\":${json.encodeToString(email)},\"email_redirect_to\":\"autofans://auth/callback\"}", persist = false)
    }

    /**
     * Exchanges a Google ID token issued by Android Credential Manager for a
     * Supabase session. This is a native flow: no Custom Tab, website redirect,
     * or deep-link callback is involved.
     */
    suspend fun signInWithGoogleIdToken(idToken: String, nonce: String): AuthSession = post(
        path = "/auth/v1/token?grant_type=id_token",
        payload = "{\"provider\":\"google\",\"id_token\":${json.encodeToString(idToken)},\"nonce\":${json.encodeToString(nonce)}}",
        persist = true,
    ) ?: error("Supabase nu a returnat o sesiune Google.")

    suspend fun completeOAuthRedirect(uri: Uri): Boolean = withContext(Dispatchers.IO) {
        val params = Uri.parse("https://callback.invalid/?${uri.fragment.orEmpty()}")
        val accessToken = params.getQueryParameter("access_token") ?: return@withContext false
        val refreshToken = params.getQueryParameter("refresh_token")
        val expiresAt = params.getQueryParameter("expires_at")?.toLongOrNull()
        val type = params.getQueryParameter("type")
        val request = Request.Builder().url("${config.url.trimEnd('/')}/auth/v1/user")
            .header("apikey", config.anonKey).header("Authorization", "Bearer $accessToken").get().build()
        val user = client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return@withContext false
            json.decodeFromString<AuthUser>(response.body?.string().orEmpty())
        }
        _passwordRecovery.value = type == "recovery"
        persistSession(AuthSession(accessToken, refreshToken, expiresAt, user))
        true
    }

    suspend fun updatePassword(password: String) = withContext(Dispatchers.IO) {
        require(password.length >= 6) { "Parola trebuie să aibă cel puțin 6 caractere." }
        val active = checkNotNull(session) { "Linkul de resetare a expirat. Cere unul nou." }
        val request = Request.Builder().url("${config.url.trimEnd('/')}/auth/v1/user")
            .header("apikey", config.anonKey)
            .header("Authorization", "Bearer ${active.access_token}")
            .header("Content-Type", "application/json")
            .put("{\"password\":${json.encodeToString(password)}}".toRequestBody(JSON_MEDIA))
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw SupabaseException(response.code, response.body?.string().orEmpty())
        }
        _passwordRecovery.value = false
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        val active = session ?: return@withContext
        val request = Request.Builder().url("${config.url.trimEnd('/')}/auth/v1/logout")
            .header("apikey", config.anonKey).header("Authorization", "Bearer ${active.access_token}")
            .post("{}".toRequestBody(JSON_MEDIA)).build()
        client.newCall(request).execute().close()
        clearSession()
        _passwordRecovery.value = false
    }

    private suspend fun post(path: String, payload: String, persist: Boolean): AuthSession? = withContext(Dispatchers.IO) {
        check(config.isConfigured) { "Lipsește configurația Supabase." }
        val request = Request.Builder().url("${config.url.trimEnd('/')}$path")
            .header("apikey", config.anonKey).header("Content-Type", "application/json")
            .post(payload.toRequestBody(JSON_MEDIA)).build()
        client.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw SupabaseException(response.code, body)
            val root = json.parseToJsonElement(body).jsonObject
            val result = when {
                root["access_token"] != null -> json.decodeFromString<AuthSession>(body)
                root["session"] != null && root["session"]?.toString() != "null" -> json.decodeFromString<AuthSession>(root.getValue("session").toString())
                else -> null
            }
            if (persist && result != null) persistSession(result)
            result
        }
    }

    private fun persistSession(value: AuthSession) {
        store.save(value)
        _session.value = value
    }

    private fun clearSession() {
        store.clear()
        _session.value = null
    }

    private companion object {
        const val REFRESH_LEEWAY_SECONDS = 60L
        val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()
    }
}
