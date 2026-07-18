package ro.autofans.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull

@Serializable
data class ListingImageDto(
    val path: String? = null,
    @SerialName("isMain") val isMain: Boolean? = null,
)

@Serializable
data class ListingDto(
    val id: Long,
    @SerialName("owner_id") val ownerId: String? = null,
    val slug: String,
    val title: String,
    val description: String? = null,
    val price: Double,
    val currency: String = "EUR",
    val make: String,
    val model: String,
    val year: Int? = null,
    val mileage: Int? = null,
    @SerialName("fuel_type") val fuelType: String? = null,
    val transmission: String? = null,
    @SerialName("body_type") val bodyType: String? = null,
    val city: String? = null,
    val county: String? = null,
    val images: List<ListingImageDto> = emptyList(),
    @SerialName("created_at") val createdAt: String? = null,
    val power: Int? = null,
    @SerialName("engine_size") val engineSize: Double? = null,
    val doors: Int? = null,
    val seats: Int? = null,
    val features: List<String> = emptyList(),
)

data class ListingImage(val path: String, val isMain: Boolean, val url: String? = null)

data class Listing(
    val id: Long,
    val ownerId: String?,
    val slug: String,
    val title: String,
    val description: String,
    val price: Double,
    val currency: String,
    val make: String,
    val model: String,
    val year: Int?,
    val mileage: Int?,
    val fuelType: String?,
    val transmission: String?,
    val bodyType: String?,
    val city: String?,
    val county: String?,
    val images: List<ListingImage>,
    val createdAt: String?,
    val power: Int?,
    val engineSize: Double?,
    val doors: Int?,
    val seats: Int?,
    val features: List<String>,
) {
    val mainImage: ListingImage? get() = images.firstOrNull { it.isMain } ?: images.firstOrNull()
    val locationLabel: String get() = listOfNotNull(city, county).joinToString(", ")
}

fun ListingDto.toListing(signedUrls: Map<String, String> = emptyMap()): Listing = Listing(
    id = id,
    ownerId = ownerId,
    slug = slug,
    title = title,
    description = description.orEmpty(),
    price = price,
    currency = currency,
    make = make,
    model = model,
    year = year,
    mileage = mileage,
    fuelType = fuelType,
    transmission = transmission,
    bodyType = bodyType,
    city = city,
    county = county,
    images = images.mapNotNull { image ->
        image.path?.takeIf(String::isNotBlank)?.let { path -> ListingImage(path, image.isMain == true, signedUrls[path]) }
    },
    createdAt = createdAt,
    power = power,
    engineSize = engineSize,
    doors = doors,
    seats = seats,
    features = features,
)

enum class ListingSort(val rpcValue: String, val label: String) {
    RELEVANCE("relevance", "Relevanță"),
    PRICE_ASC("price_asc", "Preț crescător"),
    PRICE_DESC("price_desc", "Preț descrescător"),
    YEAR_DESC("year_desc", "An mai nou"),
    MILEAGE_ASC("mileage_asc", "Kilometraj mic"),
    DATE_DESC("date_desc", "Cele mai recente"),
}

data class ListingSearchFilters(
    val makes: List<String> = emptyList(),
    val models: List<String> = emptyList(),
    val minPrice: Int? = null,
    val maxPrice: Int? = null,
    val minYear: Int? = null,
    val maxYear: Int? = null,
    val minMileage: Int? = null,
    val maxMileage: Int? = null,
    val fuelTypes: List<String> = emptyList(),
    val transmissions: List<String> = emptyList(),
    val city: String? = null,
) {
    fun toRpcPayload(query: String, sort: ListingSort): JsonObject = buildJsonObject {
        put("p_query", query.trim().takeIf(String::isNotBlank)?.let(::JsonPrimitive) ?: JsonNull)
        putArrayOrNull("p_brands", makes)
        putArrayOrNull("p_models", models)
        put("p_price_min", minPrice?.let(::JsonPrimitive) ?: JsonNull)
        put("p_price_max", maxPrice?.let(::JsonPrimitive) ?: JsonNull)
        put("p_year_min", minYear?.let(::JsonPrimitive) ?: JsonNull)
        put("p_year_max", maxYear?.let(::JsonPrimitive) ?: JsonNull)
        put("p_mileage_min", minMileage?.let(::JsonPrimitive) ?: JsonNull)
        put("p_mileage_max", maxMileage?.let(::JsonPrimitive) ?: JsonNull)
        putArrayOrNull("p_fuel_types", fuelTypes)
        putArrayOrNull("p_transmissions", transmissions)
        put("p_city", city?.trim()?.takeIf(String::isNotBlank)?.let(::JsonPrimitive) ?: JsonNull)
        put("p_county", JsonNull)
        put("p_latitude", JsonNull)
        put("p_longitude", JsonNull)
        put("p_radius_km", JsonNull)
        put("p_service_history", JsonNull)
        put("p_max_owners", JsonNull)
        put("p_sort", sort.rpcValue)
    }

    /**
     * Shape consumed by the existing website alert dispatcher. Keeping this
     * separate from the RPC parameters lets Android and a future iOS client
     * save searches that receive the same email/inbox alerts as web searches.
     */
    fun toSavedSearchQuery(query: String): JsonObject = buildJsonObject {
        query.trim().takeIf(String::isNotBlank)?.let { put("query", it) }
        if (makes.isNotEmpty()) putJsonArray("brand") { makes.forEach { add(JsonPrimitive(it)) } }
        if (models.isNotEmpty()) putJsonArray("model") { models.forEach { add(JsonPrimitive(it)) } }
        range("priceRange", minPrice, maxPrice, 0, Int.MAX_VALUE)
        range("yearRange", minYear, maxYear, 0, Int.MAX_VALUE)
        range("mileageRange", minMileage, maxMileage, 0, Int.MAX_VALUE)
        if (fuelTypes.isNotEmpty()) putJsonArray("fuelType") { fuelTypes.forEach { add(JsonPrimitive(it)) } }
        if (transmissions.isNotEmpty()) putJsonArray("transmission") { transmissions.forEach { add(JsonPrimitive(it)) } }
        city?.trim()?.takeIf(String::isNotBlank)?.let { value ->
            put("location", buildJsonObject {
                put("id", "mobile-city-${value.lowercase().replace(" ", "-")}")
                put("city", value)
                put("county", "")
                put("country", "România")
            })
        }
    }

    private fun JsonObjectBuilder.range(
        name: String,
        min: Int?,
        max: Int?,
        fallbackMin: Int,
        fallbackMax: Int,
    ) {
        if (min == null && max == null) return
        put(name, buildJsonObject {
            put("min", min ?: fallbackMin)
            put("max", max ?: fallbackMax)
        })
    }

    private fun JsonObjectBuilder.putArrayOrNull(name: String, values: List<String>) {
        if (values.isEmpty()) {
            put(name, JsonNull)
        } else {
            putJsonArray(name) { values.forEach { add(JsonPrimitive(it.trim())) } }
        }
    }

    companion object {
        /** Converts the JSON stored by website alerts back into Android's
         * catalog filters, allowing a saved search to be applied on either
         * client. */
        fun fromSavedSearchQuery(query: JsonObject): Pair<String, ListingSearchFilters> {
            fun values(key: String) = query[key]?.jsonArray?.mapNotNull { it.jsonPrimitive.contentOrNull } ?: emptyList()
            fun range(key: String, field: String) = query[key]?.jsonObject?.get(field)?.jsonPrimitive?.intOrNull
            val location = query["location"]?.jsonObject
            return (query["query"]?.jsonPrimitive?.contentOrNull.orEmpty()) to ListingSearchFilters(
                makes = values("brand"),
                models = values("model"),
                minPrice = range("priceRange", "min"), maxPrice = range("priceRange", "max"),
                minYear = range("yearRange", "min"), maxYear = range("yearRange", "max"),
                minMileage = range("mileageRange", "min"), maxMileage = range("mileageRange", "max"),
                fuelTypes = values("fuelType"), transmissions = values("transmission"),
                city = location?.get("city")?.jsonPrimitive?.contentOrNull,
            )
        }
    }
}
