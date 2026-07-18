package ro.autofans.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import ro.autofans.app.data.Listing
import ro.autofans.app.data.ListingRepository
import ro.autofans.app.data.ListingSearchFilters
import ro.autofans.app.data.ListingSort

data class CatalogUiState(
    val listings: List<Listing> = emptyList(),
    val query: String = "",
    val filters: ListingSearchFilters = ListingSearchFilters(),
    val sort: ListingSort = ListingSort.RELEVANCE,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val hasMore: Boolean = false,
    val error: String? = null,
)

class CatalogViewModel(private val repository: ListingRepository) : ViewModel() {
    private val _state = MutableStateFlow(CatalogUiState())
    val state: StateFlow<CatalogUiState> = _state.asStateFlow()
    private var page = 1

    init {
        refresh()
    }

    fun updateQuery(query: String) {
        _state.value = _state.value.copy(query = query)
    }

    fun submitSearch() = refresh()

    fun applyFilters(filters: ListingSearchFilters) {
        _state.value = _state.value.copy(filters = filters)
        refresh()
    }

    fun resetFilters() = applyFilters(ListingSearchFilters())

    fun selectSort(sort: ListingSort) {
        _state.value = _state.value.copy(sort = sort)
        refresh()
    }

    fun applySavedSearch(query: String, filters: ListingSearchFilters) {
        _state.value = _state.value.copy(query = query, filters = filters)
        refresh()
    }

    fun refresh() {
        if (_state.value.isLoading) return
        page = 1
        fetch(firstPage = true)
    }

    fun loadNextPage() {
        val current = _state.value
        if (current.isLoading || current.isLoadingMore || !current.hasMore) return
        page += 1
        fetch(firstPage = false)
    }

    private fun fetch(firstPage: Boolean) = viewModelScope.launch {
        val current = _state.value
        _state.value = current.copy(
            isLoading = firstPage,
            isLoadingMore = !firstPage,
            error = null,
            listings = if (firstPage) emptyList() else current.listings,
        )
        runCatching {
            repository.search(
                query = _state.value.query,
                filters = _state.value.filters,
                sort = _state.value.sort,
                page = page,
                pageSize = PAGE_SIZE,
            )
        }.onSuccess { result ->
            _state.value = _state.value.copy(
                listings = if (firstPage) result.listings else _state.value.listings + result.listings,
                isLoading = false,
                isLoadingMore = false,
                hasMore = result.hasMore,
            )
        }.onFailure { error ->
            _state.value = _state.value.copy(
                isLoading = false,
                isLoadingMore = false,
                error = error.message ?: "Nu am putut încărca anunțurile.",
            )
        }
    }

    companion object { private const val PAGE_SIZE = 20 }
}

data class ListingDetailUiState(
    val listing: Listing? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
)

class ListingDetailViewModel(
    private val slug: String,
    private val repository: ListingRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(ListingDetailUiState())
    val state: StateFlow<ListingDetailUiState> = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.value = _state.value.copy(isLoading = true, error = null)
        runCatching { repository.listing(slug) }
            .onSuccess { listing ->
                _state.value = ListingDetailUiState(
                    listing = listing,
                    isLoading = false,
                    error = if (listing == null) "Anunțul nu mai este disponibil." else null,
                )
            }
            .onFailure { error ->
                _state.value = ListingDetailUiState(isLoading = false, error = error.message ?: "Nu am putut încărca anunțul.")
            }
    }
}

class CatalogViewModelFactory(private val repository: ListingRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = CatalogViewModel(repository) as T
}

class ListingDetailViewModelFactory(
    private val slug: String,
    private val repository: ListingRepository,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = ListingDetailViewModel(slug, repository) as T
}
