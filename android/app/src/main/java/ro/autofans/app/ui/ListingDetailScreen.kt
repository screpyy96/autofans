package ro.autofans.app.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.AsyncImage
import com.mapbox.geojson.Point
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.rememberMapViewportState
import com.mapbox.maps.extension.compose.annotation.generated.CircleAnnotation
import ro.autofans.app.BuildConfig
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import ro.autofans.app.data.Listing
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.MobileApi
import ro.autofans.app.data.SellerPublicProfile
import ro.autofans.app.data.SellerPublicRepository

@Composable
fun ListingDetailRoute(slug: String, repository: ListingRepository, onBack: () -> Unit, mobileApi: MobileApi, onMessages: (Long?) -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val viewModel: ListingDetailViewModel = viewModel(key = slug, factory = ListingDetailViewModelFactory(slug, repository))
    val state by viewModel.state.collectAsStateWithLifecycle()
    ListingDetailScreen(state, onBack, viewModel::load, mobileApi, onMessages, onSeller, onCompare)
}

@Composable
fun ListingDetailScreen(state: ListingDetailUiState, onBack: () -> Unit, onRetry: () -> Unit, mobileApi: MobileApi, onMessages: (Long?) -> Unit, onSeller: (String) -> Unit, onCompare: () -> Unit) {
    val listing = state.listing
    val sellerRepository = remember { SellerPublicRepository(ro.autofans.app.data.SupabaseConfig(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY)) }
    var sellerProfile by remember(listing?.ownerId) { mutableStateOf<SellerPublicProfile?>(null) }
    var contactSheetOpen by remember(listing?.id) { mutableStateOf(false) }
    LaunchedEffect(listing?.ownerId) {
        val sellerId = listing?.ownerId ?: return@LaunchedEffect
        runCatching { sellerRepository.seller(sellerId) }
            .onSuccess { sellerProfile = it }
            .onFailure { sellerProfile = null }
    }
    LaunchedEffect(listing?.id, listing?.ownerId) {
        val currentListing = listing ?: return@LaunchedEffect
        if (mobileApi.currentUserId() == currentListing.ownerId) return@LaunchedEffect
        runCatching { mobileApi.recordListingView(currentListing.id) }
    }
    if (listing != null && contactSheetOpen) {
        ContactOptionsSheet(
            listing = listing,
            sellerProfile = sellerProfile,
            mobileApi = mobileApi,
            onMessages = onMessages,
            onDismiss = { contactSheetOpen = false },
        )
    }
    Scaffold(
        bottomBar = { if (listing != null) ListingActionBar(listing, onContact = { contactSheetOpen = true }, mobileApi = mobileApi) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        when {
            state.isLoading -> LoadingListing(Modifier.padding(padding))
            listing != null -> PremiumListingDetail(listing, sellerProfile, Modifier.padding(padding), onBack, mobileApi, onSeller, onCompare, onOpenContact = { contactSheetOpen = true })
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
private fun PremiumListingDetail(listing: Listing, sellerProfile: SellerPublicProfile?, modifier: Modifier, onBack: () -> Unit, mobileApi: MobileApi, onSeller: (String) -> Unit, onCompare: () -> Unit, onOpenContact: () -> Unit) {
    val scope = rememberCoroutineScope()
    var actionError by remember { mutableStateOf<String?>(null) }
    Box(modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 22.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item { ListingHero(listing) }
            item {
                ListingSummaryCard(
                    listing = listing,
                    modifier = Modifier.padding(horizontal = 20.dp),
                    onCompare = {
                        ComparisonStore.toggle(listing)
                        onCompare()
                    },
                    onReport = {
                        scope.launch {
                            runCatching {
                                mobileApi.call("report_listing", buildJsonObject {
                                    put("listingId", listing.id)
                                    put("reason", "other")
                                    put("details", "Raport trimis din aplicația Android")
                                })
                            }.onSuccess { actionError = "Raportul a fost trimis." }
                                .onFailure { actionError = it.message ?: "Nu am putut trimite raportul." }
                        }
                    },
                )
            }
            item { ListingContactCard(listing, sellerProfile, Modifier.padding(horizontal = 20.dp), onOpenContact = onOpenContact) }
            actionError?.let { message ->
                item { InlineMessage(message, Modifier.padding(horizontal = 20.dp), isError = !message.startsWith("Raportul")) }
            }
            item { PremiumSpecsCard(listing, Modifier.padding(horizontal = 20.dp)) }
            if (listing.features.isNotEmpty()) item { FeaturesCard(listing.features, Modifier.padding(horizontal = 20.dp)) }
            if (listing.latitude != null && listing.longitude != null && BuildConfig.MAPBOX_PUBLIC_TOKEN.isNotBlank()) {
                item { ListingLocationMap(listing, Modifier.padding(horizontal = 20.dp)) }
            }
            listing.ownerId?.let { sellerId -> item { SellerCard(sellerProfile = sellerProfile, onClick = { onSeller(sellerId) }, modifier = Modifier.padding(horizontal = 20.dp)) } }
            if (listing.description.isNotBlank()) item { DescriptionCard(listing.description, Modifier.padding(horizontal = 20.dp)) }
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

@Composable
private fun ListingContactCard(
    listing: Listing,
    sellerProfile: SellerPublicProfile?,
    modifier: Modifier,
    onOpenContact: () -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            val sellerAvatarUrl = sellerProfile?.avatarUrl
            val sellerDisplayName = sellerProfile?.displayName
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (!sellerAvatarUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = sellerAvatarUrl,
                        contentDescription = sellerDisplayName,
                        modifier = Modifier.size(48.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Surface(
                        modifier = Modifier.size(48.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer,
                    ) {
                        Icon(
                            Icons.Default.Verified,
                            contentDescription = null,
                            modifier = Modifier.padding(12.dp),
                            tint = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("Contactează vânzătorul", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                    Text(
                        sellerProfile?.displayName ?: "Răspuns direct în AutoFans",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Surface(shape = RoundedCornerShape(999.dp), color = MaterialTheme.colorScheme.primaryContainer) {
                    Text(
                        "Rapid",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            Text(
                sellerProfile?.displayName?.let { "Discută direct cu $it în chat, telefon sau WhatsApp." }
                    ?: "Alege canalul de contact preferat pentru acest anunț.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = onOpenContact,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(18.dp),
            ) {
                Text("Contactează")
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                QuickFactCard("Canale", if (sellerProfile?.phone.isNullOrBlank()) "Chat în app" else "Chat • Telefon • WhatsApp", Modifier.weight(1f))
                QuickFactCard("Răspuns", "Direct", Modifier.weight(1f))
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ListingHero(listing: Listing) {
    val pagerState = rememberPagerState(pageCount = { maxOf(listing.images.size, 1) })
    val scope = rememberCoroutineScope()
    Column(modifier = Modifier.fillMaxWidth()) {
        if (listing.images.isNotEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().height(318.dp)) {
                HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { index ->
                    val image = listing.images[index]
                    if (image.url != null) {
                        AsyncImage(
                            model = image.url,
                            contentDescription = "Fotografie ${index + 1} din ${listing.images.size}",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop,
                        )
                    } else {
                        ListingHeroPlaceholder()
                    }
                }
                Surface(
                    modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
                    shape = RoundedCornerShape(50),
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
                ) {
                    Text(
                        "${pagerState.currentPage + 1} / ${listing.images.size}",
                        modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                        color = MaterialTheme.colorScheme.onSurface,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            LazyRow(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(end = 20.dp),
            ) {
                items(listing.images.size) { index ->
                    val image = listing.images[index]
                    Surface(
                        onClick = { scope.launch { pagerState.animateScrollToPage(index) } },
                        shape = RoundedCornerShape(18.dp),
                        tonalElevation = if (pagerState.currentPage == index) 4.dp else 0.dp,
                        shadowElevation = if (pagerState.currentPage == index) 4.dp else 0.dp,
                        color = if (pagerState.currentPage == index) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(3.dp)
                                .width(92.dp)
                                .height(64.dp)
                                .clip(RoundedCornerShape(15.dp)),
                        ) {
                            if (image.url != null) {
                                AsyncImage(
                                    model = image.url,
                                    contentDescription = "Miniatură ${index + 1}",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop,
                                )
                            } else {
                                ListingHeroPlaceholder()
                            }
                        }
                    }
                }
            }
        } else {
            Box(modifier = Modifier.fillMaxWidth().height(300.dp)) { ListingHeroPlaceholder() }
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

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ListingSummaryCard(
    listing: Listing,
    modifier: Modifier,
    onCompare: () -> Unit,
    onReport: () -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    formatPrice(listing.price, listing.currency),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.ExtraBold,
                )
                Text(listing.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            }
            if (listing.locationLabel.isNotBlank()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(5.dp)); Text(listing.locationLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OverviewChip(listing.make)
                OverviewChip(listing.model)
                listing.bodyType?.label()?.let { OverviewChip(it) }
                listing.fuelType?.label()?.let { OverviewChip(it) }
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = .14f))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickFactCard("An fabricație", listing.year?.toString() ?: "—", Modifier.weight(1f))
                QuickFactCard("Kilometraj", listing.mileage?.let(::formatMileage) ?: "—", Modifier.weight(1f))
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                QuickFactCard("Combustibil", listing.fuelType?.label() ?: "—", Modifier.weight(1f))
                QuickFactCard("Cutie", listing.transmission?.label() ?: "—", Modifier.weight(1f))
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                FilledTonalButton(onClick = onCompare, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp)) {
                    Icon(Icons.Default.Scale, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(7.dp))
                    Text("Compară")
                }
                OutlinedButton(onClick = onReport, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp)) {
                    Icon(Icons.Default.ReportProblem, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Raportează")
                }
            }
        }
    }
}

@Composable
private fun OverviewChip(label: String) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.72f),
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
private fun QuickFactCard(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
@Suppress("COMPOSE_APPLIER_CALL_MISMATCH")
private fun ListingLocationMap(listing: Listing, modifier: Modifier = Modifier) {
    val latitude = listing.latitude ?: return
    val longitude = listing.longitude ?: return
    val point = remember(latitude, longitude) { Point.fromLngLat(longitude, latitude) }
    val mapPinColor = MaterialTheme.colorScheme.primary
    val viewportState = rememberMapViewportState {
        setCameraOptions {
            center(point)
            zoom(11.8)
        }
    }
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 18.dp, end = 18.dp, top = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(38.dp)) {
                    Icon(Icons.Default.LocationOn, null, modifier = Modifier.padding(9.dp), tint = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.width(10.dp))
                Column {
                    Text("Zona anunțului", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                    Text(listing.locationLabel, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Box(modifier = Modifier.padding(horizontal = 12.dp).fillMaxWidth().height(205.dp).clip(RoundedCornerShape(18.dp))) {
                MapboxMap(
                    modifier = Modifier.fillMaxSize(),
                    mapViewportState = viewportState,
                ) {
                    CircleAnnotation(point = point) {
                        circleRadius = 10.0
                        circleColor = mapPinColor
                        circleStrokeWidth = 3.0
                        circleStrokeColor = Color.White
                    }
                }
                Surface(
                    modifier = Modifier.align(Alignment.BottomStart).padding(10.dp),
                    shape = RoundedCornerShape(50),
                    color = MaterialTheme.colorScheme.secondary.copy(alpha = .92f),
                ) {
                    Text("Locație aproximativă", modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp), color = MaterialTheme.colorScheme.onSecondary, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                }
            }
            Text(
                "Pentru siguranță, pinul arată zona orașului, nu o adresă exactă.",
                modifier = Modifier.padding(start = 18.dp, end = 18.dp, bottom = 18.dp),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

private data class ListingDescriptionSection(
    val heading: String?,
    val bullets: List<String>,
    val paragraphs: List<String>,
)

private fun parseDescriptionSections(description: String): List<ListingDescriptionSection> {
    val parsed = description
        .split(Regex("\\n{2,}"))
        .map { block -> block.lines().map(String::trim).filter(String::isNotBlank) }
        .filter(List<String>::isNotEmpty)
        .map { lines ->
            val firstLine = lines.first()
            val rest = lines.drop(1)
            val hasHeading = rest.isNotEmpty() && !firstLine.startsWith("-") && !firstLine.startsWith("•")
            val content = if (hasHeading) rest else lines
            ListingDescriptionSection(
                heading = if (hasHeading) firstLine else null,
                bullets = content.mapNotNull { line ->
                    line.takeIf { it.startsWith("-") || it.startsWith("•") }
                        ?.replace(Regex("^[-•]\\s*"), "")
                        ?.takeIf(String::isNotBlank)
                },
                paragraphs = content.filter { !it.startsWith("-") && !it.startsWith("•") },
            )
        }
        .toMutableList()

    if (parsed.isEmpty()) return listOf(ListingDescriptionSection(null, emptyList(), listOf(description.trim())))

    val merged = mutableListOf<ListingDescriptionSection>()
    parsed.forEach { section ->
        val previous = merged.lastOrNull()
        if (previous != null && previous.heading != null && section.heading == null) {
            merged[merged.lastIndex] = previous.copy(
                bullets = previous.bullets + section.bullets,
                paragraphs = previous.paragraphs + section.paragraphs,
            )
        } else {
            merged += section
        }
    }
    return merged
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
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Specificații tehnice", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text(
                "Datele esențiale sunt grupate compact, ca să poți evalua mașina rapid.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            specs.chunked(2).forEach { row ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    row.forEach { (label, value) ->
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(value, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun SellerCard(sellerProfile: SellerPublicProfile?, onClick: () -> Unit, modifier: Modifier) {
    Card(onClick = onClick, modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary)) {
        val sellerAvatarUrl = sellerProfile?.avatarUrl
        val sellerDisplayName = sellerProfile?.displayName
        Row(modifier = Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            if (!sellerAvatarUrl.isNullOrBlank()) {
                AsyncImage(
                    model = sellerAvatarUrl,
                    contentDescription = sellerDisplayName,
                    modifier = Modifier.size(42.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Surface(modifier = Modifier.size(42.dp), shape = CircleShape, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .15f)) {
                    Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.padding(10.dp), tint = MaterialTheme.colorScheme.onSecondary)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(sellerProfile?.displayName ?: "Vânzător AutoFans", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondary)
                    if (sellerProfile?.isVerified == true) {
                        Text("Verificat", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = 0.78f))
                    }
                }
                Text("Vezi profilul public, anunțurile și recenziile", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .72f))
            }
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondary)
        }
    }
}

@Composable
private fun DescriptionCard(description: String, modifier: Modifier) {
    val sections = remember(description) { parseDescriptionSections(description) }
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Descriere anunț", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            sections.forEach { section ->
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        section.heading?.let {
                            Text(
                                it,
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.ExtraBold,
                            )
                        }
                        section.paragraphs.forEach { paragraph ->
                            Text(paragraph, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        section.bullets.forEach { bullet ->
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("•", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                Text(
                                    bullet,
                                    modifier = Modifier.weight(1f),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FeaturesCard(features: List<String>, modifier: Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Dotări și opțiuni", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Text(
                "${features.size} dotări incluse în anunț",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            features.chunked(2).forEach { row ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    row.forEach { feature ->
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f),
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Surface(
                                    modifier = Modifier.size(10.dp),
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primary,
                                ) {}
                                Text(
                                    feature,
                                    modifier = Modifier.weight(1f),
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Medium,
                                )
                            }
                        }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun ListingActionBar(listing: Listing, onContact: () -> Unit, mobileApi: MobileApi) {
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
                onClick = onContact,
                modifier = Modifier.weight(1f).height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Contactează")
            }
        }
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
private fun ContactOptionsSheet(
    listing: Listing,
    sellerProfile: SellerPublicProfile?,
    mobileApi: MobileApi,
    onMessages: (Long?) -> Unit,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var working by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Contactează vânzătorul", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
            Text(
                sellerProfile?.displayName?.let { "Alege cum vrei să vorbești cu $it." }
                    ?: "Alege metoda de contact pentru acest anunț.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = {
                    working = true
                    scope.launch {
                        runCatching {
                            mobileApi.call("start_conversation", buildJsonObject {
                                put("listingId", listing.id)
                                put("message", "Bună! Sunt interesat de acest anunț.")
                            })
                        }.onSuccess { response ->
                            runCatching { mobileApi.recordListingContact(listing.id, "message") }
                            error = null
                            onDismiss()
                            onMessages(response["conversationId"]?.toString()?.toLongOrNull())
                        }.onFailure {
                            error = it.message ?: "Nu am putut deschide conversația."
                        }
                        working = false
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(18.dp),
                enabled = !working,
            ) {
                if (working) CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                else Text("Chat în app")
            }
            FilledTonalButton(
                onClick = {
                    scope.launch { runCatching { mobileApi.recordListingContact(listing.id, "phone") } }
                    openSellerDialer(context, sellerProfile?.phone)
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(18.dp),
                enabled = !sellerProfile?.phone.isNullOrBlank(),
            ) { Text("Telefon") }
            OutlinedButton(
                onClick = {
                    scope.launch { runCatching { mobileApi.recordListingContact(listing.id, "whatsapp") } }
                    openSellerWhatsApp(context, sellerProfile?.phone, listing.title)
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(18.dp),
                enabled = !sellerProfile?.phone.isNullOrBlank(),
            ) { Text("WhatsApp") }
            error?.let { InlineMessage(it, Modifier.fillMaxWidth(), isError = true) }
            Spacer(Modifier.height(10.dp))
        }
    }
}

@Composable
private fun InlineMessage(message: String, modifier: Modifier, isError: Boolean) {
    Surface(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = if (isError) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.primaryContainer) {
        Text(message, modifier = Modifier.padding(12.dp), color = if (isError) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer, style = MaterialTheme.typography.bodySmall)
    }
}

private fun openSellerDialer(context: android.content.Context, phone: String?) {
    val sanitized = phone?.filter { it.isDigit() || it == '+' }?.takeIf(String::isNotBlank) ?: return
    runCatching {
        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$sanitized")))
    }
}

private fun openSellerWhatsApp(context: android.content.Context, phone: String?, listingTitle: String) {
    val sanitized = phone?.filter { it.isDigit() }?.takeIf(String::isNotBlank) ?: return
    val message = Uri.encode("Bună! Sunt interesat de anunțul \"$listingTitle\" de pe AutoFans.")
    val whatsappUri = Uri.parse("https://wa.me/$sanitized?text=$message")
    runCatching {
        context.startActivity(Intent(Intent.ACTION_VIEW, whatsappUri))
    }
}
