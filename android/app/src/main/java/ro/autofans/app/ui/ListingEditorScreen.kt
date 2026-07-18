package ro.autofans.app.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlinx.serialization.json.*
import ro.autofans.app.data.MobileApi

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListingEditorRoute(api: MobileApi, onDone: () -> Unit, editingId: Long? = null) {
    val context = LocalContext.current; val scope = rememberCoroutineScope()
    var title by remember { mutableStateOf("") }; var description by remember { mutableStateOf("") }
    var make by remember { mutableStateOf("") }; var model by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("") }; var mileage by remember { mutableStateOf("") }; var price by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }; var county by remember { mutableStateOf("") }
    var fuel by remember { mutableStateOf("petrol") }; var transmission by remember { mutableStateOf("manual") }
    var vin by remember { mutableStateOf("") }; var bodyType by remember { mutableStateOf("") }
    var engineSize by remember { mutableStateOf("") }; var power by remember { mutableStateOf("") }
    var doors by remember { mutableStateOf("") }; var seats by remember { mutableStateOf("") }
    var owners by remember { mutableStateOf("") }; var features by remember { mutableStateOf("") }
    var serviceHistory by remember { mutableStateOf(false) }
    var images by remember { mutableStateOf<List<String>>(emptyList()) }; var status by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(editingId) { if (editingId != null) runCatching { api.call("seller_listing", buildJsonObject { put("id", editingId) })["listing"]?.jsonObject }.onSuccess { listing -> if (listing != null) {
        title=listing["title"]?.jsonPrimitive?.content.orEmpty(); description=listing["description"]?.jsonPrimitive?.content.orEmpty(); make=listing["make"]?.jsonPrimitive?.content.orEmpty(); model=listing["model"]?.jsonPrimitive?.content.orEmpty(); year=listing["year"]?.jsonPrimitive?.content.orEmpty(); mileage=listing["mileage"]?.jsonPrimitive?.content.orEmpty(); price=listing["price"]?.jsonPrimitive?.content.orEmpty(); city=listing["city"]?.jsonPrimitive?.content.orEmpty(); county=listing["county"]?.jsonPrimitive?.content.orEmpty(); fuel=listing["fuel_type"]?.jsonPrimitive?.content ?: fuel; transmission=listing["transmission"]?.jsonPrimitive?.content ?: transmission; vin=listing["vin"]?.jsonPrimitive?.content.orEmpty(); bodyType=listing["body_type"]?.jsonPrimitive?.content.orEmpty(); engineSize=listing["engine_size"]?.jsonPrimitive?.content.orEmpty(); power=listing["power"]?.jsonPrimitive?.content.orEmpty(); doors=listing["doors"]?.jsonPrimitive?.content.orEmpty(); seats=listing["seats"]?.jsonPrimitive?.content.orEmpty(); owners=listing["owners"]?.jsonPrimitive?.content.orEmpty(); serviceHistory=listing["service_history"]?.jsonPrimitive?.booleanOrNull ?: false; features=listing["features"]?.jsonArray?.joinToString(", ") { it.jsonPrimitive.content }.orEmpty(); images=listing["images"]?.jsonArray?.mapNotNull { it.jsonObject["path"]?.jsonPrimitive?.content }.orEmpty()
    }}.onFailure { status=it.message } }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris: List<Uri> ->
        scope.launch { runCatching { uris.take(15 - images.size).map { api.uploadListingImage(context, it) } }.onSuccess { images = images + it }.onFailure { status = it.message } }
    }
    fun save(targetStatus: String) = scope.launch {
        status = null
        val payload = buildJsonObject {
            editingId?.let { put("id",it) }
            put("status", targetStatus)
            put("title",title); put("description",description); put("make",make); put("model",model)
            put("year",year.toIntOrNull() ?: 0); put("mileage",mileage.toIntOrNull() ?: -1)
            put("price",price.toDoubleOrNull() ?: 0); put("city",city); put("county",county)
            put("fuel_type",fuel); put("transmission",transmission); put("currency","EUR")
            put("vin",vin); put("body_type",bodyType)
            engineSize.toDoubleOrNull()?.let { put("engine_size",it) }
            power.toIntOrNull()?.let { put("power",it) }; doors.toIntOrNull()?.let { put("doors",it) }; seats.toIntOrNull()?.let { put("seats",it) }
            owners.toIntOrNull()?.let { put("owners",it) }; put("service_history",serviceHistory)
            putJsonArray("features") { features.split(',').map(String::trim).filter(String::isNotBlank).forEach { add(it) } }
            putJsonArray("images") { images.forEach { add(buildJsonObject { put("path",it) }) } }
        }
        runCatching { api.call("save_listing", payload) }.onSuccess { onDone() }.onFailure { status=it.message }
    }
    Scaffold(topBar = { TopAppBar(title = { Text(if(editingId == null) "Anunț nou" else "Editează anunț") }) }) { padding ->
        Column(Modifier.padding(padding).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Titlu" to title, "Marcă" to make, "Model" to model, "An" to year, "Kilometraj" to mileage, "Preț" to price, "Oraș" to city, "Județ" to county).forEach { (label,value) ->
                OutlinedTextField(value, { next -> when(label) { "Titlu"->title=next; "Marcă"->make=next; "Model"->model=next; "An"->year=next; "Kilometraj"->mileage=next; "Preț"->price=next; "Oraș"->city=next; else->county=next } }, label={Text(label)}, modifier=Modifier.fillMaxWidth(), singleLine=true)
            }
            OutlinedTextField(description, { description=it }, label={Text("Descriere (minim 50 caractere)")}, modifier=Modifier.fillMaxWidth(), minLines=4)
            OutlinedTextField(vin, { vin=it.uppercase() }, label={Text("VIN (opțional)")}, modifier=Modifier.fillMaxWidth(), singleLine=true)
            Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(fuel, { fuel=it.lowercase() }, label={Text("Combustibil")}, modifier=Modifier.weight(1f), singleLine=true)
                OutlinedTextField(transmission, { transmission=it.lowercase() }, label={Text("Transmisie")}, modifier=Modifier.weight(1f), singleLine=true)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(bodyType, { bodyType=it }, label={Text("Caroserie")}, modifier=Modifier.weight(1f), singleLine=true)
                OutlinedTextField(engineSize, { engineSize=it }, label={Text("Motor (L)")}, modifier=Modifier.weight(1f), singleLine=true)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(power, { power=it }, label={Text("Putere CP")}, modifier=Modifier.weight(1f), singleLine=true)
                OutlinedTextField(owners, { owners=it }, label={Text("Proprietari")}, modifier=Modifier.weight(1f), singleLine=true)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(doors, { doors=it }, label={Text("Uși")}, modifier=Modifier.weight(1f), singleLine=true)
                OutlinedTextField(seats, { seats=it }, label={Text("Locuri")}, modifier=Modifier.weight(1f), singleLine=true)
            }
            OutlinedTextField(features, { features=it }, label={Text("Dotări, separate prin virgulă")}, modifier=Modifier.fillMaxWidth())
            Row(verticalAlignment=Alignment.CenterVertically) { Checkbox(checked=serviceHistory, onCheckedChange={serviceHistory=it}); Text("Istoric de service disponibil") }
            OutlinedButton(onClick={ picker.launch("image/*") }, modifier=Modifier.fillMaxWidth()) { Text("Adaugă fotografii (${images.size}/15)") }
            images.forEachIndexed { index, path ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceBetween, verticalAlignment=Alignment.CenterVertically) {
                    Text(if(index == 0) "Poză principală" else "Poză ${index + 1}", style=MaterialTheme.typography.bodySmall)
                    Row {
                        TextButton(enabled=index > 0, onClick={ images=images.toMutableList().also { list -> val item=list.removeAt(index);list.add(index-1,item) } }){Text("↑")}
                        TextButton(enabled=index < images.lastIndex, onClick={ images=images.toMutableList().also { list -> val item=list.removeAt(index);list.add(index+1,item) } }){Text("↓")}
                        TextButton(onClick={images=images.filterNot { it==path }}){Text("Elimină")}
                    }
                }
            }
            status?.let { Text(it, color=MaterialTheme.colorScheme.error) }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { save("draft") }, modifier = Modifier.weight(1f)) { Text("Salvează draft") }
                Button(onClick = { save("published") }, modifier = Modifier.weight(1f), enabled=images.isNotEmpty()) {
                    Text(if(editingId == null) "Publică" else "Salvează și publică")
                }
            }
        }
    }
}
