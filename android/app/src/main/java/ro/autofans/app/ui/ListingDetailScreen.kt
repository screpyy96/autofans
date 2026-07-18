package ro.autofans.app.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.AsyncImage
import ro.autofans.app.data.Listing
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.MobileApi
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Composable
fun ListingDetailRoute(slug: String, repository: ListingRepository, onBack: () -> Unit, mobileApi: MobileApi, onMessages: () -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val viewModel: ListingDetailViewModel = viewModel(
        key = slug,
        factory = ListingDetailViewModelFactory(slug, repository),
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    ListingDetailScreen(state, onBack, viewModel::load, mobileApi, onMessages, onSeller, onCompare)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListingDetailScreen(state: ListingDetailUiState, onBack: () -> Unit, onRetry: () -> Unit, mobileApi: MobileApi, onMessages: () -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.listing?.title ?: "Anunț") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi") } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
    ) { padding ->
        when {
            state.isLoading -> Column(Modifier.fillMaxSize().padding(padding), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator() }
            state.listing != null -> ListingDetailContent(state.listing, Modifier.padding(padding), mobileApi, onMessages, onSeller, onCompare)
            state.error == "Anunțul nu mai este disponibil." -> ListingUnavailableState(onRetry, Modifier.padding(padding))
            else -> ErrorState(state.error ?: "Nu am putut încărca anunțul.", onRetry)
        }
    }
}

@Composable
private fun ListingUnavailableState(onRetry: () -> Unit, modifier: Modifier = Modifier) = Column(
    modifier.fillMaxSize().padding(32.dp),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally,
) {
    Text("Anunțul nu mai este disponibil.", style = MaterialTheme.typography.titleLarge)
    Spacer(Modifier.height(8.dp))
    Text("Este posibil să fi fost retras sau vândut.")
    Spacer(Modifier.height(16.dp))
    androidx.compose.material3.Button(onClick = onRetry) { Text("Reîncearcă") }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ListingDetailContent(listing: Listing, modifier: Modifier = Modifier, mobileApi: MobileApi, onMessages: () -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val scope = rememberCoroutineScope()
    var actionError by remember { mutableStateOf<String?>(null) }
    LazyColumn(modifier = modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            if (listing.images.isNotEmpty()) {
                val pagerState = rememberPagerState(pageCount = { listing.images.size })
                Column {
                    HorizontalPager(state = pagerState, modifier = Modifier.fillMaxWidth().height(290.dp)) { index ->
                        val image = listing.images[index]
                        if (image.url != null) {
                            AsyncImage(
                                model = image.url,
                                contentDescription = "Fotografie ${index + 1} din ${listing.images.size}",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop,
                            )
                        } else {
                            Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) { Text("Imagine indisponibilă") }
                        }
                    }
                    Text(
                        "${pagerState.currentPage + 1} / ${listing.images.size}",
                        modifier = Modifier.align(Alignment.End).padding(12.dp),
                        style = MaterialTheme.typography.labelMedium,
                    )
                }
            } else {
                Column(Modifier.fillMaxWidth().height(180.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) { Text("Fără fotografii pentru acest anunț") }
            }
        }
        item {
            Column(Modifier.padding(horizontal = 20.dp)) {
                Text(listing.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text(formatPrice(listing.price, listing.currency), style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold)
                if (listing.locationLabel.isNotBlank()) {
                    Spacer(Modifier.height(12.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(listing.locationLabel)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(onClick = { scope.launch { runCatching { mobileApi.call("toggle_favorite", buildJsonObject { put("listingId", listing.id) }) }.onFailure { actionError = it.message } } }, label = { Text("Favorite") })
                    AssistChip(onClick = { scope.launch { runCatching { mobileApi.call("start_conversation", buildJsonObject { put("listingId", listing.id); put("message", "Bună! Sunt interesat de acest anunț.") }) }.onSuccess { onMessages() }.onFailure { actionError = it.message } } }, label = { Text("Contactează vânzătorul") })
                    AssistChip(onClick = { scope.launch { runCatching { mobileApi.call("report_listing", buildJsonObject { put("listingId", listing.id); put("reason", "other"); put("details", "Raport trimis din aplicația Android") }) }.onFailure { actionError = it.message } } }, label = { Text("Raportează") })
                    listing.ownerId?.let { sellerId -> AssistChip(onClick = { onSeller(sellerId) }, label = { Text("Vânzător") }) }
                    AssistChip(onClick = { ComparisonStore.toggle(listing); onCompare() }, label = { Text("Compară") })
                }
                actionError?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        }
        item { SpecsCard(listing, Modifier.padding(horizontal = 20.dp)) }
        if (listing.description.isNotBlank()) {
            item {
                Column(Modifier.padding(horizontal = 20.dp)) {
                    Text("Descriere", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text(listing.description, style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
        if (listing.features.isNotEmpty()) {
            item {
                Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 28.dp)) {
                    Text("Dotări", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    listing.features.take(16).chunked(2).forEach { row ->
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            row.forEach { feature -> AssistChip(onClick = {}, label = { Text(feature, maxLines = 1, overflow = TextOverflow.Ellipsis) }) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SpecsCard(listing: Listing, modifier: Modifier = Modifier) {
    val specs = listOfNotNull(
        listing.year?.let { "An" to it.toString() },
        listing.mileage?.let { "Kilometraj" to formatMileage(it) },
        listing.fuelType?.let { "Combustibil" to it.label() },
        listing.transmission?.let { "Cutie" to it.label() },
        listing.bodyType?.let { "Caroserie" to it.label() },
        listing.power?.let { "Putere" to "$it CP" },
        listing.engineSize?.let { "Motor" to "$it L" },
        listing.doors?.let { "Uși" to it.toString() },
        listing.seats?.let { "Locuri" to it.toString() },
    )
    if (specs.isEmpty()) return
    Card(modifier = modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(Modifier.padding(16.dp)) {
            Text("Specificații", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            specs.chunked(2).forEach { row ->
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                    row.forEach { (label, value) ->
                        Column(Modifier.weight(1f)) {
                            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(value, fontWeight = FontWeight.SemiBold)
                        }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}
