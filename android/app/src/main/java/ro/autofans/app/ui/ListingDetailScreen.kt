package ro.autofans.app.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material.icons.filled.Scale
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.AsyncImage
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import ro.autofans.app.data.Listing
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.MobileApi

@Composable
fun ListingDetailRoute(slug: String, repository: ListingRepository, onBack: () -> Unit, mobileApi: MobileApi, onMessages: () -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val viewModel: ListingDetailViewModel = viewModel(key = slug, factory = ListingDetailViewModelFactory(slug, repository))
    val state by viewModel.state.collectAsStateWithLifecycle()
    ListingDetailScreen(state, onBack, viewModel::load, mobileApi, onMessages, onSeller, onCompare)
}

@Composable
fun ListingDetailScreen(state: ListingDetailUiState, onBack: () -> Unit, onRetry: () -> Unit, mobileApi: MobileApi, onMessages: () -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val listing = state.listing
    Scaffold(
        bottomBar = { if (listing != null) ListingActionBar(listing, mobileApi, onMessages) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        when {
            state.isLoading -> LoadingListing(Modifier.padding(padding))
            listing != null -> PremiumListingDetail(listing, Modifier.padding(padding), onBack, mobileApi, onSeller, onCompare)
            state.error == "Anunțul nu mai este disponibil." -> ListingUnavailableState(onRetry, Modifier.padding(padding))
            else -> ErrorState(state.error ?: "Nu am putut încărca anunțul.", onRetry)
        }
    }
}

@Composable
private fun LoadingListing(modifier: Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
}

@Composable
private fun ListingUnavailableState(onRetry: () -> Unit, modifier: Modifier = Modifier) = Column(
    modifier.fillMaxSize().padding(32.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally,
) {
    Text("Anunțul nu mai este disponibil.", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
    Spacer(Modifier.height(8.dp)); Text("Este posibil să fi fost retras sau vândut.")
    Spacer(Modifier.height(16.dp)); Button(onClick = onRetry) { Text("Reîncearcă") }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun PremiumListingDetail(listing: Listing, modifier: Modifier, onBack: () -> Unit, mobileApi: MobileApi, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val scope = rememberCoroutineScope()
    var actionError by remember { mutableStateOf<String?>(null) }
    Box(modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 22.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item { ListingHero(listing) }
            item { ListingOverview(listing, Modifier.padding(horizontal = 20.dp)) }
            item {
                Row(modifier = Modifier.padding(horizontal = 20.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    FilledTonalButton(onClick = { ComparisonStore.toggle(listing); onCompare() }, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.Scale, contentDescription = null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(7.dp)); Text("Compară")
                    }
                    OutlinedButton(
                        onClick = {
                            scope.launch {
                                runCatching {
                                    mobileApi.call("report_listing", buildJsonObject {
                                        put("listingId", listing.id); put("reason", "other"); put("details", "Raport trimis din aplicația Android")
                                    })
                                }.onSuccess { actionError = "Raportul a fost trimis." }
                                    .onFailure { actionError = it.message ?: "Nu am putut trimite raportul." }
                            }
                        },
                    ) { Icon(Icons.Default.ReportProblem, contentDescription = null, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text("Raportează") }
                }
            }
            actionError?.let { message ->
                item { InlineMessage(message, Modifier.padding(horizontal = 20.dp), isError = !message.startsWith("Raportul")) }
            }
            item { PremiumSpecsCard(listing, Modifier.padding(horizontal = 20.dp)) }
            listing.ownerId?.let { sellerId -> item { SellerCard(onClick = { onSeller(sellerId) }, modifier = Modifier.padding(horizontal = 20.dp)) } }
            if (listing.description.isNotBlank()) item { DescriptionCard(listing.description, Modifier.padding(horizontal = 20.dp)) }
            if (listing.features.isNotEmpty()) item { FeaturesCard(listing.features, Modifier.padding(horizontal = 20.dp)) }
        }
        Surface(
            onClick = onBack,
            modifier = Modifier.statusBarsPadding().padding(start = 16.dp, top = 12.dp).size(46.dp).align(Alignment.TopStart),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.surface.copy(alpha = .94f),
            shadowElevation = 4.dp,
        ) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Înapoi", modifier = Modifier.padding(12.dp), tint = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ListingHero(listing: Listing) {
    Box(modifier = Modifier.fillMaxWidth().height(360.dp)) {
        if (listing.images.isNotEmpty()) {
            val pagerState = rememberPagerState(pageCount = { listing.images.size })
            HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { index ->
                val image = listing.images[index]
                if (image.url != null) {
                    AsyncImage(model = image.url, contentDescription = "Fotografie ${index + 1} din ${listing.images.size}", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                } else {
                    ListingHeroPlaceholder()
                }
            }
            Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xB3000000)))) )
            Surface(
                modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp), shape = RoundedCornerShape(50), color = Color.Black.copy(alpha = .55f),
            ) {
                Text("${pagerState.currentPage + 1} / ${listing.images.size}", modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp), color = Color.White, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            }
        } else {
            ListingHeroPlaceholder()
        }
    }
}

@Composable
private fun ListingHeroPlaceholder() {
    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.secondary), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("AutoFans", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onSecondary)
            Text("Fotografiile anunțului lipsesc", color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .72f))
        }
    }
}

@Composable
private fun ListingOverview(listing: Listing, modifier: Modifier) {
    Card(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            Text(listing.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Text(formatPrice(listing.price, listing.currency), style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold)
            if (listing.locationLabel.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(5.dp)); Text(listing.locationLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = .14f))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                QuickFact("An", listing.year?.toString() ?: "—")
                QuickFact("Km", listing.mileage?.let(::formatMileage) ?: "—")
                QuickFact("Cutie", listing.transmission?.label() ?: "—")
            }
        }
    }
}

@Composable
private fun QuickFact(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PremiumSpecsCard(listing: Listing, modifier: Modifier) {
    val specs = listOfNotNull(
        listing.year?.let { "An fabricație" to it.toString() }, listing.mileage?.let { "Kilometraj" to formatMileage(it) },
        listing.fuelType?.let { "Combustibil" to it.label() }, listing.transmission?.let { "Transmisie" to it.label() },
        listing.bodyType?.let { "Caroserie" to it.label() }, listing.power?.let { "Putere" to "$it CP" }, listing.engineSize?.let { "Motor" to "$it L" },
        listing.doors?.let { "Uși" to it.toString() }, listing.seats?.let { "Locuri" to it.toString() },
    )
    if (specs.isEmpty()) return
    Card(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .62f))) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Specificații", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            specs.chunked(2).forEach { row ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    row.forEach { (label, value) ->
                        Column(modifier = Modifier.weight(1f)) {
                            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun SellerCard(onClick: () -> Unit, modifier: Modifier) {
    Card(onClick = onClick, modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary)) {
        Row(modifier = Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.size(42.dp), shape = CircleShape, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .15f)) {
                Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.padding(10.dp), tint = MaterialTheme.colorScheme.onSecondary)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Vânzător AutoFans", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondary)
                Text("Vezi profilul, anunțurile și recenziile", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .72f))
            }
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondary)
        }
    }
}

@Composable
private fun DescriptionCard(description: String, modifier: Modifier) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Despre această mașină", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
        Text(description, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun FeaturesCard(features: List<String>, modifier: Modifier) {
    Card(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Dotări", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            features.take(16).chunked(2).forEach { row ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { feature ->
                        Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(10.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
                            Text(feature, modifier = Modifier.padding(10.dp), maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun ListingActionBar(listing: Listing, mobileApi: MobileApi, onMessages: () -> Unit) {
    val scope = rememberCoroutineScope()
    var favoriteWorking by remember { mutableStateOf(false) }
    Surface(shadowElevation = 12.dp, color = MaterialTheme.colorScheme.surface) {
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedButton(
                onClick = {
                    favoriteWorking = true
                    scope.launch { runCatching { mobileApi.call("toggle_favorite", buildJsonObject { put("listingId", listing.id) }) }; favoriteWorking = false }
                },
                enabled = !favoriteWorking,
                modifier = Modifier.size(54.dp),
                shape = RoundedCornerShape(16.dp),
                contentPadding = PaddingValues(0.dp),
            ) { Icon(Icons.Default.FavoriteBorder, contentDescription = "Salvează la favorite") }
            Button(
                onClick = {
                    scope.launch {
                        runCatching { mobileApi.call("start_conversation", buildJsonObject { put("listingId", listing.id); put("message", "Bună! Sunt interesat de acest anunț.") }) }
                            .onSuccess { onMessages() }
                    }
                },
                modifier = Modifier.weight(1f).height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) { Text("Contactează vânzătorul") }
        }
    }
}

@Composable
private fun InlineMessage(message: String, modifier: Modifier, isError: Boolean) {
    Surface(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = if (isError) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.primaryContainer) {
        Text(message, modifier = Modifier.padding(12.dp), color = if (isError) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer, style = MaterialTheme.typography.bodySmall)
    }
}
