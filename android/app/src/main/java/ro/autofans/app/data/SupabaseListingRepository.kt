package ro.autofans.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

data class SupabaseConfig(val url: String, val anonKey: String) {
    val isConfigured: Boolean get() = url.startsWith("https://") && anonKey.isNotBlank()
}

data class ListingPage(val listings: List<Listing>, val total: Int, val hasMore: Boolean)

interface ListingRepository {
    suspend fun search(
        query: String,
        filters: ListingSearchFilters,
        sort: ListingSort,
        page: Int,
        pageSize: Int,
    ): ListingPage

    suspend fun listing(slug: String): Listing?
}

class SupabaseListingRepository(
    private val config: SupabaseConfig,
    private val client: OkHttpClient = OkHttpClient(),
    private val json: Json = Json { ignoreUnknownKeys = true; explicitNulls = false },
) : ListingRepository {
    override suspend fun search(
        query: String,
        filters: ListingSearchFilters,
        sort: ListingSort,
        page: Int,
        pageSize: Int,
    ): ListingPage = withContext(Dispatchers.IO) {
        requireConfigured()
        val payload = json.encodeToString(filters.toRpcPayload(query, sort))
        val offset = (page - 1) * pageSize
        val url = "${config.url.trimEnd('/')}/rest/v1/rpc/search_published_listings"
            .toHttpUrl()
            .newBuilder()
            .addQueryParameter("select", LISTING_COLUMNS)
            .addQueryParameter("offset", offset.toString())
            .addQueryParameter("limit", pageSize.toString())
            .build()
        val response = execute(
            Request.Builder()
                .url(url)
                .header("apikey", config.anonKey)
                .header("Authorization", "Bearer ${config.anonKey}")
                .header("Prefer", "count=exact")
                .post(payload.toRequestBody(JSON_MEDIA_TYPE))
                .build(),
        )
        val dtos = json.decodeFromString<List<ListingDto>>(response.body)
        val signedUrls = signedUrls(dtos.flatMap { it.images.mapNotNull(ListingImageDto::path) })
        val total = response.header("Content-Range")
            ?.substringAfter('/')
            ?.toIntOrNull()
            ?: dtos.size
        ListingPage(
            listings = dtos.map { it.toListing(signedUrls) },
            total = total,
            hasMore = offset + dtos.size < total,
        )
    }

    override suspend fun listing(slug: String): Listing? = withContext(Dispatchers.IO) {
        requireConfigured()
        val url = "${config.url.trimEnd('/')}/rest/v1/listings"
            .toHttpUrl()
            .newBuilder()
            .addQueryParameter("select", LISTING_COLUMNS)
            .addQueryParameter("slug", "eq.$slug")
            .addQueryParameter("status", "eq.published")
            .addQueryParameter("limit", "1")
            .build()
        val response = execute(
            Request.Builder()
                .url(url)
                .header("apikey", config.anonKey)
                .header("Authorization", "Bearer ${config.anonKey}")
                .get()
                .build(),
        )
        val dto = json.decodeFromString<List<ListingDto>>(response.body).firstOrNull() ?: return@withContext null
        dto.toListing(signedUrls(dto.images.mapNotNull(ListingImageDto::path)))
    }

    private fun requireConfigured() {
        check(config.isConfigured) {
            "Lipsește configurația Supabase. Adaugă SUPABASE_URL și SUPABASE_ANON_KEY în android/local.properties."
        }
    }

    private fun execute(request: Request): HttpResponse = client.newCall(request).execute().use { response ->
        val body = response.body?.string().orEmpty()
        if (!response.isSuccessful) throw SupabaseException(response.code, body.ifBlank { response.message })
        HttpResponse(body, response.headers.toMultimap().mapValues { it.value.firstOrNull().orEmpty() })
    }

    private fun signedUrls(paths: List<String>): Map<String, String> {
        val distinctPaths = paths.filter(String::isNotBlank).distinct()
        if (distinctPaths.isEmpty()) return emptyMap()
        val requestJson = json.encodeToString(SignRequest(distinctPaths, 3_600))
        val response = execute(
            Request.Builder()
                .url("${config.url.trimEnd('/')}/storage/v1/object/sign/listing-images")
                .header("apikey", config.anonKey)
                .header("Authorization", "Bearer ${config.anonKey}")
                .post(requestJson.toRequestBody(JSON_MEDIA_TYPE))
                .build(),
        )
        return json.decodeFromString<List<SignedUrlDto>>(response.body).mapNotNull { signed ->
            val path = signed.path ?: signed.name ?: return@mapNotNull null
            val signedPath = signed.signedUrl ?: return@mapNotNull null
            val fullUrl = if (signedPath.startsWith("http")) signedPath else "${config.url.trimEnd('/')}/storage/v1$signedPath"
            path to fullUrl
        }.toMap()
    }

    private data class HttpResponse(val body: String, private val headers: Map<String, String>) {
        fun header(name: String): String? = headers.entries.firstOrNull { it.key.equals(name, ignoreCase = true) }?.value
    }

    @Serializable
    private data class SignRequest(val paths: List<String>, @SerialName("expiresIn") val expiresIn: Int)

    @Serializable
    private data class SignedUrlDto(
        val name: String? = null,
        val path: String? = null,
        @SerialName("signedURL") val signedUrl: String? = null,
    )

    companion object {
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
        private const val LISTING_COLUMNS = "id,owner_id,slug,title,description,price,currency,make,model,year,mileage,fuel_type,transmission,body_type,city,county,images,created_at,power,engine_size,doors,seats,features"
    }
}

class SupabaseException(val statusCode: Int, message: String) : IOException(message)
