package ro.autofans.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.Whatshot
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import kotlinx.coroutines.launch
import ro.autofans.app.data.MobileApi

data class GarageVehicleItem(
    val id: String,
    val title: String,
    val slug: String,
    val make: String,
    val model: String,
    val year: Int,
    val engine: String,
    val powerHp: Int,
    val story: String,
    val imageUrl: String,
    val upvotesCount: Int,
    val isForSale: Boolean,
    val salePrice: Double?,
    val ownerName: String,
    val modifications: List<String>
)

@Composable
fun GarageScreen(
    mobileApi: MobileApi,
    onVehicleSelected: (String) -> Unit = {},
    onAddVehicle: () -> Unit = {}
) {
    var selectedFilter by remember { mutableStateOf("all") }
    var vehicles by remember { mutableStateOf<List<GarageVehicleItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    val fallbackVehicles = remember {
        listOf(
            GarageVehicleItem(
                id = "g-1",
                title = "BMW M3 E46 - Track Tool & OEM Plus",
                slug = "bmw-m3-e46-laguna-seca",
                make = "BMW",
                model = "M3 E46",
                year = 2003,
                engine = "3.2L S54 Inline-6",
                powerHp = 360,
                story = "Achiziționată în 2022 ca proiect de restaurare totală. Punte spate ranforsată Redish Motorsport, cuzineți de bielă noi și vanos Beisan Systems.",
                imageUrl = "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
                upvotesCount = 142,
                isForSale = true,
                salePrice = 38500.0,
                ownerName = "Alex M.",
                modifications = listOf("Admisie Carbon Karbonius CSL", "Suspensie KW V3 Clubsport", "Frâne AP Racing 6 pistoane")
            ),
            GarageVehicleItem(
                id = "g-2",
                title = "Porsche 911 GT3 RS (991.2) - Lizard Green",
                slug = "porsche-911-gt3-rs-lizard-green",
                make = "Porsche",
                model = "911 GT3 RS",
                year = 2019,
                engine = "4.0L Boxer-6 NA",
                powerHp = 520,
                story = "Configurație completă Manthey Racing package. Folosit exclusiv pe Nürburgring Nordschleife și circuitul MotorPark România.",
                imageUrl = "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
                upvotesCount = 218,
                isForSale = false,
                salePrice = null,
                ownerName = "Vlad R.",
                modifications = listOf("Manthey Racing Aero Package", "Jante Magneziu", "Evacuare Titan Akrapovič")
            ),
            GarageVehicleItem(
                id = "g-3",
                title = "Audi RS6 Avant C8 - Vorsteiner Carbon Edition",
                slug = "audi-rs6-avant-c8-vorsteiner",
                make = "Audi",
                model = "RS6 Avant C8",
                year = 2022,
                engine = "4.0L V8 Bi-Turbo Mild-Hybrid",
                powerHp = 750,
                story = "Soft Stage 2 complet de la ECU Performance + admisie Eventuri carbon și evacuare Milltek ne-rezonată.",
                imageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80",
                upvotesCount = 98,
                isForSale = true,
                salePrice = 119000.0,
                ownerName = "Mihai T.",
                modifications = listOf("Stage 2 ECU 750HP", "Admisie Eventuri Carbon", "Pachet Exterior Vorsteiner")
            )
        )
    }

    LaunchedEffect(Unit) {
        scope.launch {
            isLoading = true
            vehicles = fallbackVehicles
            isLoading = false
        }
    }

    val filteredVehicles = remember(vehicles, selectedFilter) {
        if (selectedFilter == "for_sale") {
            vehicles.filter { it.isForSale }
        } else {
            vehicles
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Section
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Whatshot,
                                contentDescription = null,
                                tint = Color(0xFFFFB800),
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = "Garajul Comunității 🏎️🔥",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Text(
                            text = "Proiectele auto ale pasionaților din România. Votează mașinile favorite și cumpără vehicule unice direct din garaj!",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = if (selectedFilter == "all") Color(0xFFFFB800) else MaterialTheme.colorScheme.surface,
                                modifier = Modifier.clickable { selectedFilter = "all" }
                            ) {
                                Text(
                                    text = "🔥 Toate (${vehicles.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (selectedFilter == "all") Color.Black else MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = if (selectedFilter == "for_sale") Color(0xFFFFB800) else MaterialTheme.colorScheme.surface,
                                modifier = Modifier.clickable { selectedFilter = "for_sale" }
                            ) {
                                Text(
                                    text = "🏷️ De Vânzare (${vehicles.count { it.isForSale }})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (selectedFilter == "for_sale") Color.Black else MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                )
                            }
                        }
                    }
                }
            }

            if (isLoading) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
            } else {
                items(filteredVehicles, key = { it.id }) { car ->
                    GarageVehicleCard(
                        car = car,
                        onClick = { onVehicleSelected(car.slug) }
                    )
                }
            }
        }
    }
}

@Composable
fun GarageVehicleCard(
    car: GarageVehicleItem,
    onClick: () -> Unit
) {
    var upvotes by remember { mutableIntStateOf(car.upvotesCount) }
    var hasUpvoted by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Image with Badges
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                AsyncImage(
                    model = car.imageUrl,
                    contentDescription = car.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // For Sale Badge
                if (car.isForSale) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFFFB800),
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                Icons.Default.LocalOffer,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = Color.Black
                            )
                            Text(
                                text = "DE VÂNZARE • ${car.salePrice?.toInt()} €",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.Black
                            )
                        }
                    }
                }

                // Upvote Badge
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.Black.copy(alpha = 0.75f),
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .clickable {
                            if (!hasUpvoted) {
                                upvotes += 1
                                hasUpvoted = true
                            } else {
                                upvotes -= 1
                                hasUpvoted = false
                            }
                        }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.Whatshot,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = if (hasUpvoted) Color(0xFFFF4D4D) else Color(0xFFFFB800)
                        )
                        Text(
                            text = "$upvotes Voturi",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }

            // Card Body
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = car.title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = "An ${car.year} • Motor ${car.engine} • ${car.powerHp} CP",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (car.modifications.isNotEmpty()) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 2.dp)
                    ) {
                        car.modifications.take(2).forEach { mod ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Text(
                                    text = mod,
                                    fontSize = 10.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                Text(
                    text = car.story,
                    fontSize = 12.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Proprietar: ${car.ownerName}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFFB800)
                    )

                    Text(
                        text = "Vezi Garajul →",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}
