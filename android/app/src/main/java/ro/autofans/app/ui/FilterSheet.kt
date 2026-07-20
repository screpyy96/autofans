package ro.autofans.app.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
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

    fun currentFilters() = ListingSearchFilters(
        makes = splitValues(make),
        models = splitValues(model),
        city = city.trim().ifBlank { null },
        minPrice = minPrice.toIntOrNull(),
        maxPrice = maxPrice.toIntOrNull(),
        minYear = minYear.toIntOrNull(),
        maxYear = maxYear.toIntOrNull(),
        minMileage = minMileage.toIntOrNull(),
        maxMileage = maxMileage.toIntOrNull(),
        fuelTypes = fuels.toList(),
        transmissions = transmissions.toList(),
        latitude = initial.latitude.takeIf { proximityEnabled },
        longitude = initial.longitude.takeIf { proximityEnabled },
        radiusKm = radiusKm.takeIf { proximityEnabled },
    )

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier.fillMaxWidth().heightIn(max = 680.dp).testTag("filter_sheet"),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 12.dp, top = 4.dp, bottom = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Filtre", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Rafinează rezultatele în câteva secunde", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextButton(onClick = onReset) { Text("Resetează") }
            }
            Column(
                modifier = Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (initial.latitude != null && initial.longitude != null) {
                    FilterSection(title = "Locație", subtitle = "Arată anunțuri aproape de tine") {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(if (proximityEnabled) "Locația ta este activă" else "Locația ta este oprită", modifier = Modifier.weight(1f))
                            AssistChip(onClick = { proximityEnabled = !proximityEnabled }, label = { Text(if (proximityEnabled) "Activă" else "Activează") })
                        }
                        if (proximityEnabled) {
                            Spacer(Modifier.height(10.dp))
                            Text("Rază", style = MaterialTheme.typography.labelLarge)
                            Spacer(Modifier.height(6.dp))
                            ChipSelector(options = listOf(10, 25, 50, 100), selected = radiusKm, label = { "$it km" }) { radiusKm = it }
                        }
                    }
                }
                FilterSection(title = "Mașina", subtitle = "Alege ce te interesează") {
                    FilterInput("Marcă", make, "ex. BMW, Audi") { make = it }
                    Spacer(Modifier.height(8.dp))
                    FilterInput("Model", model, "ex. Seria 3") { model = it }
                    Spacer(Modifier.height(8.dp))
                    FilterInput("Oraș", city, "Oriunde") { city = it }
                }
                FilterSection(title = "Buget și vechime") {
                    NumberRow("Preț minim", minPrice, { minPrice = it }, "Preț maxim", maxPrice, { maxPrice = it })
                    Spacer(Modifier.height(8.dp))
                    NumberRow("An minim", minYear, { minYear = it }, "An maxim", maxYear, { maxYear = it })
                    Spacer(Modifier.height(8.dp))
                    NumberRow("Km minim", minMileage, { minMileage = it }, "Km maxim", maxMileage, { maxMileage = it })
                }
                FilterSection(title = "Preferințe") {
                    Text("Combustibil", style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(6.dp))
                    ChoiceChips(listOf("petrol" to "Benzină", "diesel" to "Diesel", "hybrid" to "Hibrid", "electric" to "Electric"), fuels) { fuels = it }
                    Spacer(Modifier.height(12.dp))
                    Text("Transmisie", style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(6.dp))
                    ChoiceChips(listOf("manual" to "Manuală", "automatic" to "Automată", "cvt" to "CVT"), transmissions) { transmissions = it }
                }
                Spacer(Modifier.height(8.dp))
            }
            Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    TextButton(onClick = onDismiss) { Text("Anulează") }
                    Button(
                        onClick = { onApply(currentFilters()) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(vertical = 14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    ) { Text("Vezi anunțurile") }
                }
            }
        }
    }
}

@Composable
private fun FilterSection(title: String, subtitle: String? = null, content: @Composable ColumnScope.() -> Unit) {
    Surface(shape = RoundedCornerShape(20.dp), color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)) {
        Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            subtitle?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            Spacer(Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
private fun FilterInput(label: String, value: String, hint: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(hint) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = MaterialTheme.colorScheme.surface),
    )
}

@Composable
private fun NumberRow(firstLabel: String, first: String, onFirst: (String) -> Unit, secondLabel: String, second: String, onSecond: (String) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        NumberInput(firstLabel, first, onFirst, Modifier.weight(1f))
        NumberInput(secondLabel, second, onSecond, Modifier.weight(1f))
    }
}

@Composable
private fun NumberInput(label: String, value: String, onValueChange: (String) -> Unit, modifier: Modifier) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        singleLine = true,
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = MaterialTheme.colorScheme.surface),
    )
}

@Composable
private fun ChipSelector(options: List<Int>, selected: Int, label: (Int) -> String, onSelected: (Int) -> Unit) {
    Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        options.forEach { value ->
            FilterChip(selected = selected == value, onClick = { onSelected(value) }, label = { Text(label(value)) })
        }
    }
}

@Composable
private fun ChoiceChips(options: List<Pair<String, String>>, selected: Set<String>, onSelected: (Set<String>) -> Unit) {
    Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
