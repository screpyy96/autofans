package ro.autofans.app.ui

import android.app.Activity
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch
import ro.autofans.app.BuildConfig
import ro.autofans.app.R
import ro.autofans.app.data.SupabaseAuthRepository
import java.security.MessageDigest
import java.security.SecureRandom

@Composable
fun LoginRoute(authRepository: SupabaseAuthRepository, onDone: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var register by remember { mutableStateOf(false) }
    var resetMode by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val activeSession by authRepository.sessionState.collectAsStateWithLifecycle()
    val passwordRecovery by authRepository.passwordRecovery.collectAsStateWithLifecycle()

    LaunchedEffect(activeSession, passwordRecovery) {
        if (activeSession != null && !passwordRecovery) onDone()
    }

    val mode = when {
        passwordRecovery -> AuthMode.NEW_PASSWORD
        resetMode -> AuthMode.RESET
        register -> AuthMode.REGISTER
        else -> AuthMode.LOGIN
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .55f)) {
        Column(
            modifier = Modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()),
        ) {
            AuthHero(mode)
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 20.dp),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(13.dp),
                ) {
                    if (activeSession != null && !passwordRecovery) {
                        SignedInPanel(email = activeSession?.user?.email.orEmpty(), onSignOut = {
                            scope.launch { authRepository.signOut(); onDone() }
                        })
                    } else if (passwordRecovery) {
                        NewPasswordPanel(
                            newPassword = newPassword,
                            onPasswordChange = { newPassword = it },
                            error = error,
                            loading = loading,
                            onSubmit = {
                                loading = true
                                error = null
                                scope.launch {
                                    runCatching { authRepository.updatePassword(newPassword) }
                                        .onSuccess { onDone() }
                                        .onFailure { error = it.message ?: "Nu am putut actualiza parola."; loading = false }
                                }
                            },
                        )
                    } else {
                        LoginForm(
                            mode = mode,
                            email = email,
                            password = password,
                            error = error,
                            message = message,
                            loading = loading,
                            onEmailChange = { email = it },
                            onPasswordChange = { password = it },
                            onSubmit = {
                                loading = true
                                error = null
                                message = null
                                scope.launch {
                                    runCatching {
                                        when {
                                            resetMode -> authRepository.sendPasswordReset(email)
                                            register -> authRepository.signUp(email, password)
                                            else -> authRepository.signIn(email, password)
                                        }
                                    }.onSuccess { result ->
                                        loading = false
                                        if (resetMode) message = "Ți-am trimis un email pentru resetarea parolei."
                                        else if (register && result == null) message = "Cont creat. Verifică emailul pentru confirmare."
                                    }.onFailure { failure ->
                                        loading = false
                                        error = failure.message ?: "Autentificare eșuată."
                                    }
                                }
                            },
                            onGoogle = {
                                val activity = context as? Activity
                                if (activity == null) {
                                    error = "Google Sign-In nu poate porni din acest ecran."
                                    return@LoginForm
                                }
                                loading = true
                                error = null
                                message = null
                                scope.launch {
                                    runCatching {
                                        val (nonce, hashedNonce) = createGoogleNonce()
                                        val signInOption = GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                                            .setNonce(hashedNonce)
                                            .build()
                                        val result = CredentialManager.create(activity).getCredential(
                                            context = activity,
                                            request = GetCredentialRequest.Builder().addCredentialOption(signInOption).build(),
                                        )
                                        val credential = result.credential as? CustomCredential
                                            ?: error("Google nu a returnat o identitate validă.")
                                        check(credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                                            "Răspuns Google neașteptat."
                                        }
                                        val idToken = GoogleIdTokenCredential.createFrom(credential.data).idToken
                                        authRepository.signInWithGoogleIdToken(idToken, nonce)
                                    }.onSuccess {
                                        loading = false
                                    }.onFailure { failure ->
                                        loading = false
                                        error = googleSignInMessage(failure)
                                    }
                                }
                            },
                            onToggleReset = {
                                resetMode = !resetMode
                                register = false
                                error = null
                                message = null
                            },
                            onToggleRegister = {
                                register = !register
                                error = null
                                message = null
                            },
                        )
                    }
                }
            }
            Spacer(Modifier.height(18.dp))
        }
    }
}

private enum class AuthMode(val title: String, val subtitle: String) {
    LOGIN("Bine ai revenit", "Intră în garajul tău AutoFans."),
    REGISTER("Pornește la drum", "Creează-ți contul și păstrează mașinile care contează."),
    RESET("Recuperează accesul", "Îți trimitem un link sigur pe email."),
    NEW_PASSWORD("Alege o parolă nouă", "Mai ai un pas până reintri în cont."),
}

@Composable
private fun AuthHero(mode: AuthMode) {
    Box(
        modifier = Modifier.fillMaxWidth().height(276.dp).clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp)),
    ) {
        Image(
            painter = painterResource(R.drawable.onboarding_buy),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )
        Box(
            modifier = Modifier.fillMaxSize().background(
                Brush.verticalGradient(
                    0f to Color(0x110E2C57),
                    .54f to Color(0x0B0E2C57),
                    1f to Color(0xDE0E2C57),
                ),
            ),
        )
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Surface(
                shape = RoundedCornerShape(50),
                color = Color.White.copy(alpha = .92f),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Image(
                        painter = painterResource(R.drawable.autofans_mark),
                        contentDescription = "AutoFans",
                        modifier = Modifier.size(20.dp),
                    )
                    Text(
                        "AUTOFANS",
                        modifier = Modifier.padding(start = 6.dp),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(mode.title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = Color.White)
                Text(mode.subtitle, style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = .88f))
            }
        }
    }
}

@Composable
private fun LoginForm(
    mode: AuthMode,
    email: String,
    password: String,
    error: String?,
    message: String?,
    loading: Boolean,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onGoogle: () -> Unit,
    onToggleReset: () -> Unit,
    onToggleRegister: () -> Unit,
) {
    val resetMode = mode == AuthMode.RESET
    val registerMode = mode == AuthMode.REGISTER
    Text(mode.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
    Text(mode.subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(2.dp))
    AuthTextField(value = email, onValueChange = onEmailChange, label = "Email", icon = Icons.Default.Email)
    if (!resetMode) {
        PasswordField(value = password, onValueChange = onPasswordChange, label = "Parolă")
    }
    FeedbackMessage(error = error, message = message)
    Button(
        enabled = !loading && email.isNotBlank() && (resetMode || password.length >= 6),
        onClick = onSubmit,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        shape = RoundedCornerShape(15.dp),
    ) {
        if (loading) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
        else Text(if (resetMode) "Trimite linkul de resetare" else if (registerMode) "Creează cont" else "Intră în cont")
    }
    if (!resetMode) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outline.copy(alpha = .25f))
            Text("sau", modifier = Modifier.padding(horizontal = 12.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outline.copy(alpha = .25f))
        }
        OutlinedButton(
            enabled = !loading,
            onClick = onGoogle,
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(15.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.onSurface),
        ) {
            Text("Continuă cu Google", fontWeight = FontWeight.SemiBold)
        }
        Text(
            "Alegi contul direct în Android. Nu se deschide autofans.ro.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        TextButton(onClick = onToggleReset) {
            Text(if (resetMode) "Înapoi la autentificare" else "Ai uitat parola?")
        }
    }
    if (!resetMode) {
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            TextButton(onClick = onToggleRegister) {
                Text(if (registerMode) "Ai deja cont? Autentifică-te" else "Nu ai cont? Creează unul")
            }
        }
    }
}

@Composable
private fun NewPasswordPanel(
    newPassword: String,
    onPasswordChange: (String) -> Unit,
    error: String?,
    loading: Boolean,
    onSubmit: () -> Unit,
) {
    Text("Alege parola nouă", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
    Text("Folosește cel puțin 6 caractere.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    PasswordField(value = newPassword, onValueChange = onPasswordChange, label = "Parola nouă")
    FeedbackMessage(error = error, message = null)
    Button(
        enabled = newPassword.length >= 6 && !loading,
        onClick = onSubmit,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        shape = RoundedCornerShape(15.dp),
    ) {
        if (loading) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
        else Text("Actualizează parola")
    }
}

@Composable
private fun SignedInPanel(email: String, onSignOut: () -> Unit) {
    Text("Ești deja conectat", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
    Text(email, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) { Text("Deconectare") }
}

@Composable
private fun AuthTextField(value: String, onValueChange: (String) -> Unit, label: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        leadingIcon = { Icon(icon, contentDescription = null) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .45f)),
    )
}

@Composable
private fun PasswordField(value: String, onValueChange: (String) -> Unit, label: String) {
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
        trailingIcon = {
            IconButton(onClick = { visible = !visible }) {
                Icon(if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility, contentDescription = "Arată sau ascunde parola")
            }
        },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .45f)),
    )
}

@Composable
private fun FeedbackMessage(error: String?, message: String?) {
    val text = error ?: message ?: return
    val isError = error != null
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = if (isError) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.primaryContainer,
    ) {
        Text(
            text,
            modifier = Modifier.padding(12.dp),
            style = MaterialTheme.typography.bodySmall,
            color = if (isError) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer,
        )
    }
}

private fun createGoogleNonce(): Pair<String, String> {
    val nonceBytes = ByteArray(32).also(SecureRandom()::nextBytes)
    val rawNonce = Base64.encodeToString(
        nonceBytes,
        Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP,
    )
    val hashedNonce = MessageDigest.getInstance("SHA-256")
        .digest(rawNonce.encodeToByteArray())
        .joinToString("") { byte -> "%02x".format(byte.toInt() and 0xff) }
    return rawNonce to hashedNonce
}

private fun googleSignInMessage(failure: Throwable): String {
    val technicalMessage = failure.message.orEmpty()
    return if (technicalMessage.contains("reauth", ignoreCase = true) ||
        technicalMessage.contains("unregistered", ignoreCase = true)
    ) {
        "Google Sign-In pentru Android nu este încă autorizat pentru acest build. " +
            "Nu ai fost trimis pe site; configurarea Google Cloud trebuie activată o singură dată."
    } else {
        technicalMessage.ifBlank { "Nu am putut finaliza autentificarea cu Google." }
    }
}
