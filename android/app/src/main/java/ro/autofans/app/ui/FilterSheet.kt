package ro.autofans.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import ro.autofans.app.data.ListingSearchFilters

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterSheet(
    initial: ListingSearchFilters,
    onDismiss: () -> Unit,
    onApply: (ListingSearchFilters) -> Unit,
    onReset: () -> Unit,
) {
    var make by remember(initial) { mutableStateOf(initial.makes.joinToString(", ")) }
    var model by remember(initial) { mutableStateOf(initial.models.joinToString(", ")) }
    var city by remember(initial) { mutableStateOf(initial.city.orEmpty()) }
    var minPrice by remember(initial) { mutableStateOf(initial.minPrice?.toString().orEmpty()) }
    var maxPrice by remember(initial) { mutableStateOf(initial.maxPrice?.toString().orEmpty()) }
    var minYear by remember(initial) { mutableStateOf(initial.minYear?.toString().orEmpty()) }
    var maxYear by remember(initial) { mutableStateOf(initial.maxYear?.toString().orEmpty()) }
    var minMileage by remember(initial) { mutableStateOf(initial.minMileage?.toString().orEmpty()) }
    var maxMileage by remember(initial) { mutableStateOf(initial.maxMileage?.toString().orEmpty()) }
    var fuels by remember(initial) { mutableStateOf(initial.fuelTypes.toSet()) }
    var transmissions by remember(initial) { mutableStateOf(initial.transmissions.toSet()) }
    var proximityEnabled by remember(initial) { mutableStateOf(initial.latitude != null && initial.longitude != null && initial.radiusKm != null) }
    var radiusKm by remember(initial) { mutableStateOf(initial.radiusKm ?: 25) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 8.dp).testTag("filter_sheet"),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Filtre", style = MaterialTheme.typography.headlineSmall)
            if (initial.latitude != null && initial.longitude != null) {
                Text("Caută în apropiere", style = MaterialTheme.typography.titleSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = proximityEnabled, onClick = { proximityEnabled = !proximityEnabled }, label = { Text(if (proximityEnabled) "Locația ta activă" else "Dezactivată") })
                    if (proximityEnabled) listOf(10, 25, 50, 100).forEach { radius ->
                        FilterChip(selected = radiusKm == radius, onClick = { radiusKm = radius }, label = { Text("$radius km") })
                    }
                }
            }
            FilterInput("Marcă", make) { make = it }
            FilterInput("Model", model) { model = it }
            FilterInput("Oraș", city) { city = it }
            NumberRow("Preț minim", minPrice, { minPrice = it }, "Preț maxim", maxPrice, { maxPrice = it })
            NumberRow("An minim", minYear, { minYear = it }, "An maxim", maxYear, { maxYear = it })
            NumberRow("Km minim", minMileage, { minMileage = it }, "Km maxim", maxMileage, { maxMileage = it })
            Text("Combustibil", style = MaterialTheme.typography.titleSmall)
            ChoiceChips(options = listOf("petrol" to "Benzină", "diesel" to "Diesel", "hybrid" to "Hibrid", "electric" to "Electric"), selected = fuels) { fuels = it }
            Text("Transmisie", style = MaterialTheme.typography.titleSmall)
            ChoiceChips(options = listOf("manual" to "Manuală", "automatic" to "Automată", "cvt" to "CVT"), selected = transmissions) { transmissions = it }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onReset) { Text("Resetează") }
                Spacer(Modifier.width(8.dp))
                Button(onClick = {
                    onApply(
                        ListingSearchFilters(
                            makes = splitValues(make), models = splitValues(model), city = city.trim().ifBlank { null },
                            minPrice = minPrice.toIntOrNull(), maxPrice = maxPrice.toIntOrNull(),
                            minYear = minYear.toIntOrNull(), maxYear = maxYear.toIntOrNull(),
                            minMileage = minMileage.toIntOrNull(), maxMileage = maxMileage.toIntOrNull(),
                            fuelTypes = fuels.toList(), transmissions = transmissions.toList(),
                            latitude = initial.latitude.takeIf { proximityEnabled },
                            longitude = initial.longitude.takeIf { proximityEnabled },
                            radiusKm = radiusKm.takeIf { proximityEnabled },
                        ),
                    )
                }) { Text("Aplică") }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun FilterInput(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onValueChange, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
}

@Composable
private fun NumberRow(firstLabel: String, first: String, onFirst: (String) -> Unit, secondLabel: String, second: String, onSecond: (String) -> Unit) {
    Row(Modifier.fillMaxWidth()) {
        OutlinedTextField(value = first, onValueChange = onFirst, label = { Text(firstLabel) }, modifier = Modifier.weight(1f), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true)
        Spacer(Modifier.width(8.dp))
        OutlinedTextField(value = second, onValueChange = onSecond, label = { Text(secondLabel) }, modifier = Modifier.weight(1f), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), singleLine = true)
    }
}

@Composable
private fun ChoiceChips(options: List<Pair<String, String>>, selected: Set<String>, onSelected: (Set<String>) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        options.forEach { (value, label) ->
            FilterChip(
                selected = value in selected,
                onClick = { onSelected(if (value in selected) selected - value else selected + value) },
                label = { Text(label) },
            )
        }
    }
}

private fun splitValues(value: String): List<String> = value.split(',').map(String::trim).filter(String::isNotBlank)
