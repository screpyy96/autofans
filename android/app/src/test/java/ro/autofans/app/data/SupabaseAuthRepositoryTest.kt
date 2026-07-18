package ro.autofans.app.data

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.MediaType.Companion.toMediaType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SupabaseAuthRepositoryTest {
    @Test
    fun `expired access token is refreshed before a mobile request`() = runBlocking {
        val store = FakeSessionStore(
            AuthSession(
                access_token = "expired-token",
                refresh_token = "refresh-token",
                expires_at = (System.currentTimeMillis() / 1_000) - 1,
                user = AuthUser("user-1", "buyer@autofans.ro"),
            ),
        )
        var requestedPath = ""
        val client = OkHttpClient.Builder().addInterceptor(Interceptor { chain ->
            requestedPath = chain.request().url.encodedPath
            Response.Builder()
                .request(chain.request())
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body(
                    """{"access_token":"fresh-token","refresh_token":"next-refresh","expires_at":4102444800,"user":{"id":"user-1","email":"buyer@autofans.ro"}}"""
                        .toResponseBody("application/json".toMediaType()),
                )
                .build()
        }).build()
        val repository = SupabaseAuthRepository(
            SupabaseConfig("https://example.supabase.co", "anon-key"),
            store,
            client,
        )

        val refreshed = repository.activeSession()

        assertEquals("/auth/v1/token", requestedPath)
        assertEquals("fresh-token", refreshed.access_token)
        assertEquals("fresh-token", store.read()?.access_token)
    }

    private class FakeSessionStore(initial: AuthSession?) : SessionStore {
        private var value = initial
        override fun read(): AuthSession? = value
        override fun save(session: AuthSession) { value = session }
        override fun clear() { value = null }
    }
}
