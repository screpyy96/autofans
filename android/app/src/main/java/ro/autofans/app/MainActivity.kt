package ro.autofans.app

import android.os.Bundle
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import ro.autofans.app.data.SupabaseConfig
import ro.autofans.app.data.MobileApi
import ro.autofans.app.data.SecureSessionStore
import ro.autofans.app.data.SupabaseAuthRepository
import ro.autofans.app.data.SupabaseListingRepository
import ro.autofans.app.ui.AutoFansApp
import ro.autofans.app.ui.theme.AutoFansTheme

class MainActivity : ComponentActivity() {
    private lateinit var authRepository: SupabaseAuthRepository
    private val pendingConversationId = MutableStateFlow<Long?>(null)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val repository = SupabaseListingRepository(
            SupabaseConfig(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY),
        )
        authRepository = SupabaseAuthRepository(
            SupabaseConfig(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY),
            SecureSessionStore(applicationContext),
        )
        val mobileApi = MobileApi(SupabaseConfig(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY), authRepository)
        setContent {
            AutoFansTheme {
                AutoFansApp(
                    repository = repository,
                    authRepository = authRepository,
                    mobileApi = mobileApi,
                    pendingConversationId = pendingConversationId,
                    onConversationOpened = { conversationId ->
                        if (pendingConversationId.value == conversationId) {
                            pendingConversationId.value = null
                        }
                    },
                )
            }
        }
        intent?.data?.let(::handleIncomingUri)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.let(::handleIncomingUri)
    }

    private fun handleIncomingUri(uri: android.net.Uri) {
        when {
            uri.scheme == "autofans" && uri.host == "auth" -> lifecycleScope.launch {
                authRepository.completeOAuthRedirect(uri)
            }
            uri.scheme == "autofans" && uri.host == "messages" -> {
                pendingConversationId.value = uri.lastPathSegment?.toLongOrNull()
            }
        }
    }
}
