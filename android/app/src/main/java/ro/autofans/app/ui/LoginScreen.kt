package ro.autofans.app.ui

import android.app.Activity
import android.util.Base64
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import java.security.MessageDigest
import java.security.SecureRandom
import ro.autofans.app.BuildConfig
import ro.autofans.app.data.SupabaseAuthRepository

@Composable
fun LoginRoute(authRepository: SupabaseAuthRepository, onDone: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var register by remember { mutableStateOf(false) }
    var resetMode by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val activeSession by authRepository.sessionState.collectAsStateWithLifecycle()
    val passwordRecovery by authRepository.passwordRecovery.collectAsStateWithLifecycle()
    var newPassword by remember { mutableStateOf("") }

    // Google returns through autofans://auth/callback. The repository emits the
    // freshly persisted session here, so the protected screen resumes without
    // making the user press another button.
    LaunchedEffect(activeSession, passwordRecovery) {
        if (activeSession != null && !passwordRecovery) onDone()
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(if (activeSession == null) "Cont AutoFans" else "Contul tău", style = androidx.compose.material3.MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(20.dp))
        if (activeSession != null && passwordRecovery) {
            Text("Alege parola nouă", style = androidx.compose.material3.MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = newPassword,
                onValueChange = { newPassword = it },
                label = { Text("Parola nouă") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )
            error?.let { Spacer(Modifier.height(12.dp)); Text(it, color = androidx.compose.material3.MaterialTheme.colorScheme.error) }
            Spacer(Modifier.height(16.dp))
            Button(enabled = newPassword.length >= 6 && !loading, onClick = {
                loading = true; error = null
                scope.launch {
                    runCatching { authRepository.updatePassword(newPassword) }
                        .onSuccess { onDone() }
                        .onFailure { error = it.message ?: "Nu am putut actualiza parola."; loading = false }
                }
            }, modifier = Modifier.fillMaxWidth()) { Text(if (loading) "Se actualizează…" else "Actualizează parola") }
            return@Column
        }
        val signedInSession = activeSession
        if (signedInSession != null) {
            Text(signedInSession.user.email ?: "Autentificat")
            Spacer(Modifier.height(16.dp))
            Button(onClick = { scope.launch { authRepository.signOut(); onDone() } }) { Text("Deconectare") }
            return@Column
        }
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        if (!resetMode) {
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Parolă") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        }
        error?.let { Spacer(Modifier.height(12.dp)); Text(it, color = androidx.compose.material3.MaterialTheme.colorScheme.error) }
        message?.let { Spacer(Modifier.height(12.dp)); Text(it) }
        Spacer(Modifier.height(16.dp))
        Button(enabled = !loading && email.isNotBlank() && (resetMode || password.length >= 6), onClick = {
            loading = true; error = null; message = null
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
                }.onFailure { failure -> loading = false; error = failure.message ?: "Autentificare eșuată." }
            }
        }, modifier = Modifier.fillMaxWidth()) {
            Text(if (loading) "Se procesează…" else if (resetMode) "Trimite link" else if (register) "Creează cont" else "Autentificare")
        }
        if (!resetMode) {
            Spacer(Modifier.height(10.dp))
            OutlinedButton(enabled = !loading, onClick = {
                val activity = context as? Activity
                if (activity == null) {
                    error = "Google Sign-In nu poate porni din acest ecran."
                    return@OutlinedButton
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
            }, modifier = Modifier.fillMaxWidth()) {
                Text("Continuă cu Google")
            }
            Spacer(Modifier.height(6.dp))
            Text(
                "Alegi contul direct în Android. Nu se deschide autofans.ro.",
                style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
                color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        TextButton(onClick = { resetMode = !resetMode; register = false; error = null; message = null }) { Text(if (resetMode) "Înapoi la autentificare" else "Ai uitat parola?") }
        if (!resetMode) TextButton(onClick = { register = !register; error = null; message = null }) { Text(if (register) "Ai deja cont? Autentifică-te" else "Nu ai cont? Creează unul") }
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
