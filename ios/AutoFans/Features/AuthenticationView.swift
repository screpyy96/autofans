import SwiftUI
import UIKit

struct LoginView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var newPassword = ""
    @State private var register = false
    @State private var reset = false
    @State private var loading = false
    @State private var notice = ""
    @State private var error = ""
    let done: () -> Void

    var body: some View {
        AFScreen {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    topBar
                    identity
                    AFCard(padding: 20) { form }
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                    securityNote
                }
                .padding(.bottom, 28)
            }
        }
        .navigationBarBackButtonHidden()
    }

    private var topBar: some View {
        HStack {
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.subheadline.bold()).foregroundStyle(AFTheme.ink)
                    .frame(width: 40, height: 40).background(AFTheme.paper).clipShape(Circle())
                    .overlay(Circle().stroke(AFTheme.line))
            }
            Spacer()
            AFBrandImage(name: "logo-header", ext: "png", contentMode: .fit).frame(width: 126, height: 36)
            Spacer()
            Color.clear.frame(width: 40, height: 40)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    private var identity: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle().fill(LinearGradient(colors: [AFTheme.paleGold, Color(red: 0.90, green: 0.71, blue: 0.30)], startPoint: .topLeading, endPoint: .bottomTrailing)).frame(width: 88, height: 88)
                AFBrandImage(name: "autofans_mark", ext: "png", contentMode: .fit).frame(width: 58, height: 58)
            }
            Text(title).font(.system(size: 31, weight: .bold, design: .rounded)).foregroundStyle(AFTheme.ink).multilineTextAlignment(.center)
            Text(subtitle).font(.subheadline).foregroundStyle(AFTheme.muted).multilineTextAlignment(.center).lineSpacing(3).padding(.horizontal, 35)
        }
        .padding(.top, 26)
    }

    @ViewBuilder private var form: some View {
        VStack(spacing: 16) {
            if auth.passwordRecovery && auth.session != nil { recoveryPasswordForm }
            else if let session = auth.session { signedInForm(session.user.email ?? "Autentificat") }
            else { credentialsForm }
        }
    }

    private var credentialsForm: some View {
        VStack(spacing: 14) {
            if reset {
                Text("Trimitem un link sigur la adresa ta de email.").font(.subheadline).foregroundStyle(AFTheme.muted).frame(maxWidth: .infinity, alignment: .leading)
                AuthInput(label: "Adresa de email", icon: "envelope", text: $email, keyboard: .emailAddress)
            } else {
                AuthInput(label: "Adresa de email", icon: "envelope", text: $email, keyboard: .emailAddress)
                AuthSecureInput(label: "Parolă", icon: "lock", text: $password)
                if register { Text("Vei confirma adresa de email înainte să intri în cont.").font(.caption).foregroundStyle(AFTheme.muted).frame(maxWidth: .infinity, alignment: .leading) }
                else { Button("Ai uitat parola?") { withAnimation { reset = true; register = false; clearMessages() } }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.gold).frame(maxWidth: .infinity, alignment: .trailing) }
            }
            feedback
            Button(primaryActionTitle) { submit() }
                .buttonStyle(AFGoldButton())
                .disabled(email.trimmed == nil || (!reset && password.count < 6) || loading)
                .overlay { if loading { ProgressView().tint(AFTheme.graphite) } }
            if !reset { divider; googleButton }
            switcher
        }
    }

    private var recoveryPasswordForm: some View {
        VStack(spacing: 16) {
            Text("Alege o parolă nouă, cu cel puțin 6 caractere.").font(.subheadline).foregroundStyle(AFTheme.muted).frame(maxWidth: .infinity, alignment: .leading)
            AuthSecureInput(label: "Parolă nouă", icon: "lock.rotation", text: $newPassword)
            feedback
            Button("Actualizează parola") { execute { try await auth.updatePassword(newPassword); done() } }
                .buttonStyle(AFGoldButton()).disabled(newPassword.count < 6 || loading)
        }
    }

    private func signedInForm(_ userEmail: String) -> some View {
        VStack(spacing: 16) {
            Label("Ești conectat", systemImage: "checkmark.seal.fill").font(.headline.weight(.bold)).foregroundStyle(.green)
            Text(userEmail).font(.subheadline).foregroundStyle(AFTheme.muted)
            Button("Continuă") { done() }.buttonStyle(AFGoldButton())
            Button("Deconectare", role: .destructive) { Task { await auth.signOut(); done() } }.font(.subheadline.weight(.bold))
        }
    }

    private var divider: some View { HStack(spacing: 10) { Rectangle().fill(AFTheme.line).frame(height: 1); Text("sau").font(.caption).foregroundStyle(AFTheme.muted); Rectangle().fill(AFTheme.line).frame(height: 1) } }
    private var googleButton: some View {
        Button { submitGoogle() } label: {
            HStack(spacing: 10) { Image(systemName: "g.circle.fill").font(.title3); Text("Continuă cu Google").font(.headline.weight(.bold)) }.foregroundStyle(AFTheme.ink).frame(maxWidth: .infinity).padding(.vertical, 14).background(AFTheme.paper).clipShape(Capsule()).overlay(Capsule().stroke(AFTheme.ink.opacity(0.16)))
        }
        .disabled(loading)
    }
    @ViewBuilder private var switcher: some View {
        if reset { Button("Înapoi la autentificare") { withAnimation { reset = false; clearMessages() } }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.ink).padding(.top, 2) }
        else { HStack(spacing: 4) { Text(register ? "Ai deja cont?" : "Nu ai cont?").foregroundStyle(AFTheme.muted); Button(register ? "Autentifică-te" : "Creează unul") { withAnimation { register.toggle(); clearMessages() } }.fontWeight(.bold).foregroundStyle(AFTheme.gold) }.font(.subheadline).padding(.top, 2) }
    }
    @ViewBuilder private var feedback: some View {
        if !error.isEmpty { Label(error, systemImage: "exclamationmark.triangle.fill").font(.footnote.weight(.medium)).foregroundStyle(.red).padding(12).frame(maxWidth: .infinity, alignment: .leading).background(Color.red.opacity(0.08)).clipShape(RoundedRectangle(cornerRadius: 13)) }
        if !notice.isEmpty { Label(notice, systemImage: "checkmark.circle.fill").font(.footnote.weight(.medium)).foregroundStyle(.green).padding(12).frame(maxWidth: .infinity, alignment: .leading).background(Color.green.opacity(0.08)).clipShape(RoundedRectangle(cornerRadius: 13)) }
    }
    private var securityNote: some View { Label("Datele contului sunt protejate și sesiunea rămâne doar pe dispozitivul tău.", systemImage: "lock.shield").font(.caption).foregroundStyle(AFTheme.muted).multilineTextAlignment(.center).padding(.horizontal, 35).padding(.top, 22) }

    private var title: String { if auth.passwordRecovery && auth.session != nil { return "Parolă nouă" }; if reset { return "Recuperează accesul" }; return register ? "Creează-ți contul" : "Bun venit înapoi" }
    private var subtitle: String { if auth.passwordRecovery && auth.session != nil { return "Păstrează contul AutoFans în siguranță." }; if reset { return "Nu-i nimic. Te ajutăm să revii rapid în cont." }; return register ? "Salvează favorite, primește alerte și gestionează totul într-un singur loc." : "Conectează-te pentru favorite, alerte și conversații cu vânzătorii." }
    private var primaryActionTitle: String { reset ? "Trimite linkul de resetare" : (register ? "Creează cont" : "Autentificare") }
    private func clearMessages() { error = ""; notice = "" }
    private func submit() { if reset { execute { try await auth.sendPasswordReset(email: email); notice = "Ți-am trimis un email cu linkul de resetare." } } else if register { execute { let hasSession = try await auth.signUp(email: email, password: password); notice = hasSession ? "Cont creat cu succes." : "Cont creat. Verifică emailul pentru confirmare."; if hasSession { done() } } } else { execute { try await auth.signIn(email: email, password: password); done() } } }
    private func submitGoogle() {
        guard let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }),
              let presenter = scene.keyWindow?.rootViewController else {
            error = "Nu am putut deschide autentificarea Google."
            return
        }
        execute { try await auth.signInWithGoogle(presenting: presenter); done() }
    }
    private func execute(_ action: @escaping () async throws -> Void) { loading = true; error = ""; Task { do { try await action() } catch { self.error = error.localizedDescription }; loading = false } }
}

private struct AuthInput: View {
    let label: String; let icon: String; @Binding var text: String; var keyboard: UIKeyboardType = .default
    var body: some View { VStack(alignment: .leading, spacing: 7) { Text(label).font(.caption.weight(.bold)).foregroundStyle(AFTheme.ink); HStack(spacing: 10) { Image(systemName: icon).foregroundStyle(AFTheme.gold).frame(width: 18); TextField(label, text: $text).textInputAutocapitalization(.never).keyboardType(keyboard).textContentType(.emailAddress) }.padding(14).background(AFTheme.ivory).clipShape(RoundedRectangle(cornerRadius: 15)).overlay(RoundedRectangle(cornerRadius: 15).stroke(AFTheme.line)) } }
}

private struct AuthSecureInput: View {
    let label: String; let icon: String; @Binding var text: String
    var body: some View { VStack(alignment: .leading, spacing: 7) { Text(label).font(.caption.weight(.bold)).foregroundStyle(AFTheme.ink); HStack(spacing: 10) { Image(systemName: icon).foregroundStyle(AFTheme.gold).frame(width: 18); SecureField(label, text: $text).textContentType(.password) }.padding(14).background(AFTheme.ivory).clipShape(RoundedRectangle(cornerRadius: 15)).overlay(RoundedRectangle(cornerRadius: 15).stroke(AFTheme.line)) } }
}
