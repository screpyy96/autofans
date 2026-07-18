package ro.autofans.app.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import ro.autofans.app.ui.theme.AutoFansTheme
import ro.autofans.app.data.Listing
import ro.autofans.app.data.ListingSearchFilters
import ro.autofans.app.data.ListingSort

@RunWith(AndroidJUnit4::class)
class CatalogScreenTest {
    @get:Rule val composeRule = createComposeRule()

    @Test
    fun empty_catalog_is_explained_to_the_user() {
        composeRule.setContent {
            AutoFansTheme {
                CatalogContent(CatalogUiState(isLoading = false), {}, {}, {})
            }
        }

        composeRule.onNodeWithTag("catalog_empty").assertIsDisplayed()
    }

    @Test
    fun catalog_error_has_a_visible_retry_state() {
        composeRule.setContent {
            AutoFansTheme {
                CatalogContent(CatalogUiState(isLoading = false, error = "Conexiune indisponibilă"), {}, {}, {})
            }
        }

        composeRule.onNodeWithTag("catalog_error").assertIsDisplayed()
    }

    @Test
    fun search_updates_query_and_submits() {
        var state by mutableStateOf(CatalogUiState())
        var submitted = 0
        composeRule.setContent {
            AutoFansTheme {
                CatalogScreen(
                    state = state,
                    onQueryChange = { state = state.copy(query = it) },
                    onSearch = { submitted += 1 },
                    onFiltersApplied = {}, onFiltersReset = {}, onSortSelected = {}, onRetry = {}, onLoadMore = {},
                    onListingSelected = {}, onAccount = {},
                )
            }
        }

        composeRule.onNodeWithTag("catalog_search").performTextInput("BMW")
        composeRule.onNodeWithContentDescription("Caută").performClick()

        assert(state.query == "BMW")
        assert(submitted == 1)
    }

    @Test
    fun filter_apply_and_reset_are_exposed() {
        var applied: ListingSearchFilters? = null
        var resets = 0
        composeRule.setContent {
            AutoFansTheme {
                CatalogScreen(
                    state = CatalogUiState(filters = ListingSearchFilters(city = "Cluj")),
                    onQueryChange = {}, onSearch = {}, onFiltersApplied = { applied = it },
                    onFiltersReset = { resets += 1 }, onSortSelected = {}, onRetry = {}, onLoadMore = {},
                    onListingSelected = {}, onAccount = {},
                )
            }
        }

        composeRule.onNodeWithText("Resetează filtrele").performClick()
        composeRule.onNodeWithText("Filtre").performClick()
        composeRule.onNodeWithTag("filter_sheet").assertIsDisplayed()
        composeRule.onNodeWithText("Aplică").performClick()

        assert(resets == 1)
        assert(applied == ListingSearchFilters(city = "Cluj"))
    }

    @Test
    fun listing_card_opens_its_detail() {
        var selected: String? = null
        composeRule.setContent {
            AutoFansTheme {
                CatalogContent(
                    CatalogUiState(listings = listOf(sampleListing())),
                    onRetry = {}, onLoadMore = {}, onListingSelected = { selected = it },
                )
            }
        }

        composeRule.onNodeWithTag("listing_1").performClick()

        assert(selected == "bmw-320d")
    }

    private fun sampleListing() = Listing(
        id = 1, ownerId = "seller", slug = "bmw-320d", title = "BMW 320d", description = "Descriere",
        price = 18_500.0, currency = "EUR", make = "BMW", model = "320d", year = 2019, mileage = 120_000,
        fuelType = "diesel", transmission = "automatic", bodyType = null, city = "Cluj-Napoca", county = "Cluj",
        images = emptyList(), createdAt = null, power = null, engineSize = null, doors = null, seats = null, features = emptyList(),
    )
}
