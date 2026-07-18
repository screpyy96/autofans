package ro.autofans.app.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ListingModelsTest {
    @Test
    fun `rpc payload serializes selected essential filters`() {
        val filters = ListingSearchFilters(
            makes = listOf("BMW"),
            minPrice = 10_000,
            maxYear = 2023,
            fuelTypes = listOf("diesel"),
            city = "Cluj-Napoca",
        )

        val payload = filters.toRpcPayload("  320d  ", ListingSort.PRICE_ASC)

        assertEquals("320d", payload["p_query"]?.toString()?.trim('"'))
        assertEquals("[\"BMW\"]", payload["p_brands"].toString())
        assertEquals("10000", payload["p_price_min"].toString())
        assertEquals("\"price_asc\"", payload["p_sort"].toString())
        assertNull(payload["p_models"]?.let { if (it.toString() == "null") null else it })
    }

    @Test
    fun `mapper skips incomplete images and uses main image`() {
        val listing = ListingDto(
            id = 7,
            slug = "bmw-320d",
            title = "BMW 320d",
            price = 18_500.0,
            make = "BMW",
            model = "320d",
            images = listOf(ListingImageDto(), ListingImageDto(path = "7/cover.jpg", isMain = true)),
        ).toListing(mapOf("7/cover.jpg" to "https://images.example/cover.jpg"))

        assertEquals(1, listing.images.size)
        assertEquals("https://images.example/cover.jpg", listing.mainImage?.url)
        assertEquals("BMW 320d", listing.title)
    }

    @Test
    fun `saved search uses website alert contract`() {
        val query = ListingSearchFilters(
            makes = listOf("BMW"),
            minPrice = 15_000,
            fuelTypes = listOf("diesel"),
            city = "Cluj-Napoca",
        ).toSavedSearchQuery("  320d  ")

        assertEquals("320d", query["query"]?.toString()?.trim('"'))
        assertEquals("[\"BMW\"]", query["brand"].toString())
        assertEquals("15000", query["priceRange"]?.jsonObject?.get("min").toString())
        assertEquals("2147483647", query["priceRange"]?.jsonObject?.get("max").toString())
        assertEquals("Cluj-Napoca", query["location"]?.jsonObject?.get("city")?.toString()?.trim('"'))
    }

    @Test
    fun `saved website search restores Android catalog filters`() {
        val saved = Json.parseToJsonElement(
            """{"query":"320d","brand":["BMW"],"priceRange":{"min":15000,"max":30000},"fuelType":["diesel"],"location":{"city":"Cluj-Napoca"}}""",
        ).jsonObject

        val (query, filters) = ListingSearchFilters.fromSavedSearchQuery(saved)

        assertEquals("320d", query)
        assertEquals(listOf("BMW"), filters.makes)
        assertEquals(15_000, filters.minPrice)
        assertEquals(30_000, filters.maxPrice)
        assertEquals(listOf("diesel"), filters.fuelTypes)
        assertEquals("Cluj-Napoca", filters.city)
    }
}
