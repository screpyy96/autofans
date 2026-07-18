package ro.autofans.app.ui

import androidx.compose.runtime.mutableStateListOf
import ro.autofans.app.data.Listing

object ComparisonStore {
    val listings = mutableStateListOf<Listing>()
    fun toggle(listing: Listing) {
        val existing = listings.indexOfFirst { it.id == listing.id }
        if (existing >= 0) listings.removeAt(existing) else if (listings.size < 3) listings.add(listing)
    }
}
