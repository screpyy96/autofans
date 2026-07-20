package ro.autofans.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Sort
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.AsyncImage
import ro.autofans.app.data.Listing
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.ListingSearchFilters
import ro.autofans.app.data.ListingSort
import ro.autofans.app.data.MobileApi
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

@Composable
fun CatalogRoute(
    repository: ListingRepository,
    mobileApi: MobileApi,
    isAuthenticated: Boolean,
    onListingSelected: (String) -> Unit,
    onAccount: () -> Unit,
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val viewModel: CatalogViewModel = viewModel(factory = CatalogViewModelFactory(repository))
    val state by viewModel.state.collectAsStateWithLifecycle()
    val savedQuery by SavedSearchStore.query.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    var isLocating by remember { mutableStateOf(false) }
    var locationMessage by remember { mutableStateOf<String?>(null) }
    var favoriteIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var favoriteError by remember { mutableStateOf<String?>(null) }
    fun applyNearbyLocation(location: android.location.Location) {
        isLocating = false
        locationMessage = null
        viewModel.applyFilters(state.filters.copy(latitude = location.latitude, longitude = location.longitude, radiusKm = 25))
    }
    fun requestNearbyLocation() {
        isLocating = true
        requestLastKnownLocation(
            context = context,
            onLocation = ::applyNearbyLocation,
            onError = { message -> isLocating = false; locationMessage = message },
        )
    }
    val locationPermissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions(),
    ) { permissions ->
        if (permissions[android.Manifest.permission.ACCESS_COARSE_LOCATION] == true || permissions[android.Manifest.permission.ACCESS_FINE_LOCATION] == true) requestNearbyLocation()
        else { isLocating = false; locationMessage = "Activează locația pentru a căuta mașini din apropiere." }
    }
    LaunchedEffect(savedQuery) {
        savedQuery?.let { query ->
            val (text, filters) = ListingSearchFilters.fromSavedSearchQuery(query)
            viewModel.applySavedSearch(text, filters)
            SavedSearchStore.consume()
        }
    }
    LaunchedEffect(isAuthenticated) {
        if (!isAuthenticated) {
            favoriteIds = emptySet()
            return@LaunchedEffect
        }
        runCatching { mobileApi.call("favorites") }
            .onSuccess { response ->
                favoriteIds = response["favorites"]
                    ?.jsonArray
                    ?.mapNotNull { row -> row.jsonObject["listing_id"]?.jsonPrimitive?.content }
                    ?.toSet()
                    ?: emptySet()
            }
            .onFailure { favoriteError = "Nu am putut încărca favoritele." }
    }
    CatalogScreen(
        state = state,
        onQueryChange = viewModel::updateQuery,
        onSearch = viewModel::submitSearch,
        onFiltersApplied = viewModel::applyFilters,
        onFiltersReset = viewModel::resetFilters,
        onSortSelected = viewModel::selectSort,
        onRetry = viewModel::refresh,
        onLoadMore = viewModel::loadNextPage,
        onListingSelected = onListingSelected,
        onAccount = onAccount,
        isAuthenticated = isAuthenticated,
        favoriteIds = favoriteIds,
        favoriteError = favoriteError,
        onToggleFavorite = { listing ->
            if (!isAuthenticated) {
                onAccount()
            } else {
                favoriteError = null
                scope.launch {
                    runCatching {
                        mobileApi.call("toggle_favorite", buildJsonObject { put("listingId", listing.id) })
                    }.onSuccess { response ->
                        val isFavorite = response["favorite"]?.jsonPrimitive?.booleanOrNull ?: !favoriteIds.contains(listing.id.toString())
                        favoriteIds = if (isFavorite) favoriteIds + listing.id.toString() else favoriteIds - listing.id.toString()
                    }.onFailure { error ->
                        favoriteError = error.message ?: "Nu am putut actualiza favoritele."
                    }
                }
            }
        },
        onSaveSearch = { name ->
            mobileApi.call(
                operation = "save_search",
                payload = buildJsonObject {
                    put("name", name)
                    put("query", state.filters.toSavedSearchQuery(state.query))
                },
            )
        },
        onUseNearby = {
            locationMessage = null
            val granted = androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED ||
                androidx.core.content.ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (granted) requestNearbyLocation()
            else locationPermissionLauncher.launch(arrayOf(android.Manifest.permission.ACCESS_COARSE_LOCATION, android.Manifest.permission.ACCESS_FINE_LOCATION))
        },
        isLocating = isLocating,
        locationMessage = locationMessage,
    )
}

@Suppress("MissingPermission", "DEPRECATION")
private fun requestLastKnownLocation(context: android.content.Context, onLocation: (android.location.Location) -> Unit, onError: (String) -> Unit) {
    val manager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as? android.location.LocationManager
        ?: return onError("Locația nu este disponibilă pe acest dispozitiv.")
    val providers = listOf(android.location.LocationManager.GPS_PROVIDER, android.location.LocationManager.NETWORK_PROVIDER)
        .filter { runCatching { manager.isProviderEnabled(it) }.getOrDefault(false) }
    if (providers.isEmpty()) return onError("Activează serviciile de locație și încearcă din nou.")
    providers.mapNotNull { provider -> runCatching { manager.getLastKnownLocation(provider) }.getOrNull() }
        .maxByOrNull { it.time }
        ?.let(onLocation)
        ?: manager.requestSingleUpdate(providers.first(), object : android.location.LocationListener {
            override fun onLocationChanged(location: android.location.Location) = onLocation(location)
        }, android.os.Looper.getMainLooper())
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogScreen(
    state: CatalogUiState,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    onFiltersApplied: (ListingSearchFilters) -> Unit,
    onFiltersReset: () -> Unit,
    onSortSelected: (ListingSort) -> Unit,
    onRetry: () -> Unit,
    onLoadMore: () -> Unit,
    onListingSelected: (String) -> Unit,
    onAccount: () -> Unit,
    isAuthenticated: Boolean = false,
    favoriteIds: Set<String> = emptySet(),
    favoriteError: String? = null,
    onToggleFavorite: (Listing) -> Unit = {},
    onSaveSearch: (suspend (String) -> Unit)? = null,
    onUseNearby: () -> Unit = {},
    isLocating: Boolean = false,
    locationMessage: String? = null,
) {
    var filtersOpen by remember { mutableStateOf(false) }
    var sortOpen by remember { mutableStateOf(false) }
    var saveSearchOpen by remember { mutableStateOf(false) }
    var savedSearchName by remember { mutableStateOf("") }
    var saveSearchError by remember { mutableStateOf<String?>(null) }
    var isSavingSearch by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    Scaffold(
        topBar = {},
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            CatalogSearchPanel(
                state = state,
                onQueryChange = onQueryChange,
                onSearch = onSearch,
                onOpenFilters = { filtersOpen = true },
                onOpenSort = { sortOpen = true },
                onResetFilters = onFiltersReset,
                onQuickFilter = onFiltersApplied,
                onUseNearby = onUseNearby,
                isLocating = isLocating,
                locationMessage = locationMessage,
            )
            if (isAuthenticated && onSaveSearch != null && (state.query.isNotBlank() || state.filters != ListingSearchFilters())) {
                FilledTonalButton(
                    onClick = { saveSearchOpen = true; saveSearchError = null },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                ) { Text("Salvează această căutare") }
            }
            favoriteError?.let { Text(it, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            CatalogContent(
                state = state,
                onRetry = onRetry,
                onLoadMore = onLoadMore,
                onListingSelected = onListingSelected,
                favoriteIds = favoriteIds,
                onToggleFavorite = onToggleFavorite,
                onExploreFilters = { filtersOpen = true },
            )
        }
    }
    if (filtersOpen) {
        FilterSheet(
            initial = state.filters,
            onDismiss = { filtersOpen = false },
            onApply = { filters -> onFiltersApplied(filters); filtersOpen = false },
            onReset = { onFiltersReset(); filtersOpen = false },
        )
    }
    if (sortOpen) {
        SortSheet(
            selected = state.sort,
            onDismiss = { sortOpen = false },
            onSelected = { sort -> onSortSelected(sort); sortOpen = false },
        )
    }
    if (saveSearchOpen) {
        AlertDialog(
            onDismissRequest = { if (!isSavingSearch) saveSearchOpen = false },
            title = { Text("Salvează căutarea") },
            text = {
                Column {
                    Text("Vei primi alertele existente pentru anunțurile care corespund acestor filtre.")
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = savedSearchName,
                        onValueChange = { savedSearchName = it },
                        label = { Text("Numele căutării") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("saved_search_name"),
                    )
                    saveSearchError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            },
            confirmButton = {
                Button(
                    enabled = savedSearchName.trim().isNotEmpty() && !isSavingSearch,
                    onClick = {
                        isSavingSearch = true
                        scope.launch {
                            runCatching { onSaveSearch?.invoke(savedSearchName.trim()) }
                                .onSuccess { savedSearchName = ""; saveSearchOpen = false }
                                .onFailure { saveSearchError = it.message ?: "Nu am putut salva căutarea." }
                            isSavingSearch = false
                        }
                    },
                ) { Text(if (isSavingSearch) "Se salvează…" else "Salvează") }
            },
            dismissButton = { TextButton(onClick = { saveSearchOpen = false }, enabled = !isSavingSearch) { Text("Renunță") } },
        )
    }
}

@Composable
private fun CatalogSearchPanel(
    state: CatalogUiState,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    onOpenFilters: () -> Unit,
    onOpenSort: () -> Unit,
    onResetFilters: () -> Unit,
    onQuickFilter: (ListingSearchFilters) -> Unit,
    onUseNearby: () -> Unit,
    isLocating: Boolean,
    locationMessage: String?,
) {
    val activeFilterCount = state.filters.activeCount()
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp)) {
        Text("Găsește mașina potrivită", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(3.dp))
        Text("Caută rapid printre anunțurile AutoFans.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedTextField(
                value = state.query,
                onValueChange = onQueryChange,
                modifier = Modifier.weight(1f).testTag("catalog_search"),
                singleLine = true,
                shape = RoundedCornerShape(18.dp),
                placeholder = { Text("Caută o mașină", maxLines = 1) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = { IconButton(onClick = onSearch) { Icon(Icons.AutoMirrored.Filled.ArrowForward, "Caută") } },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    focusedBorderColor = androidx.compose.ui.graphics.Color.Transparent,
                    unfocusedBorderColor = androidx.compose.ui.graphics.Color.Transparent,
                ),
            )
            Surface(
                onClick = onOpenFilters,
                modifier = Modifier.size(56.dp),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.primary,
            ) {
                Icon(
                    Icons.Default.FilterList,
                    contentDescription = "Filtre",
                    modifier = Modifier.padding(16.dp),
                    tint = MaterialTheme.colorScheme.onPrimary,
                )
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FilledTonalButton(
                onClick = onUseNearby,
                enabled = !isLocating,
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
            ) {
                if (isLocating) CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                else Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(17.dp))
                Spacer(Modifier.width(7.dp))
                Text(
                    when {
                        isLocating -> "Îți găsim zona…"
                        state.filters.radiusKm != null -> "În jurul meu · ${state.filters.radiusKm} km"
                        else -> "În jurul meu"
                    },
                )
            }
            FilterPill(
                label = "Automată",
                selected = "automatic" in state.filters.transmissions,
                onClick = {
                    val selected = "automatic" in state.filters.transmissions
                    onQuickFilter(state.filters.copy(transmissions = if (selected) state.filters.transmissions - "automatic" else state.filters.transmissions + "automatic"))
                },
            )
            FilterPill(
                label = "Sub 10.000 €",
                selected = state.filters.maxPrice == 10_000,
                onClick = { onQuickFilter(state.filters.copy(maxPrice = state.filters.maxPrice.takeUnless { it == 10_000 } ?: 10_000)) },
            )
            FilterPill(
                label = "Din 2018",
                selected = state.filters.minYear == 2018,
                onClick = { onQuickFilter(state.filters.copy(minYear = state.filters.minYear.takeUnless { it == 2018 } ?: 2018)) },
            )
            if (activeFilterCount > 0) {
                AssistChip(onClick = onResetFilters, label = { Text("Resetează") })
            }
        }
        locationMessage?.let { message ->
            Spacer(Modifier.height(8.dp))
            Text(message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(14.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("${state.listings.size} anunțuri", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(onClick = onOpenFilters, shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.Default.FilterList, contentDescription = null, modifier = Modifier.size(17.dp))
                        Text(if (activeFilterCount == 0) "Filtre" else "Filtre ($activeFilterCount)", style = MaterialTheme.typography.labelLarge)
                    }
                }
                Surface(onClick = onOpenSort, shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Sort, contentDescription = null, modifier = Modifier.size(18.dp))
                        Text(state.sort.label, style = MaterialTheme.typography.labelLarge, maxLines = 1)
                    }
                }
            }
        }
    }
}

@Composable
private fun FilterPill(label: String, selected: Boolean, onClick: () -> Unit) {
    AssistChip(
        onClick = onClick,
        label = { Text(label) },
        shape = RoundedCornerShape(14.dp),
        colors = androidx.compose.material3.AssistChipDefaults.assistChipColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
            labelColor = if (selected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
        ),
    )
}

private fun ListingSearchFilters.activeCount(): Int = listOf(
    makes.isNotEmpty(), models.isNotEmpty(), city != null,
    minPrice != null || maxPrice != null,
    minYear != null || maxYear != null,
    minMileage != null || maxMileage != null,
    fuelTypes.isNotEmpty(), transmissions.isNotEmpty(),
    latitude != null && longitude != null && radiusKm != null,
).count { it }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SortSheet(selected: ListingSort, onDismiss: () -> Unit, onSelected: (ListingSort) -> Unit) {
    androidx.compose.material3.ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
            Text("Sortează după", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            ListingSort.entries.forEach { option ->
                Surface(
                    onClick = { onSelected(option) },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                    shape = RoundedCornerShape(14.dp),
                    color = if (option == selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
                ) {
                    Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 15.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(option.label, modifier = Modifier.weight(1f), fontWeight = if (option == selected) FontWeight.Bold else FontWeight.Normal)
                        if (option == selected) Text("Selectat", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
fun CatalogContent(
    state: CatalogUiState,
    onRetry: () -> Unit,
    onLoadMore: () -> Unit,
    onListingSelected: (String) -> Unit,
    favoriteIds: Set<String> = emptySet(),
    onToggleFavorite: (Listing) -> Unit = {},
    onExploreFilters: () -> Unit,
) {
    when {
        state.isLoading -> LoadingState()
        state.error != null && state.listings.isEmpty() -> ErrorState(state.error, onRetry)
        state.listings.isEmpty() -> EmptyState(onRetry, onExploreFilters)
        else -> ListingFeed(state, onLoadMore, onListingSelected, favoriteIds, onToggleFavorite)
    }
}

@Composable
private fun ListingFeed(
    state: CatalogUiState,
    onLoadMore: () -> Unit,
    onListingSelected: (String) -> Unit,
    favoriteIds: Set<String>,
    onToggleFavorite: (Listing) -> Unit,
) {
    val listState = rememberLazyListState()
    LaunchedEffect(listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index, state.listings.size, state.hasMore) {
        val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
        if (state.hasMore && lastVisible >= state.listings.lastIndex - 3) onLoadMore()
    }
    LazyColumn(
        state = listState,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize(),
    ) {
        items(state.listings, key = { it.id }) { listing ->
            ListingCard(
                listing = listing,
                isFavorite = favoriteIds.contains(listing.id.toString()),
                onClick = { onListingSelected(listing.slug) },
                onToggleFavorite = { onToggleFavorite(listing) },
            )
        }
        if (state.isLoadingMore) {
            item { Row(Modifier.fillMaxWidth().padding(20.dp), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator() } }
        }
        if (state.error != null) {
            item { ErrorState(state.error, onLoadMore, compact = true) }
        }
    }
}

@Composable
private fun ListingCard(listing: Listing, isFavorite: Boolean, onClick: () -> Unit, onToggleFavorite: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).testTag("listing_${listing.id}"),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column {
            val mainImage = listing.mainImage
            if (mainImage?.url != null) {
                AsyncImage(
                    model = mainImage.url,
                    contentDescription = "Fotografie ${listing.title}",
                    modifier = Modifier.fillMaxWidth().height(208.dp).clip(MaterialTheme.shapes.medium),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Column(
                    modifier = Modifier.fillMaxWidth().height(120.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) { Text("Fără imagine") }
            }
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    Text(listing.title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    IconButton(onClick = onToggleFavorite, modifier = Modifier.size(40.dp)) {
                        Icon(
                            if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = if (isFavorite) "Elimină ${listing.title} din favorite" else "Salvează ${listing.title} la favorite",
                            tint = if (isFavorite) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Spacer(Modifier.width(4.dp))
                    Text(formatPrice(listing.price, listing.currency), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold)
                }
                Spacer(Modifier.height(8.dp))
                Text(listOfNotNull(listing.year?.toString(), listing.mileage?.let(::formatMileage), listing.fuelType?.label(), listing.transmission?.label()).joinToString(" • "), style = MaterialTheme.typography.bodyMedium)
                if (listing.locationLabel.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Text(listing.locationLabel, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
fun LoadingState() = Column(
    Modifier.fillMaxSize().testTag("catalog_loading"),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally,
) { CircularProgressIndicator(); Spacer(Modifier.height(12.dp)); Text("Se încarcă anunțurile…") }

@Composable
fun EmptyState(onRetry: () -> Unit, onExploreFilters: () -> Unit) = Column(
    Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 12.dp).testTag("catalog_empty"),
    verticalArrangement = Arrangement.Center,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(
                modifier = Modifier.size(58.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer,
            ) {
                Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.padding(16.dp), tint = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.height(18.dp))
            Text("Nu avem încă potriviri", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(8.dp))
            Text(
                "Încearcă să lărgești căutarea sau să alegi alte filtre.",
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            Button(onClick = onExploreFilters, modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(16.dp)) {
                Icon(Icons.Default.FilterList, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Alege alte filtre")
            }
            TextButton(onClick = onRetry) { Text("Reîncarcă rezultatele") }
        }
    }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit, compact: Boolean = false) = Column(
    Modifier.fillMaxWidth().then(if (!compact) Modifier.fillMaxSize() else Modifier).padding(24.dp).testTag("catalog_error"),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally,
) { Text("Nu am putut încărca datele", style = MaterialTheme.typography.titleMedium); Spacer(Modifier.height(8.dp)); Text(message, style = MaterialTheme.typography.bodySmall); Spacer(Modifier.height(12.dp)); FilledTonalButton(onClick = onRetry) { Icon(Icons.Default.Refresh, null); Spacer(Modifier.width(4.dp)); Text("Reîncearcă") } }

fun formatPrice(price: Double, currencyCode: String): String = runCatching {
    NumberFormat.getCurrencyInstance(Locale("ro", "RO")).apply { currency = Currency.getInstance(currencyCode) }.format(price)
}.getOrElse { "${price.toInt()} $currencyCode" }

fun formatMileage(mileage: Int): String = "${NumberFormat.getIntegerInstance(Locale("ro", "RO")).format(mileage)} km"

fun String.label(): String = when (lowercase()) {
    "petrol" -> "Benzină"
    "diesel" -> "Diesel"
    "hybrid" -> "Hibrid"
    "electric" -> "Electric"
    "lpg" -> "GPL"
    "cng" -> "GNC"
    "manual" -> "Manuală"
    "automatic" -> "Automată"
    "semi_automatic" -> "Semi-automată"
    "cvt" -> "CVT"
    else -> replaceFirstChar { it.uppercase() }
}
