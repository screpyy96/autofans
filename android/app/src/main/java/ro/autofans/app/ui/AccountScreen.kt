package ro.autofans.app.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddCircleOutline
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import ro.autofans.app.data.MobileApi
import ro.autofans.app.data.SupabaseAuthRepository

@Composable
fun AccountRoute(
    mobileApi: MobileApi,
    authRepository: SupabaseAuthRepository,
    onBack: () -> Unit,
    onNewListing: () -> Unit,
    onSellerListings: () -> Unit,
    onMessages: () -> Unit,
    onSellerDashboard: () -> Unit,
    onCollection: (String) -> Unit,
    onSellerRoleChanged: (Boolean) -> Unit,
) {
    var profile by remember { mutableStateOf<JsonObject?>(null) }
    var displayName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    // Keep the Google avatar when updating the rest of the profile. It should
    // be shown as a photo, never as a technical URL field.
    var avatarUrl by remember { mutableStateOf("") }
    var isAvatarUploading by remember { mutableStateOf(false) }
    var sellerVerificationPending by remember { mutableStateOf(false) }
    var verificationDialogVisible by remember { mutableStateOf(false) }
    var isVerificationSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    fun updateProfile(data: JsonObject?) {
        profile = data
        displayName = data?.get("display_name")?.jsonPrimitive?.content.orEmpty()
        phone = data?.get("phone")?.jsonPrimitive?.content.orEmpty()
        avatarUrl = data?.get("avatar_url")?.jsonPrimitive?.content.orEmpty()
        onSellerRoleChanged(data?.get("role")?.jsonPrimitive?.content == "seller")
    }

    val avatarPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri ?: return@rememberLauncherForActivityResult
        scope.launch {
            isAvatarUploading = true
            error = null
            runCatching {
                val uploadedAvatarUrl = mobileApi.uploadProfileAvatar(context, uri)
                mobileApi.call(
                    "update_profile",
                    buildJsonObject {
                        put("displayName", displayName.trim())
                        put("phone", phone.trim())
                        put("avatarUrl", uploadedAvatarUrl)
                    },
                )
            }.onSuccess {
                updateProfile(it["profile"]?.jsonObject)
                notice = "Fotografia de profil a fost actualizată."
            }.onFailure {
                error = it.message ?: "Nu am putut încărca fotografia."
            }
            isAvatarUploading = false
        }
    }

    LaunchedEffect(Unit) {
        runCatching { mobileApi.call("account") }
            .onSuccess { response ->
                updateProfile(response["profile"]?.jsonObject)
                sellerVerificationPending = response["sellerVerificationPending"]?.jsonPrimitive?.content == "true"
            }
            .onFailure { error = it.message ?: "Nu am putut încărca profilul." }
    }

    val role = profile?.get("role")?.jsonPrimitive?.content.orEmpty()
    val isSeller = role == "seller"
    val isVerified = profile?.get("is_verified")?.jsonPrimitive?.content == "true"
    val email = profile?.get("email")?.jsonPrimitive?.content.orEmpty()

    when {
        profile == null && error == null -> LoadingAccount()
        profile == null -> AccountError(error.orEmpty())
        else -> {
            LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, top = 20.dp, end = 20.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                ProfileHero(
                    name = displayName.ifBlank { "Profilul tău" },
                    email = email,
                    avatarUrl = avatarUrl,
                    isSeller = isSeller,
                    isVerified = isVerified,
                    isAvatarUploading = isAvatarUploading,
                    onChangePhoto = { avatarPicker.launch("image/*") },
                )
            }

            notice?.let { message ->
                item {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            message,
                            modifier = Modifier.padding(14.dp),
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }

            error?.let { message ->
                item {
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.errorContainer,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            message,
                            modifier = Modifier.padding(14.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }

            item {
                SectionTitle("Date de profil", "Actualizează informațiile pe care le văd ceilalți utilizatori.")
            }
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .55f)),
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        OutlinedTextField(
                            value = displayName,
                            onValueChange = { displayName = it },
                            label = { Text("Nume afișat") },
                            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Telefon") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        Button(
                            onClick = {
                                scope.launch {
                                    error = null
                                    runCatching {
                                        mobileApi.call(
                                            "update_profile",
                                            buildJsonObject {
                                                put("displayName", displayName.trim())
                                                put("phone", phone.trim())
                                                put("avatarUrl", avatarUrl)
                                            },
                                        )
                                    }.onSuccess {
                                        updateProfile(it["profile"]?.jsonObject)
                                        notice = "Profil actualizat."
                                    }.onFailure {
                                        error = it.message ?: "Nu am putut salva profilul."
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                        ) { Text("Salvează modificările") }
                    }
                }
            }

            item { SectionTitle("Activitatea mea") }
            item {
                ActionGroup(
                    actions = listOf(
                        AccountAction("Favorite", "Anunțurile păstrate pentru mai târziu", Icons.Default.FavoriteBorder) { onCollection("favorites") },
                        AccountAction("Căutări salvate", "Căutările și alertele tale", Icons.Default.BookmarkBorder) { onCollection("saved") },
                        AccountAction("Notificări", "Noutăți despre anunțurile urmărite", Icons.Default.NotificationsNone) { onCollection("notifications") },
                        AccountAction("Mesaje", "Conversațiile cu vânzătorii", Icons.Default.ChatBubbleOutline, onMessages),
                    ),
                )
            }

            item { SectionTitle("Vânzare pe AutoFans") }
            if (!isSeller) {
                item {
                    SellerStartCard(
                        onStart = {
                            scope.launch {
                                error = null
                                runCatching {
                                    mobileApi.call("promote_seller")
                                    mobileApi.call("account")
                                }.onSuccess {
                                    updateProfile(it["profile"]?.jsonObject)
                                    notice = "Contul tău este acum pregătit pentru vânzare."
                                }.onFailure {
                                    error = it.message ?: "Nu am putut activa contul de vânzător."
                                }
                            }
                        },
                    )
                }
            } else {
                item {
                    ActionGroup(
                        actions = buildList {
                            add(AccountAction("Adaugă anunț", "Publică o mașină nouă", Icons.Default.AddCircleOutline, onNewListing))
                            add(AccountAction("Anunțurile mele", "Gestionează anunțurile publicate", Icons.Default.Storefront, onSellerListings))
                            add(AccountAction("Dashboard seller", "Performanța anunțurilor tale", Icons.Default.Dashboard, onSellerDashboard))
                            if (!isVerified && !sellerVerificationPending) {
                                add(
                                    AccountAction("Solicită verificare", "Crește încrederea cumpărătorilor", Icons.Default.Verified) {
                                        verificationDialogVisible = true
                                    },
                                )
                            }
                        },
                    )
                }
                if (!isVerified && sellerVerificationPending) {
                    item { PendingVerificationCard() }
                }
            }

            item {
                OutlinedButton(
                    onClick = { scope.launch { authRepository.signOut(); onBack() } },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                ) {
                    Icon(Icons.Default.Logout, contentDescription = null)
                    Spacer(Modifier.width(10.dp))
                    Text("Deconectare")
                }
            }
            }
            if (verificationDialogVisible) {
                AlertDialog(
                    onDismissRequest = { if (!isVerificationSubmitting) verificationDialogVisible = false },
                    title = { Text("Solicită verificarea contului") },
                    text = {
                        Text("Vom analiza profilul tău de vânzător. Vei vedea aici când solicitarea este aprobată sau dacă avem nevoie de informații suplimentare.")
                    },
                    confirmButton = {
                        Button(
                            enabled = !isVerificationSubmitting,
                            onClick = {
                                isVerificationSubmitting = true
                                error = null
                                scope.launch {
                                    runCatching { mobileApi.call("request_seller_verification") }
                                        .onSuccess { response ->
                                            sellerVerificationPending = true
                                            verificationDialogVisible = false
                                            notice = response["message"]?.jsonPrimitive?.content
                                                ?: "Solicitarea de verificare a fost trimisă."
                                        }
                                        .onFailure { error = it.message ?: "Nu am putut trimite solicitarea." }
                                    isVerificationSubmitting = false
                                }
                            },
                        ) { Text(if (isVerificationSubmitting) "Se trimite…" else "Trimite solicitarea") }
                    },
                    dismissButton = {
                        TextButton(
                            enabled = !isVerificationSubmitting,
                            onClick = { verificationDialogVisible = false },
                        ) { Text("Mai târziu") }
                    },
                )
            }
        }
    }
}

@Composable
private fun LoadingAccount() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun AccountError(message: String) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Text(message, color = MaterialTheme.colorScheme.error)
    }
}

@Composable
private fun ProfileHero(
    name: String,
    email: String,
    avatarUrl: String,
    isSeller: Boolean,
    isVerified: Boolean,
    isAvatarUploading: Boolean,
    onChangePhoto: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary),
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Avatar(name = name, avatarUrl = avatarUrl)
                TextButton(onClick = onChangePhoto, enabled = !isAvatarUploading) {
                    if (isAvatarUploading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(14.dp),
                            color = MaterialTheme.colorScheme.onSecondary,
                            strokeWidth = 1.5.dp,
                        )
                    } else {
                        Text(
                            "Schimbă",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSecondary,
                        )
                    }
                }
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    name,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .78f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Surface(
                    shape = RoundedCornerShape(50),
                    color = MaterialTheme.colorScheme.onSecondary.copy(alpha = .14f),
                ) {
                    Text(
                        if (isSeller) if (isVerified) "Vânzător verificat" else "Vânzător" else "Cumpărător",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSecondary,
                    )
                }
            }
        }
    }
}

@Composable
private fun Avatar(name: String, avatarUrl: String) {
    Surface(
        modifier = Modifier.size(70.dp),
        shape = CircleShape,
        color = MaterialTheme.colorScheme.primaryContainer,
    ) {
        if (avatarUrl.isNotBlank()) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = "Fotografia de profil",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize().clip(CircleShape),
            )
        } else {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    name.trim().firstOrNull()?.uppercase().orEmpty(),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String, subtitle: String? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        subtitle?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

private data class AccountAction(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val onClick: () -> Unit,
)

@Composable
private fun ActionGroup(actions: List<AccountAction>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column {
            actions.forEachIndexed { index, action ->
                Surface(onClick = action.onClick, color = MaterialTheme.colorScheme.surface) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Surface(
                            modifier = Modifier.size(42.dp),
                            shape = RoundedCornerShape(13.dp),
                            color = MaterialTheme.colorScheme.primaryContainer,
                        ) {
                            Icon(
                                action.icon,
                                contentDescription = null,
                                modifier = Modifier.padding(10.dp),
                                tint = MaterialTheme.colorScheme.primary,
                            )
                        }
                        Spacer(Modifier.width(13.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(action.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                            Text(action.subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                if (index < actions.lastIndex) {
                    androidx.compose.material3.HorizontalDivider(
                        modifier = Modifier.padding(start = 71.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = .16f),
                    )
                }
            }
        }
    }
}

@Composable
private fun SellerStartCard(onStart: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(9.dp),
        ) {
            Icon(Icons.Default.Storefront, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text("Vrei să publici un anunț?", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(
                "Activează gratuit profilul de vânzător și adaugă prima mașină.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = .75f),
            )
            Button(onClick = onStart, modifier = Modifier.fillMaxWidth()) { Text("Activează cont de vânzător") }
        }
    }
}

@Composable
private fun PendingVerificationCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.Verified, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.width(12.dp))
            Column {
                Text("Verificare în analiză", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(
                    "Ai trimis deja solicitarea. Te anunțăm aici când este finalizată.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = .75f),
                )
            }
        }
    }
}
