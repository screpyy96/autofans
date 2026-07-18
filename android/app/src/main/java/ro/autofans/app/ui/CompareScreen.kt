package ro.autofans.app.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompareRoute(onBack: () -> Unit, embedded: Boolean = false) {
    val listings = ComparisonStore.listings
    Scaffold(topBar={if (!embedded) TopAppBar(title={Text("Compară mașini")},navigationIcon={IconButton(onClick=onBack){Text("‹")}},actions={TextButton(onClick={ComparisonStore.listings.clear()}){Text("Golește")}})}){padding->
        if(listings.isEmpty())Column(Modifier.padding(padding).fillMaxSize(),verticalArrangement=Arrangement.Center,horizontalAlignment=androidx.compose.ui.Alignment.CenterHorizontally){Text("Adaugă până la 3 anunțuri din pagina de detaliu.")}
        else Row(Modifier.padding(padding).padding(16.dp).horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(12.dp)){
            listings.forEach { listing -> Card(Modifier.width(260.dp)){Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){Text(listing.title,style=MaterialTheme.typography.titleMedium);Text(formatPrice(listing.price,listing.currency),color=MaterialTheme.colorScheme.primary);CompareValue("An",listing.year?.toString());CompareValue("Km",listing.mileage?.let(::formatMileage));CompareValue("Combustibil",listing.fuelType?.label());CompareValue("Transmisie",listing.transmission?.label());CompareValue("Locație",listing.locationLabel);TextButton(onClick={ComparisonStore.toggle(listing)}){Text("Elimină")}}}
        }}
    }
}
@Composable private fun CompareValue(label:String,value:String?){if(!value.isNullOrBlank())Text("$label: $value")}
