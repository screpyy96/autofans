package ro.autofans.app.ui

import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import ro.autofans.app.R
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.MobileApi
import ro.autofans.app.data.SupabaseAuthRepository

/** First-run entry point. Android owns the single branded splash; onboarding
 * is stored locally and only appears until the user chooses to continue. */
@Composable
fun AutoFansApp(
    repository: ListingRepository,
    authRepository: SupabaseAuthRepository,
    mobileApi: MobileApi,
    pendingConversationId: StateFlow<Long?>,
    accountRefreshVersion: StateFlow<Int>,
    onConversationOpened: (Long) -> Unit,
) {
    val context = LocalContext.current
    val preferences = remember(context) {
        context.getSharedPreferences("autofans_preferences", Context.MODE_PRIVATE)
    }
    var onboardingComplete by remember {
        mutableStateOf(preferences.getBoolean("onboarding_complete", false))
    }

    if (!onboardingComplete) {
        OnboardingScreen(onFinished = {
            preferences.edit().putBoolean("onboarding_complete", true).apply()
            onboardingComplete = true
        })
    } else {
        AutoFansNavigation(
            repository = repository,
            authRepository = authRepository,
            mobileApi = mobileApi,
            pendingConversationId = pendingConversationId,
            accountRefreshVersion = accountRefreshVersion,
            onConversationOpened = onConversationOpened,
        )
    }
}

private data class OnboardingPage(
    val eyebrow: String,
    val title: String,
    val description: String,
    val illustrationRes: Int,
)

@Composable
private fun OnboardingScreen(onFinished: () -> Unit) {
    val pages = listOf(
        OnboardingPage(
            "Bun venit",
            "Cumpără cu încredere",
            "Descoperă anunțuri clare, filtre utile și detalii care te ajută să alegi mai bine.",
            R.drawable.onboarding_buy,
        ),
        OnboardingPage(
            "Alege informat",
            "Compară înainte să decizi",
            "Păstrează până la trei mașini și compară prețul, kilometrajul și dotările într-un singur loc.",
            R.drawable.onboarding_compare,
        ),
        OnboardingPage(
            "Totul într-un singur loc",
            "Vinde simplu și sigur",
            "Publică anunțul, vorbește direct cu cumpărătorii și gestionează totul din contul tău.",
            R.drawable.onboarding_sell,
        ),
    )
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val scope = rememberCoroutineScope()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(color = androidx.compose.ui.graphics.Color.White, shape = RoundedCornerShape(18.dp)) {
                Image(
                    painter = painterResource(R.drawable.autofans_logo),
                    contentDescription = "AutoFans",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.width(210.dp).padding(12.dp),
                )
            }
            Spacer(Modifier.height(12.dp))
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxWidth().weight(1f),
            ) { page ->
                val current = pages[page]
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Spacer(Modifier.weight(.15f))
                    Image(
                        painter = painterResource(current.illustrationRes),
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxWidth().height(300.dp).padding(horizontal = 16.dp),
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(current.eyebrow.uppercase(), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(10.dp))
                    Text(current.title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Text(current.description, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.weight(1f))
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                pages.indices.forEach { index ->
                    Surface(
                        modifier = Modifier.size(width = if (index == pagerState.currentPage) 28.dp else 8.dp, height = 8.dp),
                        shape = CircleShape,
                        color = if (index == pagerState.currentPage) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = .35f),
                    ) {}
                }
            }
            Spacer(Modifier.height(24.dp))
            Button(
                onClick = {
                    if (pagerState.currentPage == pages.lastIndex) onFinished()
                    else scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                },
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) { Text(if (pagerState.currentPage == pages.lastIndex) "Începe acum" else "Continuă") }
            Spacer(Modifier.height(10.dp))
            OutlinedButton(onClick = onFinished, modifier = Modifier.fillMaxWidth()) { Text("Sari peste") }
        }
    }
}
