package ro.autofans.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import ro.autofans.app.data.MobileApi
import ro.autofans.app.data.SupabaseAuthRepository
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Composable
fun AccountRoute(mobileApi: MobileApi, authRepository: SupabaseAuthRepository, onBack: () -> Unit, onNewListing: () -> Unit, onSellerListings: () -> Unit, onMessages: () -> Unit, onSellerDashboard: () -> Unit, onCollection: (String) -> Unit) {
    var profile by remember { mutableStateOf<kotlinx.serialization.json.JsonObject?>(null) }
    var displayName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var avatarUrl by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    fun updateProfile(data: kotlinx.serialization.json.JsonObject?) { profile = data; displayName=data?.get("display_name")?.jsonPrimitive?.content.orEmpty(); phone=data?.get("phone")?.jsonPrimitive?.content.orEmpty(); avatarUrl=data?.get("avatar_url")?.jsonPrimitive?.content.orEmpty() }
    LaunchedEffect(Unit) { runCatching { mobileApi.call("account") }.onSuccess { response -> updateProfile(response["profile"]?.jsonObject) }.onFailure { error = it.message } }
    val role = profile?.get("role")?.jsonPrimitive?.content.orEmpty()
    val isSeller = role == "seller"
    val isVerified = profile?.get("is_verified")?.jsonPrimitive?.content == "true"
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Cont AutoFans", style = MaterialTheme.typography.headlineMedium)
        when {
            profile == null && error == null -> CircularProgressIndicator()
            error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
            else -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) { Text(displayName.ifBlank { "Profilul tău" }, style=MaterialTheme.typography.titleMedium); Text(profile?.get("email")?.jsonPrimitive?.content.orEmpty()); Text(if (isSeller) if (isVerified) "Vânzător verificat" else "Vânzător" else "Cumpărător", style=MaterialTheme.typography.labelMedium) } }
        }
        notice?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        Text("Profil", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(displayName,{displayName=it},label={Text("Nume afișat")},modifier=Modifier.fillMaxWidth(),singleLine=true)
        OutlinedTextField(phone,{phone=it},label={Text("Telefon")},modifier=Modifier.fillMaxWidth(),singleLine=true)
        OutlinedTextField(avatarUrl,{avatarUrl=it},label={Text("URL avatar (opțional)")},modifier=Modifier.fillMaxWidth(),singleLine=true)
        Button(onClick={scope.launch{runCatching{mobileApi.call("update_profile",buildJsonObject{put("displayName",displayName);put("phone",phone);put("avatarUrl",avatarUrl)})}.onSuccess{updateProfile(it["profile"]?.jsonObject);notice="Profil actualizat."}.onFailure{error=it.message}}},modifier=Modifier.fillMaxWidth()){Text("Salvează profilul")}
        Text("Cumpărător", style = MaterialTheme.typography.titleMedium)
        OutlinedButton(onClick={onCollection("favorites")},modifier=Modifier.fillMaxWidth()){Text("Favorite")}
        OutlinedButton(onClick={onCollection("saved")},modifier=Modifier.fillMaxWidth()){Text("Căutări salvate")}
        OutlinedButton(onClick={onCollection("notifications")},modifier=Modifier.fillMaxWidth()){Text("Notificări")}
        OutlinedButton(onClick = onMessages, modifier = Modifier.fillMaxWidth()) { Text("Mesaje") }
        Text("Vânzător", style = MaterialTheme.typography.titleMedium)
        if (!isSeller) {
            Button(onClick = { scope.launch { runCatching { mobileApi.call("promote_seller"); mobileApi.call("account") }.onSuccess { response -> updateProfile(response["profile"]?.jsonObject); notice="Cont promovat la vânzător." }.onFailure { error = it.message } } }) { Text("Devino vânzător") }
        } else {
            OutlinedButton(onClick = onNewListing, modifier = Modifier.fillMaxWidth()) { Text("Creează anunț") }
            OutlinedButton(onClick = onSellerListings, modifier = Modifier.fillMaxWidth()) { Text("Anunțurile mele") }
            OutlinedButton(onClick = onSellerDashboard, modifier = Modifier.fillMaxWidth()) { Text("Dashboard seller") }
            if (!isVerified) OutlinedButton(onClick={scope.launch{runCatching{mobileApi.call("request_seller_verification")}.onSuccess{notice="Solicitarea de verificare a fost trimisă."}.onFailure{error=it.message}}},modifier=Modifier.fillMaxWidth()){Text("Solicită verificare seller")}
        }
        Spacer(Modifier.weight(1f))
        OutlinedButton(onClick = { scope.launch { authRepository.signOut(); onBack() } }, modifier = Modifier.fillMaxWidth()) { Text("Deconectare") }
    }
}
