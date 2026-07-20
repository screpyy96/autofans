package ro.autofans.app

import android.os.Bundle
import android.content.Intent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import ro.autofans.app.data.SupabaseConfig
import ro.autofans.app.data.MobileApi
import ro.autofans.app.data.SecureSessionStore
import ro.autofans.app.data.SupabaseAuthRepository
import ro.autofans.app.data.SupabaseListingRepository
import ro.autofans.app.ui.AutoFansApp
import ro.autofans.app.ui.theme.AutoFansTheme
import ro.autofans.app.push.AutoFansFirebaseMessagingService

class MainActivity : ComponentActivity() {
    private lateinit var authRepository: SupabaseAuthRepository
    private val pendingConversationId = MutableStateFlow<Long?>(null)
    private val accountRefreshVersion = MutableStateFlow(0)
    private val accountStatusReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == AutoFansFirebaseMessagingService.ACTION_ACCOUNT_STATUS_UPDATED) {
                accountRefreshVersion.value += 1
            }
        }
    }
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
                    accountRefreshVersion = accountRefreshVersion,
                    onConversationOpened = { conversationId ->
                        if (pendingConversationId.value == conversationId) {
                            pendingConversationId.value = null
                        }
                    },
                )
            }
        }
        ContextCompat.registerReceiver(
            this,
            accountStatusReceiver,
            IntentFilter(AutoFansFirebaseMessagingService.ACTION_ACCOUNT_STATUS_UPDATED),
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
        intent?.data?.let(::handleIncomingUri)
    }

    override fun onDestroy() {
        unregisterReceiver(accountStatusReceiver)
        super.onDestroy()
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
            uri.scheme == "autofans" && uri.host == "account" -> {
                accountRefreshVersion.value += 1
            }
        }
    }
}
