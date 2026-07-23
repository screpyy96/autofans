import SwiftUI

@MainActor
final class ListingDetailModel: ObservableObject {
    @Published var listing: Listing?
    @Published var error: String?
    @Published var isLoading = true
    @Published var message = ""
    @Published var favorite = false
    @Published var sellerName: String?
    @Published var sellerPhone: String?
}

struct ListingDetailView: View {
    @EnvironmentObject private var app: AppContainer
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model = ListingDetailModel()
    @State private var showContactSheet = false
    let slug: String
    let open: (Route) -> Void

    var body: some View {
        AFScreen {
            Group {
                if model.isLoading {
                    loading
                } else if let listing = model.listing {
                    content(listing)
                } else {
                    unavailable
                }
            }
            .navigationBarBackButtonHidden()
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.headline.bold())
                            .foregroundStyle(AFTheme.ink)
                            .frame(width: 38, height: 38)
                            .background(AFTheme.paper)
                            .clipShape(Circle())
                            .shadow(color: AFTheme.cardShadow, radius: 5, y: 2)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    if let listing = model.listing {
                        let isFav = app.favoriteIDs.contains(listing.id)
                        Button {
                            guarded {
                                let nowFav = try await app.toggleFavorite(listing.id)
                                model.message = nowFav ? "Adăugat la favorite" : "Eliminat din favorite"
                            }
                        } label: {
                            Image(systemName: isFav ? "heart.fill" : "heart")
                                .font(.headline)
                                .foregroundStyle(isFav ? Color.red : AFTheme.ink)
                                .frame(width: 38, height: 38)
                                .background(AFTheme.paper)
                                .clipShape(Circle())
                                .shadow(color: AFTheme.cardShadow, radius: 5, y: 2)
                        }
                    }
                }
            }
            .sheet(isPresented: $showContactSheet) {
                if let listing = model.listing {
                    ContactSellerSheetView(
                        sellerName: model.sellerName,
                        phone: model.sellerPhone,
                        onAppMessage: {
                            guarded {
                                _ = try await app.api.call("start_conversation", payload: ["listingId": .number(Double(listing.id)), "message": .string("Bună! Sunt interesat de acest anunț.")])
                                try? await app.api.recordListingContact(listingID: listing.id, contactType: "message")
                                open(.messages)
                            }
                        },
                        onPhoneContact: {
                            Task { try? await app.api.recordListingContact(listingID: listing.id, contactType: "phone") }
                        },
                        onWhatsAppContact: {
                            Task { try? await app.api.recordListingContact(listingID: listing.id, contactType: "whatsapp") }
                        }
                    )
                    .presentationDetents([.height(380)])
                    .presentationCornerRadius(28)
                }
            }
            .task { await load() }
        }
    }

    private var loading: some View {
        ScrollView {
            VStack(spacing: 16) {
                AFSkeleton().frame(height: 310)
                AFSkeleton().frame(height: 170)
                AFSkeleton().frame(height: 220)
            }
            .padding(20)
        }
    }

    private var unavailable: some View {
        VStack {
            Spacer()
            AFCard {
                AFEmptyState(icon: "car.rear.waves.up", title: "Anunț indisponibil", detail: model.error ?? "Este posibil ca anunțul să nu mai fie publicat.")
            }
            Spacer()
        }
        .padding(20)
    }

    private func content(_ listing: Listing) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                gallery(listing)
                VStack(alignment: .leading, spacing: 18) {
                    identity(listing)
                    AFCard { SpecsGrid(listing: listing) }
                    seller(listing)
                    if let description = listing.description, !description.isEmpty {
                        detailSection("Descriere") {
                            Text(description)
                                .font(.body)
                                .foregroundStyle(AFTheme.muted)
                                .lineSpacing(5)
                        }
                    }
                    if let features = listing.features, !features.isEmpty {
                        detailSection("Dotări") {
                            FlowTags(values: features)
                        }
                    }
                    Button("Raportează acest anunț") {
                        guarded {
                            _ = try await app.api.call("report_listing", payload: ["listingId": .number(Double(listing.id)), "reason": .string("other"), "details": .string("Raport trimis din aplicația iOS")])
                            model.message = "Mulțumim. Raportul a fost trimis."
                        }
                    }
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(.red.opacity(0.8))
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 88)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            actionBar(listing)
        }
        .overlay(alignment: .top) {
            if !model.message.isEmpty {
                Text(model.message)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(AFTheme.ink)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(AFTheme.paleGold)
                    .clipShape(Capsule())
                    .padding(.top, 6)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

    private func gallery(_ listing: Listing) -> some View {
        TabView {
            if listing.images.isEmpty {
                AFBrandImage(name: "hero_car", ext: "png")
                    .frame(maxWidth: .infinity)
                    .background(AFTheme.paleGold)
            } else {
                ForEach(listing.images) { image in
                    AsyncImage(url: image.url) {
                        $0.resizable().scaledToFill()
                    } placeholder: {
                        AFSkeleton()
                    }
                    .frame(maxWidth: .infinity)
                    .clipped()
                }
            }
        }
        .frame(height: 320)
        .tabViewStyle(.page(indexDisplayMode: .automatic))
        .overlay(alignment: .bottomTrailing) {
            Text("\(max(1, listing.images.count)) fotografii")
                .font(.caption.weight(.bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 11)
                .padding(.vertical, 7)
                .background(.black.opacity(0.58))
                .clipShape(Capsule())
                .padding(14)
        }
    }

    private func identity(_ listing: Listing) -> some View {
        let isFav = app.favoriteIDs.contains(listing.id)
        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(listing.title)
                        .font(.system(size: 27, weight: .bold, design: .rounded))
                        .foregroundStyle(AFTheme.ink)
                    if !listing.location.isEmpty {
                        Label(listing.location, systemImage: "mappin.and.ellipse")
                            .font(.subheadline)
                            .foregroundStyle(AFTheme.muted)
                    }
                }
                Spacer()
                Button {
                    guarded {
                        let nowFav = try await app.toggleFavorite(listing.id)
                        model.message = nowFav ? "Adăugat la favorite" : "Eliminat din favorite"
                    }
                } label: {
                    Image(systemName: isFav ? "heart.fill" : "heart")
                        .font(.title3)
                        .foregroundStyle(isFav ? Color.red : AFTheme.ink)
                        .frame(width: 45, height: 45)
                        .background(AFTheme.paper)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(AFTheme.line))
                }
            }
            Text(listing.priceText)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(AFTheme.gold)
            Text(listing.details)
                .font(.subheadline)
                .foregroundStyle(AFTheme.muted)
        }
    }

    private func seller(_ listing: Listing) -> some View {
        AFCard {
            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 42))
                    .foregroundStyle(AFTheme.gold)
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.sellerName ?? "Vânzător AutoFans")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(AFTheme.ink)
                    if let phone = model.sellerPhone, !phone.isEmpty {
                        Text("📞 \(phone)")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(AFTheme.gold)
                    } else {
                        Text("Verifică profilul și recenziile înainte de contact.")
                            .font(.caption)
                            .foregroundStyle(AFTheme.muted)
                    }
                }
                Spacer()
                if let id = listing.ownerID {
                    Button("Profil") { open(.seller(id)) }
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(AFTheme.gold)
                }
            }
        }
    }

    private func actionBar(_ listing: Listing) -> some View {
        HStack(spacing: 10) {
            Button {
                app.toggleCompare(listing)
                model.message = app.compared.contains(where: { $0.id == listing.id }) ? "Adăugat la comparare" : "Eliminat din comparare"
            } label: {
                Image(systemName: "rectangle.2.swap")
                    .font(.headline)
                    .foregroundStyle(app.compared.contains(where: { $0.id == listing.id }) ? AFTheme.gold : AFTheme.ink)
                    .frame(width: 51, height: 51)
                    .background(AFTheme.paper)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(app.compared.contains(where: { $0.id == listing.id }) ? AFTheme.gold : AFTheme.line))
            }

            Button {
                showContactSheet = true
            } label: {
                Label("Contactează vânzătorul", systemImage: "phone.and.waveform.fill")
            }
            .buttonStyle(AFPrimaryButton())
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 11)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) { Divider().opacity(0.45) }
    }

    private func detailSection<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        AFCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(AFTheme.ink)
                content()
            }
        }
    }

    private func guarded(_ action: @escaping () async throws -> Void) {
        guard auth.session != nil else { open(.login); return }
        Task {
            do {
                try await action()
            } catch {
                model.message = error.localizedDescription
            }
        }
    }

    private func load() async {
        model.isLoading = true
        defer { model.isLoading = false }
        do {
            model.listing = try await app.repository.listing(slug: slug)
            if let listing = model.listing, app.auth.session?.user.id != listing.ownerID {
                try? await app.api.recordListingView(listingID: listing.id)
            }
            if let ownerID = model.listing?.ownerID {
                let res = try? await app.api.call("seller_profile", payload: ["sellerId": .string(ownerID)])
                if let profile = res?["profile"]?.object {
                    let name = profile[string: "display_name"].trimmed
                    let phone = profile[string: "phone"].trimmed
                    if let name, !name.isEmpty { model.sellerName = name }
                    if let phone, !phone.isEmpty { model.sellerPhone = phone }
                }
            }
        } catch {
            model.error = error.localizedDescription
        }
    }
}

struct SpecsGrid: View {
    let listing: Listing
    var body: some View {
        let values = [
            ("calendar", "An", listing.year.map(String.init)),
            ("gauge.with.dots.needle.50percent", "Kilometraj", listing.mileage.map { "\($0.formatted(.number.grouping(.automatic))) km" }),
            ("fuelpump", "Combustibil", listing.fuelType),
            ("gearshape.2", "Cutie", listing.transmission),
            ("car", "Caroserie", listing.bodyType),
            ("bolt", "Putere", listing.power.map { "\($0) CP" })
        ].compactMap { icon, label, value -> (String, String, String)? in
            value.map { (icon, label, $0) }
        }
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            ForEach(values, id: \.1) { icon, label, value in
                HStack(spacing: 9) {
                    Image(systemName: icon)
                        .foregroundStyle(AFTheme.gold)
                        .frame(width: 19)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(label)
                            .font(.caption)
                            .foregroundStyle(AFTheme.muted)
                        Text(value)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(AFTheme.ink)
                            .lineLimit(1)
                    }
                    Spacer()
                }
                .padding(10)
                .background(AFTheme.ivory)
                .clipShape(RoundedRectangle(cornerRadius: 13))
            }
        }
    }
}

struct FlowTags: View {
    let values: [String]
    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 108), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(values, id: \.self) { text in
                Text(text)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(AFTheme.ink)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 8)
                    .background(AFTheme.ivory)
                    .clipShape(Capsule())
            }
        }
    }
}

struct CompareView: View {
    @EnvironmentObject private var app: AppContainer
    var body: some View {
        AFScreen {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Compară mașini")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(AFTheme.ink)
                    Text("Păstrează până la trei anunțuri ca să alegi informat.")
                        .foregroundStyle(AFTheme.muted)
                    if app.compared.isEmpty {
                        AFCard {
                            AFEmptyState(icon: "rectangle.2.swap", title: "Nu ai selectat anunțuri", detail: "Din pagina unui anunț apasă Compară.")
                        }
                    } else {
                        ForEach(app.compared) { listing in
                            ListingCard(listing: listing)
                        }
                    }
                }
                .padding(20)
            }
        }
        .navigationTitle("Compară")
    }
}

struct ContactSellerSheetView: View {
    @Environment(\.dismiss) private var dismiss
    let sellerName: String?
    let phone: String?
    let onAppMessage: () -> Void
    let onPhoneContact: () -> Void
    let onWhatsAppContact: () -> Void

    private var cleanPhone: String? {
        guard let phone = phone, !phone.isEmpty else { return nil }
        let digits = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        if digits.hasPrefix("0") {
            return "4" + digits
        }
        return digits
    }

    var body: some View {
        VStack(spacing: 18) {
            Capsule()
                .fill(AFTheme.line)
                .frame(width: 36, height: 5)
                .padding(.top, 10)

            VStack(spacing: 4) {
                Text("Contactează Vânzătorul")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(AFTheme.ink)
                Text(sellerName ?? "Membru AutoFans")
                    .font(.subheadline)
                    .foregroundStyle(AFTheme.muted)
            }

            VStack(spacing: 10) {
                // 1. App Chat
                Button {
                    dismiss()
                    onAppMessage()
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: "message.fill")
                            .font(.title3)
                            .foregroundStyle(AFTheme.ink)
                            .frame(width: 42, height: 42)
                            .background(AFTheme.paleGold)
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Chat în aplicație")
                                .font(.headline.bold())
                                .foregroundStyle(AFTheme.ink)
                            Text("Trimite un mesaj securizat pe AutoFans")
                                .font(.caption)
                                .foregroundStyle(AFTheme.muted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption.bold())
                            .foregroundStyle(AFTheme.muted)
                    }
                    .padding(12)
                    .background(AFTheme.paper)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(AFTheme.line))
                }
                .buttonStyle(.plain)

                if let rawPhone = phone, let formattedNumber = cleanPhone, !rawPhone.isEmpty {
                    // 2. Phone Call
                    Button {
                        onPhoneContact()
                        if let url = URL(string: "tel://\(rawPhone)"), UIApplication.shared.canOpenURL(url) {
                            UIApplication.shared.open(url)
                        }
                        dismiss()
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: "phone.fill")
                                .font(.title3)
                                .foregroundStyle(.white)
                                .frame(width: 42, height: 42)
                                .background(Color.green)
                                .clipShape(Circle())
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Apel Telefonic")
                                    .font(.headline.bold())
                                    .foregroundStyle(AFTheme.ink)
                                Text(rawPhone)
                                    .font(.caption.bold())
                                    .foregroundStyle(AFTheme.gold)
                            }
                            Spacer()
                            Image(systemName: "arrow.up.forward")
                                .font(.caption.bold())
                                .foregroundStyle(AFTheme.muted)
                        }
                        .padding(12)
                        .background(AFTheme.paper)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(AFTheme.line))
                    }
                    .buttonStyle(.plain)

                    // 3. WhatsApp
                    Button {
                        onWhatsAppContact()
                        let waURL = "https://wa.me/\(formattedNumber)"
                        if let url = URL(string: waURL), UIApplication.shared.canOpenURL(url) {
                            UIApplication.shared.open(url)
                        } else if let webWA = URL(string: "https://api.whatsapp.com/send?phone=\(formattedNumber)") {
                            UIApplication.shared.open(webWA)
                        }
                        dismiss()
                    } label: {
                        HStack(spacing: 14) {
                            Image(systemName: "message.circle.fill")
                                .font(.title3)
                                .foregroundStyle(.white)
                                .frame(width: 42, height: 42)
                                .background(Color.green.opacity(0.85))
                                .clipShape(Circle())
                            VStack(alignment: .leading, spacing: 2) {
                                Text("WhatsApp")
                                    .font(.headline.bold())
                                    .foregroundStyle(AFTheme.ink)
                                Text("Deschide conversația în WhatsApp")
                                    .font(.caption)
                                    .foregroundStyle(AFTheme.muted)
                            }
                            Spacer()
                            Image(systemName: "arrow.up.forward")
                                .font(.caption.bold())
                                .foregroundStyle(AFTheme.muted)
                        }
                        .padding(12)
                        .background(AFTheme.paper)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(AFTheme.line))
                    }
                    .buttonStyle(.plain)
                }
            }

            Spacer(minLength: 0)
        }
        .padding(20)
        .background(AFTheme.ivory.ignoresSafeArea())
    }
}
