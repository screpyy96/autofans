package ro.autofans.app.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import ro.autofans.app.data.MobileApi

private val editorSteps = listOf("Detalii", "Specificații", "Fotografii", "Publică")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListingEditorRoute(
    api: MobileApi,
    onDone: () -> Unit,
    editingId: Long? = null,
    onViewListing: (String) -> Unit,
    onSellerListings: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var step by remember { mutableStateOf(0) }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var make by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("") }
    var mileage by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var county by remember { mutableStateOf("") }
    var fuel by remember { mutableStateOf("petrol") }
    var transmission by remember { mutableStateOf("manual") }
    var vin by remember { mutableStateOf("") }
    var bodyType by remember { mutableStateOf("") }
    var engineSize by remember { mutableStateOf("") }
    var power by remember { mutableStateOf("") }
    var doors by remember { mutableStateOf("") }
    var seats by remember { mutableStateOf("") }
    var owners by remember { mutableStateOf("") }
    var features by remember { mutableStateOf("") }
    var serviceHistory by remember { mutableStateOf(false) }
    var images by remember { mutableStateOf<List<String>>(emptyList()) }
    var status by remember { mutableStateOf<String?>(null) }
    var saving by remember { mutableStateOf(false) }
    var publishedSlug by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(editingId) {
        if (editingId != null) {
            runCatching { api.call("seller_listing", buildJsonObject { put("id", editingId) })["listing"]?.jsonObject }
                .onSuccess { listing ->
                    if (listing != null) {
                        title = listing["title"]?.jsonPrimitive?.content.orEmpty()
                        description = listing["description"]?.jsonPrimitive?.content.orEmpty()
                        make = listing["make"]?.jsonPrimitive?.content.orEmpty()
                        model = listing["model"]?.jsonPrimitive?.content.orEmpty()
                        year = listing["year"]?.jsonPrimitive?.content.orEmpty()
                        mileage = listing["mileage"]?.jsonPrimitive?.content.orEmpty()
                        price = listing["price"]?.jsonPrimitive?.content.orEmpty()
                        city = listing["city"]?.jsonPrimitive?.content.orEmpty()
                        county = listing["county"]?.jsonPrimitive?.content.orEmpty()
                        fuel = listing["fuel_type"]?.jsonPrimitive?.content ?: fuel
                        transmission = listing["transmission"]?.jsonPrimitive?.content ?: transmission
                        vin = listing["vin"]?.jsonPrimitive?.content.orEmpty()
                        bodyType = listing["body_type"]?.jsonPrimitive?.content.orEmpty()
                        engineSize = listing["engine_size"]?.jsonPrimitive?.content.orEmpty()
                        power = listing["power"]?.jsonPrimitive?.content.orEmpty()
                        doors = listing["doors"]?.jsonPrimitive?.content.orEmpty()
                        seats = listing["seats"]?.jsonPrimitive?.content.orEmpty()
                        owners = listing["owners"]?.jsonPrimitive?.content.orEmpty()
                        serviceHistory = listing["service_history"]?.jsonPrimitive?.booleanOrNull ?: false
                        features = listing["features"]?.jsonArray?.joinToString(", ") { it.jsonPrimitive.content }.orEmpty()
                        images = listing["images"]?.jsonArray?.mapNotNull { it.jsonObject["path"]?.jsonPrimitive?.content }.orEmpty()
                    }
                }
                .onFailure { status = it.message ?: "Nu am putut încărca anunțul." }
        }
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris: List<Uri> ->
        if (uris.isEmpty()) return@rememberLauncherForActivityResult
        scope.launch {
            saving = true
            status = null
            runCatching { uris.take(15 - images.size).map { api.uploadListingImage(context, it) } }
                .onSuccess { images = images + it }
                .onFailure { status = it.message ?: "Nu am putut încărca fotografiile." }
            saving = false
        }
    }

    fun save(targetStatus: String) {
        saving = true
        status = null
        scope.launch {
            val payload = buildJsonObject {
                editingId?.let { put("id", it) }
                put("status", targetStatus)
                put("title", title.trim()); put("description", description.trim()); put("make", make.trim()); put("model", model.trim())
                put("year", year.toIntOrNull() ?: 0); put("mileage", mileage.toIntOrNull() ?: -1); put("price", price.toDoubleOrNull() ?: 0)
                put("city", city.trim()); put("county", county.trim()); put("fuel_type", fuel); put("transmission", transmission); put("currency", "EUR")
                put("vin", vin.trim()); put("body_type", bodyType.trim()); put("service_history", serviceHistory)
                engineSize.toDoubleOrNull()?.let { put("engine_size", it) }
                power.toIntOrNull()?.let { put("power", it) }; doors.toIntOrNull()?.let { put("doors", it) }; seats.toIntOrNull()?.let { put("seats", it) }
                owners.toIntOrNull()?.let { put("owners", it) }
                putJsonArray("features") { features.split(',').map(String::trim).filter(String::isNotBlank).forEach { add(JsonPrimitive(it)) } }
                putJsonArray("images") { images.forEach { path -> add(buildJsonObject { put("path", path) }) } }
            }
            runCatching { api.call("save_listing", payload) }
                .onSuccess { response ->
                    val slug = response["listing"]?.jsonObject?.get("slug")?.jsonPrimitive?.content
                    if (targetStatus == "published" && !slug.isNullOrBlank()) {
                        publishedSlug = slug
                        saving = false
                    } else {
                        onDone()
                    }
                }
                .onFailure { status = it.message ?: "Nu am putut salva anunțul."; saving = false }
        }
    }

    fun advance() {
        val issue = when (step) {
            0 -> when {
                title.trim().length < 8 -> "Adaugă un titlu de cel puțin 8 caractere."
                make.isBlank() || model.isBlank() -> "Completează marca și modelul."
                year.toIntOrNull() == null || price.toDoubleOrNull() == null -> "Completează anul și prețul."
                city.trim().length < 2 || county.trim().length < 2 -> "Completează orașul și județul."
                else -> null
            }
            2 -> if (description.trim().length < 50) "Descrierea trebuie să aibă cel puțin 50 de caractere." else null
            else -> null
        }
        if (issue != null) status = issue else { status = null; step += 1 }
    }

    publishedSlug?.let { slug ->
        PublicationSuccessScreen(
            onViewListing = { onViewListing(slug) },
            onSellerListings = onSellerListings,
        )
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (editingId == null) "Publică un anunț" else "Editează anunțul") },
                navigationIcon = { IconButton(onClick = onDone) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Înapoi") } },
            )
        },
        bottomBar = {
            Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (step > 0) {
                        OutlinedButton(onClick = { status = null; step -= 1 }, enabled = !saving, modifier = Modifier.weight(1f).height(50.dp)) { Text("Înapoi") }
                    }
                    if (step < editorSteps.lastIndex) {
                        Button(onClick = ::advance, enabled = !saving, modifier = Modifier.weight(if (step > 0) 1f else 2f).height(50.dp)) {
                            Text("Continuă")
                            Spacer(Modifier.width(6.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
                    } else {
                        OutlinedButton(onClick = { save("draft") }, enabled = !saving, modifier = Modifier.weight(1f).height(50.dp)) { Text("Salvează draft") }
                        Button(onClick = { save("published") }, enabled = !saving && images.isNotEmpty(), modifier = Modifier.weight(1f).height(50.dp)) {
                            if (saving) CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                            else Text("Publică")
                        }
                    }
                }
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            EditorProgress(step)
            when (step) {
                0 -> DetailsStep(title, { title = it }, make, { make = it }, model, { model = it }, year, { year = it }, mileage, { mileage = it }, price, { price = it }, city, { city = it }, county, { county = it })
                1 -> SpecificationStep(fuel, { fuel = it }, transmission, { transmission = it }, bodyType, { bodyType = it }, engineSize, { engineSize = it }, power, { power = it }, doors, { doors = it }, seats, { seats = it }, owners, { owners = it }, serviceHistory, { serviceHistory = it })
                2 -> PhotosStep(images, onPick = { picker.launch("image/*") }, onRemove = { path -> images = images.filterNot { it == path } }, description, { description = it }, vin, { vin = it.uppercase() }, features, { features = it }, uploading = saving)
                else -> PublishStep(title, make, model, year, mileage, price, city, county, images.size, description)
            }
            status?.let { EditorMessage(it) }
            Spacer(Modifier.height(4.dp))
        }
    }
}

@Composable
private fun EditorProgress(step: Int) {
    LinearProgressIndicator(progress = { (step + 1).toFloat() / editorSteps.size }, modifier = Modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.primary, trackColor = MaterialTheme.colorScheme.primaryContainer)
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        editorSteps.forEachIndexed { index, label ->
            Text(label, style = MaterialTheme.typography.labelSmall, fontWeight = if (index == step) FontWeight.Bold else FontWeight.Normal, color = if (index <= step) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun DetailsStep(title: String, onTitle: (String) -> Unit, make: String, onMake: (String) -> Unit, model: String, onModel: (String) -> Unit, year: String, onYear: (String) -> Unit, mileage: String, onMileage: (String) -> Unit, price: String, onPrice: (String) -> Unit, city: String, onCity: (String) -> Unit, county: String, onCounty: (String) -> Unit) {
    EditorHeading("Spune-ne despre mașină", "Începem cu informațiile pe care cumpărătorii le văd prima dată.")
    Field(title, onTitle, "Titlu anunț", Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(make, onMake, "Marcă", Modifier.weight(1f)); Field(model, onModel, "Model", Modifier.weight(1f)) }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(year, onYear, "An fabricație", Modifier.weight(1f)); Field(mileage, onMileage, "Kilometraj", Modifier.weight(1f)) }
    Field(price, onPrice, "Preț (EUR)", Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(city, onCity, "Oraș", Modifier.weight(1f)); Field(county, onCounty, "Județ", Modifier.weight(1f)) }
}

@Composable
private fun SpecificationStep(fuel: String, onFuel: (String) -> Unit, transmission: String, onTransmission: (String) -> Unit, bodyType: String, onBodyType: (String) -> Unit, engineSize: String, onEngineSize: (String) -> Unit, power: String, onPower: (String) -> Unit, doors: String, onDoors: (String) -> Unit, seats: String, onSeats: (String) -> Unit, owners: String, onOwners: (String) -> Unit, serviceHistory: Boolean, onServiceHistory: (Boolean) -> Unit) {
    EditorHeading("Specificații", "Detaliile complete cresc încrederea și fac anunțul mai ușor de găsit.")
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(fuel, onFuel, "Combustibil", Modifier.weight(1f)); Field(transmission, onTransmission, "Transmisie", Modifier.weight(1f)) }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(bodyType, onBodyType, "Caroserie", Modifier.weight(1f)); Field(engineSize, onEngineSize, "Motor (L)", Modifier.weight(1f)) }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(power, onPower, "Putere (CP)", Modifier.weight(1f)); Field(owners, onOwners, "Proprietari", Modifier.weight(1f)) }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) { Field(doors, onDoors, "Uși", Modifier.weight(1f)); Field(seats, onSeats, "Locuri", Modifier.weight(1f)) }
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .55f))) {
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = serviceHistory, onCheckedChange = onServiceHistory)
            Text("Istoric de service disponibil", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun PhotosStep(images: List<String>, onPick: () -> Unit, onRemove: (String) -> Unit, description: String, onDescription: (String) -> Unit, vin: String, onVin: (String) -> Unit, features: String, onFeatures: (String) -> Unit, uploading: Boolean) {
    EditorHeading("Fotografii și poveste", "Adaugă fotografii luminoase; prima devine fotografia principală.")
    OutlinedButton(onClick = onPick, enabled = !uploading && images.size < 15, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(15.dp)) {
        Icon(Icons.Default.AddPhotoAlternate, contentDescription = null)
        Spacer(Modifier.width(8.dp))
        Text(if (uploading) "Se încarcă…" else "Adaugă fotografii (${images.size}/15)")
    }
    if (images.isNotEmpty()) {
        Card(shape = RoundedCornerShape(16.dp)) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                images.forEachIndexed { index, path ->
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(if (index == 0) "Fotografie principală" else "Fotografia ${index + 1}", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                        TextButton(onClick = { onRemove(path) }) { Text("Elimină") }
                    }
                    if (index < images.lastIndex) HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = .15f))
                }
            }
        }
    }
    OutlinedTextField(value = description, onValueChange = onDescription, label = { Text("Descriere (minim 50 caractere)") }, modifier = Modifier.fillMaxWidth(), minLines = 5, shape = RoundedCornerShape(14.dp))
    Field(vin, onVin, "VIN (opțional)", Modifier.fillMaxWidth())
    OutlinedTextField(value = features, onValueChange = onFeatures, label = { Text("Dotări, separate prin virgulă") }, modifier = Modifier.fillMaxWidth(), minLines = 2, shape = RoundedCornerShape(14.dp))
}

@Composable
private fun PublishStep(title: String, make: String, model: String, year: String, mileage: String, price: String, city: String, county: String, imageCount: Int, description: String) {
    EditorHeading("Gata de publicare", "Verifică rezumatul înainte ca anunțul să devină vizibil.")
    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary)) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title.ifBlank { "Anunț fără titlu" }, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondary)
            Text("$make $model · $year", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .85f))
            Text("${price.ifBlank { "—" }} EUR · ${mileage.ifBlank { "—" }} km", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondary)
            Text("$city, $county · $imageCount fotografii", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .75f))
        }
    }
    Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(10.dp))
            Text(if (imageCount == 0) "Mai adaugă cel puțin o fotografie ca să poți publica." else "Anunțul poate fi publicat. Poți salva și un draft dacă mai vrei să lucrezi la el.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimaryContainer)
        }
    }
    if (description.trim().length < 50) EditorMessage("Descrierea are nevoie de minimum 50 de caractere pentru publicare.")
}

@Composable
private fun EditorHeading(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun Field(value: String, onValueChange: (String) -> Unit, label: String, modifier: Modifier) {
    OutlinedTextField(value = value, onValueChange = onValueChange, label = { Text(label) }, modifier = modifier, singleLine = true, shape = RoundedCornerShape(14.dp))
}

@Composable
private fun EditorMessage(message: String) {
    Surface(shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.errorContainer, modifier = Modifier.fillMaxWidth()) {
        Text(message, modifier = Modifier.padding(12.dp), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
    }
}

@Composable
private fun PublicationSuccessScreen(onViewListing: () -> Unit, onSellerListings: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .55f)) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(
                modifier = Modifier.size(88.dp),
                shape = RoundedCornerShape(30.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
            ) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.padding(22.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Spacer(Modifier.height(22.dp))
            Text("Anunț publicat!", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
            Spacer(Modifier.height(8.dp))
            Text(
                "Mașina ta este acum vizibilă pentru cumpărători. Poți verifica exact cum arată sau reveni la anunțurile tale.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(28.dp))
            Button(onClick = onViewListing, modifier = Modifier.fillMaxWidth().height(54.dp), shape = RoundedCornerShape(16.dp)) {
                Text("Vezi anunțul")
                Spacer(Modifier.width(8.dp))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
            }
            Spacer(Modifier.height(10.dp))
            OutlinedButton(onClick = onSellerListings, modifier = Modifier.fillMaxWidth().height(52.dp), shape = RoundedCornerShape(16.dp)) {
                Text("Anunțurile mele")
            }
        }
    }
}
