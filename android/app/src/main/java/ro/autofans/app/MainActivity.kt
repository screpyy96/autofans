package ro.autofans.app

import android.os.Bundle
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
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
            AutoFansTheme { AutoFansApp(repository, authRepository, mobileApi) }
        }
        intent?.data?.let(::completeAuthRedirect)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.let(::completeAuthRedirect)
    }

    private fun completeAuthRedirect(uri: android.net.Uri) {
        if (uri.scheme == "autofans" && uri.host == "auth") lifecycleScope.launch {
            authRepository.completeOAuthRedirect(uri)
        }
    }
}
