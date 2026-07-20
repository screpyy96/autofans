import SwiftUI
import PhotosUI

struct AccountView: View {
    @EnvironmentObject private var app: AppContainer
    @EnvironmentObject private var auth: AuthStore

    @State private var profile = [String: JSONValue]()
    @State private var name = ""
    @State private var phone = ""
    @State private var avatar = ""
    @State private var avatarPicker: PhotosPickerItem?
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var isUploadingAvatar = false
    @State private var isRequestingVerification = false
    @State private var sellerVerificationPending = false
    @State private var showVerificationConfirmation = false
    @State private var showSignOutConfirmation = false
    @State private var error = ""
    @State private var notice = ""

    let open: (Route) -> Void

    var body: some View {
        AFScreen {
            Group {
                if isLoading {
                    loadingContent
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 18) {
                            profileHero

                            if !error.isEmpty { feedback(error, color: .red, icon: "exclamationmark.triangle.fill") }
                            if !notice.isEmpty { feedback(notice, color: .green, icon: "checkmark.circle.fill") }

                            sectionTitle("Date de profil", detail: "Actualizează informațiile pe care le văd ceilalți utilizatori.")
                            profileEditor

                            sectionTitle("Activitatea mea")
                            actionGroup(items: [
                                AccountAction("Favorite", "Anunțurile păstrate pentru mai târziu", "heart", { open(.collection(.favorites)) }),
                                AccountAction("Căutări salvate", "Alerte și filtrele tale", "bookmark", { open(.collection(.saved)) }),
                                AccountAction("Notificări", "Mesaje, alerte și actualizări", "bell", { open(.collection(.notifications)) }),
                                AccountAction("Mesaje", "Conversațiile cu cumpărători și vânzători", "message", { open(.messages) }),
                            ])

                            sectionTitle("Vânzare pe AutoFans")
                            sellerArea

                            Button {
                                showSignOutConfirmation = true
                            } label: {
                                Label("Deconectare", systemImage: "rectangle.portrait.and.arrow.right")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(.red)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 15)
                                    .background(Color.red.opacity(0.07))
                                    .clipShape(Capsule())
                            }
                            .padding(.top, 2)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 18)
                    }
                    .refreshable { await load(showLoading: false) }
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .task(id: app.accountRefreshVersion) { await load() }
        .onChange(of: avatarPicker) { _, item in
            Task { await uploadAvatar(item) }
        }
        .confirmationDialog("Verifică profilul de seller", isPresented: $showVerificationConfirmation, titleVisibility: .visible) {
            Button("Trimite solicitarea") { requestSellerVerification() }
            Button("Renunță", role: .cancel) { }
        } message: {
            Text("Solicitarea este trimisă echipei AutoFans. Vei primi o notificare după ce profilul este verificat.")
        }
        .confirmationDialog("Te deconectezi din AutoFans?", isPresented: $showSignOutConfirmation, titleVisibility: .visible) {
            Button("Deconectare", role: .destructive) { Task { await auth.signOut() } }
            Button("Renunță", role: .cancel) { }
        }
    }

    private var loadingContent: some View {
        ScrollView {
            VStack(spacing: 18) {
                AFSkeleton().frame(height: 178)
                AFSkeleton().frame(height: 44).frame(maxWidth: .infinity, alignment: .leading)
                AFSkeleton().frame(height: 220)
                AFSkeleton().frame(height: 290)
            }
            .padding(20)
        }
    }

    private var profileHero: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                colors: [Color(red: 0.05, green: 0.14, blue: 0.28), AFTheme.graphite],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(AFTheme.gold.opacity(0.2))
                .frame(width: 170, height: 170)
                .offset(x: 215, y: -74)

            HStack(alignment: .center, spacing: 14) {
                PhotosPicker(selection: $avatarPicker, matching: .images) {
                    ZStack(alignment: .bottomTrailing) {
                        avatarImage
                            .frame(width: 76, height: 76)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(.white.opacity(0.7), lineWidth: 2))

                        ZStack {
                            Circle().fill(AFTheme.gold)
                            if isUploadingAvatar {
                                ProgressView().tint(AFTheme.graphite).scaleEffect(0.68)
                            } else {
                                Image(systemName: "camera.fill")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(AFTheme.graphite)
                            }
                        }
                        .frame(width: 28, height: 28)
                        .overlay(Circle().stroke(AFTheme.graphite, lineWidth: 2))
                    }
                }
                .disabled(isUploadingAvatar)
                .accessibilityLabel("Schimbă fotografia de profil")

                VStack(alignment: .leading, spacing: 5) {
                    Text(name.isEmpty ? "Profilul tău" : name)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text(profile[string: "email"])
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.74))
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        Image(systemName: profile[bool: "is_verified"] ? "checkmark.seal.fill" : (isSeller ? "car.fill" : "person.fill"))
                        Text(roleLabel)
                    }
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(profile[bool: "is_verified"] ? Color.green.opacity(0.95) : AFTheme.paleGold)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 6)
                    .background(.white.opacity(0.13))
                    .clipShape(Capsule())
                }

                Spacer(minLength: 0)
            }
            .padding(18)
        }
        .frame(height: 144)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .shadow(color: AFTheme.graphite.opacity(0.2), radius: 16, y: 9)
    }

    @ViewBuilder private var avatarImage: some View {
        if let url = URL(string: avatar), !avatar.isEmpty {
            AsyncImage(url: url) { phase in
                if let image = phase.image {
                    image.resizable().scaledToFill()
                } else {
                    avatarFallback
                }
            }
        } else {
            avatarFallback
        }
    }

    private var avatarFallback: some View {
        ZStack {
            Circle().fill(AFTheme.paleGold)
            Text(initials)
                .font(.title3.weight(.bold))
                .foregroundStyle(AFTheme.graphite)
        }
    }

    private var profileEditor: some View {
        AFCard {
            VStack(alignment: .leading, spacing: 13) {
                profileField("Nume afișat", icon: "person.fill", text: $name)
                profileField("Telefon", icon: "phone.fill", text: $phone, keyboard: .phonePad)

                Button {
                    saveProfile()
                } label: {
                    HStack(spacing: 8) {
                        if isSaving { ProgressView().tint(.white).scaleEffect(0.8) }
                        Text(isSaving ? "Se salvează…" : "Salvează modificările")
                    }
                }
                .buttonStyle(AFPrimaryButton())
                .disabled(isSaving || isUploadingAvatar)
            }
        }
    }

    private func profileField(_ title: String, icon: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        HStack(spacing: 11) {
            Image(systemName: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AFTheme.muted)
                .frame(width: 18)
            TextField(title, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(title == "Nume afișat" ? .words : .never)
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 14)
        .background(AFTheme.ivory)
        .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 15, style: .continuous).stroke(AFTheme.line))
    }

    private func sectionTitle(_ title: String, detail: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.headline.weight(.bold))
                .foregroundStyle(AFTheme.ink)
            if let detail {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(AFTheme.muted)
            }
        }
        .padding(.top, 2)
    }

    private func actionGroup(items: [AccountAction]) -> some View {
        AFCard(padding: 6) {
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    Button(action: item.action) {
                        HStack(spacing: 12) {
                            Image(systemName: item.icon)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(AFTheme.gold)
                                .frame(width: 38, height: 38)
                                .background(AFTheme.paleGold.opacity(0.58))
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.title)
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(AFTheme.ink)
                                Text(item.detail)
                                    .font(.caption)
                                    .foregroundStyle(AFTheme.muted)
                                    .lineLimit(1)
                            }

                            Spacer(minLength: 6)
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(AFTheme.muted)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 11)
                        .contentShape(Rectangle())
                    }

                    if index < items.count - 1 {
                        Divider().padding(.leading, 60)
                    }
                }
            }
        }
    }

    @ViewBuilder private var sellerArea: some View {
        if isSeller {
            VStack(spacing: 12) {
                if sellerVerificationPending {
                    feedback("Verificarea profilului este în curs. Îți trimitem o notificare imediat ce avem un răspuns.", color: AFTheme.gold, icon: "clock.fill")
                } else if !profile[bool: "is_verified"] {
                    AFCard {
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: "checkmark.shield.fill")
                                .font(.title3)
                                .foregroundStyle(AFTheme.gold)
                                .frame(width: 42, height: 42)
                                .background(AFTheme.paleGold.opacity(0.58))
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            VStack(alignment: .leading, spacing: 5) {
                                Text("Fă-ți profilul mai credibil")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(AFTheme.ink)
                                Text("Solicită verificarea contului ca să inspiri mai multă încredere cumpărătorilor.")
                                    .font(.caption)
                                    .foregroundStyle(AFTheme.muted)
                                Button {
                                    showVerificationConfirmation = true
                                } label: {
                                    HStack(spacing: 6) {
                                        if isRequestingVerification { ProgressView().scaleEffect(0.7) }
                                        Text(isRequestingVerification ? "Se trimite…" : "Solicită verificarea")
                                    }
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(AFTheme.gold)
                                    .padding(.top, 4)
                                }
                                .disabled(isRequestingVerification)
                            }
                        }
                    }
                }

                Button { open(.listingEditor(nil)) } label: {
                    Label("Publică un anunț", systemImage: "plus")
                }
                .buttonStyle(AFGoldButton())

                HStack(spacing: 12) {
                    Button { open(.sellerListings) } label: {
                        Label("Anunțurile mele", systemImage: "car.2.fill")
                    }
                    .buttonStyle(AFPrimaryButton())

                    Button { open(.sellerDashboard) } label: {
                        Label("Dashboard", systemImage: "chart.bar.fill")
                    }
                    .buttonStyle(AFPrimaryButton())
                }
            }
        } else {
            AFCard {
                VStack(alignment: .leading, spacing: 12) {
                    Label("Vinde pe AutoFans", systemImage: "sparkles")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(AFTheme.ink)
                    Text("Transformă-ți contul în seller ca să publici, gestionezi anunțuri și răspunzi cumpărătorilor direct din aplicație.")
                        .font(.subheadline)
                        .foregroundStyle(AFTheme.muted)
                    Button("Devino vânzător") { promoteSeller() }
                        .buttonStyle(AFGoldButton())
                }
            }
        }
    }

    private func feedback(_ text: String, color: Color, icon: String) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: icon).font(.subheadline.weight(.bold))
            Text(text).font(.footnote.weight(.medium)).fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(color)
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var isSeller: Bool { profile[string: "role"] == "seller" }

    private var roleLabel: String {
        if profile[bool: "is_verified"] { return "Vânzător verificat" }
        return isSeller ? "Vânzător" : "Cumpărător"
    }

    private var initials: String {
        let letters = name.split(separator: " ").prefix(2).compactMap(\.first)
        return letters.isEmpty ? "AF" : String(letters).uppercased()
    }

    private func load(showLoading: Bool = true) async {
        if showLoading { isLoading = true }
        defer { if showLoading { isLoading = false } }

        do {
            let result = try await app.api.call("account")
            setProfile(result["profile"]?.object ?? [:])
            sellerVerificationPending = result[bool: "sellerVerificationPending"]
            error = ""
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func setProfile(_ profile: [String: JSONValue]) {
        self.profile = profile
        name = profile[string: "display_name"]
        phone = profile[string: "phone"]
        avatar = profile[string: "avatar_url"]
    }

    private func saveProfile() {
        guard !isSaving else { return }
        isSaving = true
        error = ""
        notice = ""

        Task {
            defer { isSaving = false }
            do {
                let result = try await app.api.call("update_profile", payload: profilePayload(avatarURL: avatar))
                if let profile = result["profile"]?.object { setProfile(profile) }
                notice = "Profil actualizat."
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func uploadAvatar(_ item: PhotosPickerItem?) async {
        guard let item, !isUploadingAvatar else { return }
        isUploadingAvatar = true
        error = ""
        notice = ""
        defer { isUploadingAvatar = false; avatarPicker = nil }

        do {
            guard let data = try await item.loadTransferable(type: Data.self), let image = UIImage(data: data) else {
                throw APIError.invalidResponse
            }
            let uploadedURL = try await app.api.uploadProfileAvatar(image)
            let result = try await app.api.call("update_profile", payload: profilePayload(avatarURL: uploadedURL))
            if let profile = result["profile"]?.object { setProfile(profile) }
            else { avatar = uploadedURL }
            notice = "Fotografia de profil a fost actualizată."
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func profilePayload(avatarURL: String) -> [String: JSONValue] {
        [
            "displayName": .string(name.trimmingCharacters(in: .whitespacesAndNewlines)),
            "phone": .string(phone.trimmingCharacters(in: .whitespacesAndNewlines)),
            "avatarUrl": .string(avatarURL),
        ]
    }

    private func requestSellerVerification() {
        guard !isRequestingVerification else { return }
        isRequestingVerification = true
        error = ""
        notice = ""

        Task {
            defer { isRequestingVerification = false }
            do {
                let result = try await app.api.call("request_seller_verification")
                sellerVerificationPending = true
                notice = result[string: "message"].isEmpty ? "Solicitarea de verificare a fost trimisă." : result[string: "message"]
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func promoteSeller() {
        error = ""
        notice = ""

        Task {
            do {
                _ = try await app.api.call("promote_seller")
                notice = "Contul tău este acum pregătit pentru vânzare."
                await load(showLoading: false)
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}

private struct AccountAction: Identifiable {
    let title: String
    let detail: String
    let icon: String
    let action: () -> Void
    var id: String { title }

    init(_ title: String, _ detail: String, _ icon: String, _ action: @escaping () -> Void) {
        self.title = title
        self.detail = detail
        self.icon = icon
        self.action = action
    }
}

struct CollectionView: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.dismiss) private var dismiss

    @State private var rows = [[String: JSONValue]]()
    @State private var error = ""
    @State private var edit: [String: JSONValue]?
    @State private var name = ""
    @State private var isLoading = true

    let kind: CollectionKind
    let open: (Route) -> Void
    let showsBack: Bool

    init(kind: CollectionKind, open: @escaping (Route) -> Void, showsBack: Bool = false) {
        self.kind = kind
        self.open = open
        self.showsBack = showsBack
    }

    var body: some View {
        AFScreen {
            VStack(spacing: 0) {
                if showsBack { compactHeader }

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 14) {
                        pageHeading

                        if !error.isEmpty { feedback(error) }

                        if isLoading {
                            ForEach(0..<3, id: \.self) { _ in AFSkeleton().frame(height: 106) }
                        } else if rows.isEmpty {
                            AFCard { AFEmptyState(icon: emptyIcon, title: emptyTitle, detail: emptyDetail) }
                        } else {
                            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                                rowView(row)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 18)
                }
                .refreshable { await load(showLoading: false) }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .task { await load() }
        .alert("Redenumește căutarea", isPresented: Binding(get: { edit != nil }, set: { if !$0 { edit = nil } })) {
            TextField("Nume", text: $name)
            Button("Salvează") {
                if let id = edit?[int: "id"] {
                    perform("update_saved_search", ["id": .number(Double(id)), "name": .string(name)])
                }
                edit = nil
            }
            Button("Renunță", role: .cancel) { edit = nil }
        }
    }

    private var compactHeader: some View {
        HStack(spacing: 12) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(AFTheme.ink)
                    .frame(width: 42, height: 42)
                    .background(AFTheme.paper)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(AFTheme.line))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(kind.title).font(.headline.weight(.bold)).foregroundStyle(AFTheme.ink)
                Text("AutoFans").font(.caption).foregroundStyle(AFTheme.muted)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) { Divider().opacity(0.5) }
    }

    private var pageHeading: some View {
        HStack(alignment: .top, spacing: 13) {
            Image(systemName: pageIcon)
                .font(.title3.weight(.bold))
                .foregroundStyle(AFTheme.gold)
                .frame(width: 48, height: 48)
                .background(AFTheme.paleGold.opacity(0.6))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                Text(kind.title)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(AFTheme.ink)
                Text(pageDetail)
                    .font(.subheadline)
                    .foregroundStyle(AFTheme.muted)
            }
            Spacer(minLength: 0)
        }
        .padding(.bottom, 3)
    }

    @ViewBuilder private func rowView(_ row: [String: JSONValue]) -> some View {
        switch kind {
        case .favorites:
            favoriteRow(row)
        case .saved:
            savedSearchRow(row)
        case .notifications:
            notificationRow(row)
        }
    }

    private func favoriteRow(_ row: [String: JSONValue]) -> some View {
        let listing = row["listings"]?.object ?? row["listings"]?.array?.first?.object
        let title = listing?[string: "title"] ?? "Anunț indisponibil"
        let price = listing?[string: "price"] ?? ""
        let currency = listing?[string: "currency"] ?? "EUR"
        let details = [listing?[string: "make"], listing?[string: "model"], listing?[string: "year"]]
            .compactMap { $0?.isEmpty == false ? $0 : nil }
            .joined(separator: " · ")

        return AFCard(padding: 12) {
            HStack(spacing: 13) {
                ZStack {
                    RoundedRectangle(cornerRadius: 15, style: .continuous).fill(AFTheme.graphite)
                    Image(systemName: "car.fill").font(.title3).foregroundStyle(AFTheme.paleGold)
                }
                .frame(width: 62, height: 74)

                VStack(alignment: .leading, spacing: 5) {
                    Text(title).font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.ink).lineLimit(2)
                    if !details.isEmpty { Text(details).font(.caption).foregroundStyle(AFTheme.muted).lineLimit(1) }
                    Text(price.isEmpty ? "Preț indisponibil" : "\(price) \(currency)")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(AFTheme.gold)
                }
                Spacer(minLength: 4)
                if let slug = listing?[string: "slug"], !slug.isEmpty {
                    Button { open(.listing(slug)) } label: {
                        Image(systemName: "arrow.up.right")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(AFTheme.ink)
                            .frame(width: 34, height: 34)
                            .background(AFTheme.ivory)
                            .clipShape(Circle())
                    }
                    .accessibilityLabel("Deschide anunțul")
                }
            }
        }
    }

    private func savedSearchRow(_ row: [String: JSONValue]) -> some View {
        AFCard {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "bookmark.fill")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(AFTheme.gold)
                    .frame(width: 40, height: 40)
                    .background(AFTheme.paleGold.opacity(0.6))
                    .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                VStack(alignment: .leading, spacing: 5) {
                    Text(row[string: "name"].isEmpty ? "Căutare salvată" : row[string: "name"])
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(AFTheme.ink)
                    Text(searchSummary(row["query"]?.object ?? [:]))
                        .font(.caption)
                        .foregroundStyle(AFTheme.muted)
                        .lineLimit(2)
                    HStack(spacing: 15) {
                        Button("Redenumește") { edit = row; name = row[string: "name"] }
                        Button("Șterge", role: .destructive) {
                            if let id = row[int: "id"] { perform("delete_saved_search", ["id": .number(Double(id))]) }
                        }
                    }
                    .font(.caption.weight(.bold))
                    .padding(.top, 2)
                }
            }
        }
    }

    private func notificationRow(_ row: [String: JSONValue]) -> some View {
        let unread = row["read_at"] == .null
        let id = row[int: "id"]

        return Button {
            if unread, let id { perform("read_notification", ["id": .number(Double(id))]) }
        } label: {
            AFCard(padding: 14) {
                HStack(alignment: .top, spacing: 12) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: notificationIcon(row[string: "type"]))
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(AFTheme.gold)
                            .frame(width: 42, height: 42)
                            .background(AFTheme.paleGold.opacity(0.6))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        if unread { Circle().fill(Color.red).frame(width: 9, height: 9).overlay(Circle().stroke(AFTheme.paper, lineWidth: 2)).offset(x: 3, y: -3) }
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(row[string: "title"].isEmpty ? "Actualizare AutoFans" : row[string: "title"])
                            .font(.subheadline.weight(unread ? .bold : .semibold))
                            .foregroundStyle(AFTheme.ink)
                            .lineLimit(2)
                        if !row[string: "body"].isEmpty {
                            Text(row[string: "body"])
                                .font(.caption)
                                .foregroundStyle(AFTheme.muted)
                                .lineLimit(3)
                        }
                        Text(displayDate(row[string: "created_at"]))
                            .font(.caption2)
                            .foregroundStyle(AFTheme.muted)
                    }
                    Spacer(minLength: 2)
                    if unread { Text("Nou").font(.caption2.weight(.bold)).foregroundStyle(AFTheme.gold) }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var pageIcon: String {
        switch kind { case .favorites: "heart.fill"; case .saved: "bookmark.fill"; case .notifications: "bell.fill" }
    }

    private var pageDetail: String {
        switch kind {
        case .favorites: "Mașinile pe care vrei să le urmărești."
        case .saved: "Filtrele și alertele tale de căutare."
        case .notifications: "Noutăți despre căutări, anunțuri și cont."
        }
    }

    private var emptyIcon: String { kind == .favorites ? "heart" : (kind == .saved ? "bookmark" : "bell") }
    private var emptyTitle: String { kind == .favorites ? "Nu ai favorite încă" : (kind == .saved ? "Nicio căutare salvată" : "Ești la zi") }
    private var emptyDetail: String {
        switch kind {
        case .favorites: "Apasă inima de pe un anunț ca să îl găsești rapid aici."
        case .saved: "Salvează o căutare din catalog pentru a primi alerte utile."
        case .notifications: "Când apar actualizări importante, le vei vedea aici."
        }
    }

    private func feedback(_ text: String) -> some View {
        HStack(spacing: 9) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(text).font(.footnote.weight(.medium))
        }
        .foregroundStyle(.red)
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.red.opacity(0.09))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func searchSummary(_ query: [String: JSONValue]) -> String {
        let values = [query[string: "q"], query[string: "city"], query[string: "make"], query[string: "model"]]
            .filter { !$0.isEmpty }
        return values.isEmpty ? "Căutare salvată pentru alerte noi" : values.joined(separator: " · ")
    }

    private func notificationIcon(_ type: String) -> String {
        if type.contains("message") { return "message.fill" }
        if type.contains("search") { return "magnifyingglass" }
        if type.contains("favorite") { return "heart.fill" }
        return "bell.fill"
    }

    private func displayDate(_ value: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: value) else { return "" }
        return date.formatted(date: .abbreviated, time: .shortened)
    }

    private func load(showLoading: Bool = true) async {
        if showLoading { isLoading = true }
        defer { if showLoading { isLoading = false } }
        do {
            rows = try await app.api.call(kind.operation)[kind.key]?.array?.compactMap(\.object) ?? []
            error = ""
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func perform(_ operation: String, _ payload: [String: JSONValue]) {
        Task {
            do {
                _ = try await app.api.call(operation, payload: payload)
                await load(showLoading: false)
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}

struct MessagesView: View {
    @EnvironmentObject private var app: AppContainer

    @State private var conversations = [[String: JSONValue]]()
    @State private var messages = [[String: JSONValue]]()
    @State private var activeID: Int?
    @State private var activeConversation = [String: JSONValue]()
    @State private var draft = ""
    @State private var error = ""
    @State private var isLoading = true
    @State private var sending = false

    var body: some View {
        AFScreen {
            VStack(spacing: 0) {
                if let activeID {
                    conversation(activeID)
                } else {
                    inbox
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .task {
            await loadConversations()
            await openRequestedConversationIfNeeded()
            updateChrome()
        }
        .onChange(of: activeID) { _, _ in updateChrome() }
        .onChange(of: app.requestedConversationID) { _, _ in
            Task { await openRequestedConversationIfNeeded() }
        }
        .onDisappear { app.isConversationOpen = false }
    }

    private var inbox: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Mesaje")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(AFTheme.ink)
                    Text("Discuțiile tale despre mașini, într-un singur loc.")
                        .font(.subheadline)
                        .foregroundStyle(AFTheme.muted)
                }
                .padding(.bottom, 3)

                if !error.isEmpty { feedback(error) }

                if isLoading {
                    ForEach(0..<4, id: \.self) { _ in AFSkeleton().frame(height: 82) }
                } else if conversations.isEmpty {
                    AFCard { AFEmptyState(icon: "message", title: "Nicio conversație încă", detail: "Contactează un vânzător direct din pagina unui anunț.") }
                } else {
                    ForEach(conversations.indices, id: \.self) { index in
                        conversationRow(conversations[index])
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
        }
        .refreshable { await loadConversations() }
    }

    private func conversationRow(_ item: [String: JSONValue]) -> some View {
        let listing = item["listing"]?.object ?? [:]
        let counterpart = item["counterpart"]?.object ?? [:]
        let lastMessage = item["last_message"]?.object ?? [:]
        let unread = item[int: "unread_count"] ?? 0

        return Button {
            openConversation(item)
        } label: {
            AFCard(padding: 13) {
                HStack(spacing: 12) {
                    conversationAvatar(name: counterpart[string: "display_name"], imageURL: counterpart[string: "avatar_url"])

                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 7) {
                            Text(counterpart[string: "display_name"].isEmpty ? "Utilizator AutoFans" : counterpart[string: "display_name"])
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(AFTheme.ink)
                                .lineLimit(1)
                            Spacer(minLength: 2)
                            Text(shortTime(lastMessage[string: "created_at"]))
                                .font(.caption2)
                                .foregroundStyle(AFTheme.muted)
                        }
                        Text(listing[string: "title"].isEmpty ? "Anunțul #\(item[string: "listing_id"])" : listing[string: "title"])
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(AFTheme.gold)
                            .lineLimit(1)
                        Text(lastMessage[string: "body"].isEmpty ? "Apasă pentru a începe conversația" : lastMessage[string: "body"])
                            .font(.caption)
                            .foregroundStyle(AFTheme.muted)
                            .lineLimit(1)
                    }

                    if unread > 0 {
                        Text(unread > 9 ? "9+" : "\(unread)")
                            .font(.caption2.bold())
                            .foregroundStyle(.white)
                            .frame(minWidth: 21, minHeight: 21)
                            .background(Color.red)
                            .clipShape(Circle())
                    } else {
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(AFTheme.muted)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func conversation(_ id: Int) -> some View {
        VStack(spacing: 0) {
            conversationHeader

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 11) {
                        if !error.isEmpty { feedback(error) }
                        if messages.isEmpty && error.isEmpty {
                            VStack(spacing: 10) {
                                Image(systemName: "message.fill").font(.title2).foregroundStyle(AFTheme.gold)
                                Text("Începe conversația")
                                    .font(.headline.weight(.bold))
                                    .foregroundStyle(AFTheme.ink)
                                Text("Trimite un mesaj despre această mașină.")
                                    .font(.subheadline)
                                    .foregroundStyle(AFTheme.muted)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 68)
                        }

                        ForEach(messages.indices, id: \.self) { index in
                            messageBubble(messages[index])
                                .id(messages[index][int: "id"] ?? index)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 18)
                }
                .onChange(of: messages.count) { _, _ in
                    guard let last = messages.last else { return }
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo(last[int: "id"] ?? messages.count - 1, anchor: .bottom)
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            messageComposer(id)
        }
    }

    private var conversationHeader: some View {
        let counterpart = activeConversation["counterpart"]?.object ?? [:]
        let listing = activeConversation["listing"]?.object ?? [:]

        return HStack(spacing: 11) {
            Button { returnToInbox() } label: {
                Image(systemName: "chevron.left")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(AFTheme.ink)
                    .frame(width: 40, height: 40)
                    .background(AFTheme.paper)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(AFTheme.line))
            }
            .accessibilityLabel("Înapoi la mesaje")

            conversationAvatar(name: counterpart[string: "display_name"], imageURL: counterpart[string: "avatar_url"])
                .frame(width: 38, height: 38)

            VStack(alignment: .leading, spacing: 2) {
                Text(counterpart[string: "display_name"].isEmpty ? "Conversație" : counterpart[string: "display_name"])
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(AFTheme.ink)
                    .lineLimit(1)
                Text(listing[string: "title"].isEmpty ? "Mesaje despre anunț" : listing[string: "title"])
                    .font(.caption)
                    .foregroundStyle(AFTheme.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) { Divider().opacity(0.5) }
    }

    private func messageBubble(_ message: [String: JSONValue]) -> some View {
        let isMine = message[string: "sender_id"] == app.auth.session?.user.id

        return HStack(alignment: .bottom, spacing: 7) {
            if isMine { Spacer(minLength: 42) }
            VStack(alignment: isMine ? .trailing : .leading, spacing: 4) {
                Text(message[string: "body"])
                    .font(.subheadline)
                    .foregroundStyle(isMine ? .white : AFTheme.ink)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(isMine ? AFTheme.graphite : AFTheme.paper)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay {
                        if !isMine { RoundedRectangle(cornerRadius: 18).stroke(AFTheme.line) }
                    }
                Text(shortTime(message[string: "created_at"]))
                    .font(.caption2)
                    .foregroundStyle(AFTheme.muted)
            }
            if !isMine { Spacer(minLength: 42) }
        }
    }

    private func messageComposer(_ id: Int) -> some View {
        HStack(spacing: 10) {
            TextField("Scrie un mesaj…", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 15)
                .padding(.vertical, 11)
                .background(AFTheme.paper)
                .clipShape(RoundedRectangle(cornerRadius: 19, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 19).stroke(AFTheme.line))

            Button { send(id) } label: {
                ZStack {
                    Circle().fill(AFTheme.gold)
                    if sending {
                        ProgressView().tint(AFTheme.graphite).scaleEffect(0.72)
                    } else {
                        Image(systemName: "arrow.up")
                            .font(.headline.bold())
                            .foregroundStyle(AFTheme.graphite)
                    }
                }
                .frame(width: 47, height: 47)
            }
            .disabled(draft.trimmed == nil || sending)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) { Divider().opacity(0.5) }
    }

    private func conversationAvatar(name: String, imageURL: String) -> some View {
        ZStack {
            Circle().fill(AFTheme.paleGold)
            if let url = URL(string: imageURL), !imageURL.isEmpty {
                AsyncImage(url: url) { phase in
                    if let image = phase.image { image.resizable().scaledToFill() }
                    else { avatarInitials(name) }
                }
                .clipShape(Circle())
            } else {
                avatarInitials(name)
            }
        }
        .frame(width: 46, height: 46)
        .clipShape(Circle())
    }

    private func avatarInitials(_ name: String) -> some View {
        Text(String(name.split(separator: " ").prefix(2).compactMap(\.first)).uppercased().isEmpty ? "AF" : String(name.split(separator: " ").prefix(2).compactMap(\.first)).uppercased())
            .font(.caption.weight(.bold))
            .foregroundStyle(AFTheme.graphite)
    }

    private func feedback(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(text).font(.footnote.weight(.medium))
        }
        .foregroundStyle(.red)
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.red.opacity(0.09))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func shortTime(_ value: String) -> String {
        guard let date = ISO8601DateFormatter().date(from: value) else { return "" }
        return date.formatted(date: .omitted, time: .shortened)
    }

    private func updateChrome() {
        app.isConversationOpen = activeID != nil
    }

    private func openConversation(_ conversation: [String: JSONValue]) {
        guard let id = conversation[int: "id"] else { return }
        activeConversation = conversation
        activeID = id
        error = ""
        Task { await loadMessages(id) }
    }

    private func returnToInbox() {
        activeID = nil
        activeConversation = [:]
        messages = []
        error = ""
        Task { await loadConversations() }
    }

    private func loadConversations() async {
        isLoading = true
        defer { isLoading = false }
        do {
            conversations = try await app.api.call("conversations")["conversations"]?.array?.compactMap(\.object) ?? []
            error = ""
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func loadMessages(_ id: Int) async {
        do {
            messages = try await app.api.call("messages", payload: ["conversationId": .number(Double(id))])["messages"]?.array?.compactMap(\.object) ?? []
            _ = try? await app.api.call("mark_conversation_read", payload: ["conversationId": .number(Double(id))])
            error = ""
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func send(_ id: Int) {
        guard let text = draft.trimmed, !sending else { return }
        sending = true
        error = ""

        Task {
            defer { sending = false }
            do {
                _ = try await app.api.call("send_message", payload: ["conversationId": .number(Double(id)), "message": .string(text)])
                draft = ""
                await loadMessages(id)
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func openRequestedConversationIfNeeded() async {
        guard let id = app.requestedConversationID else { return }
        app.requestedConversationID = nil
        activeConversation = conversations.first(where: { $0[int: "id"] == id }) ?? [:]
        activeID = id
        await loadMessages(id)
    }
}
