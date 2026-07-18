package ro.autofans.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Scale
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import ro.autofans.app.data.Listing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompareRoute(onBack: () -> Unit, embedded: Boolean = false) {
    val listings = ComparisonStore.listings
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (!embedded) {
                androidx.compose.material3.TopAppBar(
                    title = { Text("Compară mașini", fontWeight = FontWeight.Bold) },
                    navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Înapoi") } },
                    actions = { if (listings.isNotEmpty()) TextButton(onClick = { listings.clear() }) { Text("Golește") } },
                )
            }
        },
    ) { padding ->
        if (listings.isEmpty()) {
            ComparisonEmptyState(Modifier.padding(padding).fillMaxSize())
        } else {
            Column(
                modifier = Modifier.padding(padding).fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(start = 20.dp, end = 12.dp, top = 18.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Analiză rapidă", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
                        Text("${listings.size} din 3 anunțuri selectate", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                    }
                    TextButton(onClick = { listings.clear() }) { Text("Golește") }
                }
                ComparisonTip(Modifier.padding(horizontal = 20.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().weight(1f).horizontalScroll(rememberScrollState()).padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    listings.forEach { listing -> ComparisonListingCard(listing) }
                    if (listings.size < 3) ComparisonAddCard()
                }
            }
        }
    }
}

@Composable
private fun ComparisonEmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, modifier = Modifier.size(78.dp)) {
            Icon(Icons.Default.Scale, null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.padding(21.dp))
        }
        Spacer(Modifier.height(22.dp))
        Text("Compară înainte să alegi", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
        Spacer(Modifier.height(8.dp))
        Text(
            "Deschide un anunț și apasă „Compară”. Poți pune față în față până la trei mașini.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(24.dp))
        Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Scale, null, tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(12.dp))
                Text("Preț, kilometraj, an, combustibil și locație — toate la vedere.", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun ComparisonTip(modifier: Modifier = Modifier) {
    Surface(modifier = modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.secondaryContainer) {
        Text(
            "Derulează lateral pentru a vedea fiecare mașină. Valorile sunt aliniate la fel, ca să le poți compara dintr-o privire.",
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 13.dp),
            color = MaterialTheme.colorScheme.onSecondaryContainer,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun ComparisonListingCard(listing: Listing) {
    ElevatedCard(
        modifier = Modifier.width(276.dp).padding(bottom = 24.dp),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 3.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column {
            Box(modifier = Modifier.fillMaxWidth().height(148.dp).background(Brush.linearGradient(listOf(MaterialTheme.colorScheme.secondary, Color(0xFF193D72))))) {
                listing.mainImage?.url?.let { imageUrl ->
                    AsyncImage(model = imageUrl, contentDescription = listing.title, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x66000000)))))
                }
                Surface(
                    onClick = { ComparisonStore.toggle(listing) },
                    modifier = Modifier.align(Alignment.TopEnd).padding(10.dp).size(34.dp),
                    shape = CircleShape,
                    color = Color.White.copy(alpha = .94f),
                ) { Icon(Icons.Default.Close, "Elimină din comparație", modifier = Modifier.padding(8.dp), tint = MaterialTheme.colorScheme.onSurface) }
                Text(
                    listing.make.uppercase().ifBlank { "AUTOFANS" },
                    modifier = Modifier.align(Alignment.BottomStart).padding(13.dp),
                    color = Color.White,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.ExtraBold,
                )
            }
            Column(Modifier.padding(17.dp), verticalArrangement = Arrangement.spacedBy(13.dp)) {
                Text(listing.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(formatPrice(listing.price, listing.currency), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold)
                ComparisonValue("An fabricație", listing.year?.toString())
                ComparisonValue("Kilometraj", listing.mileage?.let(::formatMileage))
                ComparisonValue("Combustibil", listing.fuelType?.label())
                ComparisonValue("Transmisie", listing.transmission?.label())
                ComparisonValue("Locație", listing.locationLabel)
            }
        }
    }
}

@Composable
private fun ComparisonAddCard() {
    Card(
        modifier = Modifier.width(176.dp).padding(bottom = 24.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Default.Scale, null, modifier = Modifier.padding(13.dp), tint = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.height(12.dp))
            Text("Mai adaugă o mașină", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(6.dp))
            Text("Din pagina unui anunț", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun ComparisonValue(label: String, value: String?) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        Text(value?.takeIf(String::isNotBlank) ?: "—", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
    }
}
