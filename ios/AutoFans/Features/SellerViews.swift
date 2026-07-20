import SwiftUI
import PhotosUI

struct SellerEntryView: View {
    @EnvironmentObject private var app: AppContainer
    @State private var profile = [String: JSONValue]()
    @State private var loading = true
    @State private var message = ""
    let open: (Route) -> Void
    var body: some View { AFScreen { ScrollView { VStack(alignment: .leading, spacing: 20) { Text("Vinde cu AutoFans").font(.system(size: 31, weight: .bold, design: .rounded)).foregroundStyle(AFTheme.ink); Text("Anunțurile, fotografiile și conversațiile tale — într-un singur loc.").foregroundStyle(AFTheme.muted)
        ZStack(alignment: .bottomLeading) { AFBrandImage(name: "card_selling", ext: "jpg").frame(height: 210).clipped().overlay(LinearGradient(colors: [.clear, AFTheme.graphite.opacity(0.77)], startPoint: .top, endPoint: .bottom)); VStack(alignment: .leading, spacing: 5) { Text(profile[string: "role"] == "seller" ? "Spațiul tău de vânzare" : "Pregătit să vinzi?").font(.title2.weight(.bold)).foregroundStyle(.white); Text(profile[string: "role"] == "seller" ? "Gestionează-ți stocul cu ușurință." : "Creează un profil de seller în câteva secunde.").font(.subheadline).foregroundStyle(.white.opacity(0.78)) }.padding(18) }.clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
        if loading { AFSkeleton().frame(height: 160) }
        else if profile[string: "role"] == "seller" { sellerActions }
        else { buyerUpgrade }
        if !message.isEmpty { Text(message).font(.footnote.weight(.semibold)).foregroundStyle(AFTheme.muted).frame(maxWidth: .infinity) }
    }.padding(20) } }.toolbar(.hidden, for: .navigationBar).task { await load() } }
    private var sellerActions: some View { VStack(spacing: 12) { AFCard { VStack(alignment: .leading, spacing: 10) { Label(profile[bool: "is_verified"] ? "Vânzător verificat" : "Profil de seller", systemImage: profile[bool: "is_verified"] ? "checkmark.seal.fill" : "person.crop.circle.badge.plus").font(.headline.weight(.bold)).foregroundStyle(profile[bool: "is_verified"] ? .green : AFTheme.ink); Text(profile[bool: "is_verified"] ? "Profilul tău inspiră încredere." : "Solicită verificarea pentru mai multă încredere.").font(.subheadline).foregroundStyle(AFTheme.muted); if !profile[bool: "is_verified"] { Button("Solicită verificarea") { call("request_seller_verification") }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.gold) } } }; Button { open(.listingEditor(nil)) } label: { Label("Publică un anunț nou", systemImage: "plus") }.buttonStyle(AFGoldButton()); HStack(spacing: 12) { Button("Anunțurile mele") { open(.sellerListings) }.buttonStyle(AFPrimaryButton()); Button("Dashboard") { open(.sellerDashboard) }.buttonStyle(AFPrimaryButton()) } } }
    private var buyerUpgrade: some View { AFCard { VStack(alignment: .leading, spacing: 14) { Text("Transformă-ți contul în seller").font(.title3.weight(.bold)).foregroundStyle(AFTheme.ink); Text("Publică anunțuri, încarcă fotografii și răspunde cumpărătorilor din aplicație.").font(.subheadline).foregroundStyle(AFTheme.muted); Button("Devino vânzător") { call("promote_seller") }.buttonStyle(AFGoldButton()) } } }
    private func load() async { defer { loading = false }; do { profile = try await app.api.call("account")["profile"]?.object ?? [:] } catch { message = error.localizedDescription } }
    private func call(_ operation: String) { Task { do { _ = try await app.api.call(operation); message = operation == "promote_seller" ? "Contul tău este acum seller." : "Solicitarea a fost trimisă."; await load() } catch { message = error.localizedDescription } } }
}

struct SellerListingsView: View {
    @EnvironmentObject private var app: AppContainer
    @State private var listings = [[String: JSONValue]]()
    @State private var error = ""
    let open: (Route) -> Void
    var body: some View { List { if !error.isEmpty { Text(error).foregroundStyle(.red) }; ForEach(Array(listings.enumerated()), id: \.offset) { _, listing in VStack(alignment: .leading, spacing: 6) { Text(listing[string: "title"]).font(.headline); Text("\(listing[string: "price"]) \(listing[string: "currency"])").foregroundStyle(.blue); Text(listing[string: "status"]).font(.footnote).foregroundStyle(.secondary); HStack { if let id = listing[int: "id"] { Button("Editează") { open(.listingEditor(id)) }; Button(listing[string: "status"] == "draft" ? "Publică" : "Draft") { updateStatus(id, listing[string: "status"] == "draft" ? "published" : "draft") }; Button("Șterge", role: .destructive) { delete(id) } } } } } }.navigationTitle("Anunțurile mele").task { await load() }.refreshable { await load() } }
    private func load() async { do { listings = try await app.api.call("seller_listings")["listings"]?.array?.compactMap(\.object) ?? [] } catch { self.error = error.localizedDescription } }
    private func updateStatus(_ id: Int, _ status: String) { Task { do { _ = try await app.api.call("set_listing_status", payload: ["id": .number(Double(id)), "status": .string(status)]); await load() } catch { self.error = error.localizedDescription } } }
    private func delete(_ id: Int) { Task { do { _ = try await app.api.call("delete_listing", payload: ["id": .number(Double(id))]); await load() } catch { self.error = error.localizedDescription } } }
}

struct ListingEditorView: View {
    @EnvironmentObject private var app: AppContainer
    @Environment(\.dismiss) private var dismiss

    let id: Int?
    let open: ((Route) -> Void)?

    @State private var step = 0
    @State private var title = ""
    @State private var description = ""
    @State private var make = ""
    @State private var model = ""
    @State private var year = ""
    @State private var mileage = ""
    @State private var price = ""
    @State private var city = ""
    @State private var county = ""
    @State private var fuel = "petrol"
    @State private var transmission = "manual"
    @State private var vin = ""
    @State private var bodyType = ""
    @State private var engineSize = ""
    @State private var power = ""
    @State private var doors = ""
    @State private var seats = ""
    @State private var owners = ""
    @State private var features = ""
    @State private var serviceHistory = false
    @State private var images = [String]()
    @State private var pickerItems = [PhotosPickerItem]()
    @State private var message = ""
    @State private var saving = false
    @State private var uploadingPhotos = false
    @State private var publishedSlug: String?

    init(id: Int?, open: ((Route) -> Void)? = nil) {
        self.id = id
        self.open = open
    }

    var body: some View {
        AFScreen {
            if let slug = publishedSlug {
                publicationSuccess(slug)
            } else {
                editor
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .task { await load() }
        .onChange(of: pickerItems) { _, items in
            Task { await upload(items) }
        }
    }

    private var editor: some View {
        VStack(spacing: 0) {
            editorHeader

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 20) {
                    editorProgress
                    currentStepContent

                    if !message.isEmpty {
                        editorMessage(message)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                .padding(.bottom, 22)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            bottomActions
        }
    }

    private var editorHeader: some View {
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
            .accessibilityLabel("Înapoi")

            VStack(alignment: .leading, spacing: 2) {
                Text(id == nil ? "Publică un anunț" : "Editează anunțul")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(AFTheme.ink)
                Text("Pasul \(step + 1) din \(ListingEditorStep.allCases.count)")
                    .font(.caption)
                    .foregroundStyle(AFTheme.muted)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 11)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) { Divider().opacity(0.5) }
    }

    private var editorProgress: some View {
        VStack(spacing: 9) {
            ProgressView(value: Double(step + 1), total: Double(ListingEditorStep.allCases.count))
                .tint(AFTheme.gold)
                .scaleEffect(y: 1.5)

            HStack {
                ForEach(Array(ListingEditorStep.allCases.enumerated()), id: \.element.rawValue) { index, item in
                    Text(item.rawValue)
                        .font(.caption2.weight(index == step ? .bold : .medium))
                        .foregroundStyle(index <= step ? AFTheme.ink : AFTheme.muted.opacity(0.75))
                    if index < ListingEditorStep.allCases.count - 1 { Spacer(minLength: 4) }
                }
            }
        }
    }

    @ViewBuilder private var currentStepContent: some View {
        switch step {
        case 0: detailsStep
        case 1: specificationsStep
        case 2: photosStep
        default: reviewStep
        }
    }

    private var detailsStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeading("Spune-ne despre mașină", "Începem cu detaliile pe care cumpărătorii le văd prima dată.")

            editorField("Titlul anunțului", text: $title)
            HStack(spacing: 11) {
                editorField("Marcă", text: $make)
                editorField("Model", text: $model)
            }
            HStack(spacing: 11) {
                editorField("An fabricație", text: $year, keyboard: .numberPad)
                editorField("Kilometraj", text: $mileage, keyboard: .numberPad, suffix: "km")
            }
            editorField("Preț", text: $price, keyboard: .decimalPad, suffix: "EUR")
            HStack(spacing: 11) {
                editorField("Oraș", text: $city)
                editorField("Județ", text: $county)
            }
        }
    }

    private var specificationsStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeading("Specificații", "Detaliile complete inspiră încredere și îți fac anunțul mai ușor de găsit.")

            HStack(spacing: 11) {
                Menu {
                    ForEach(FuelChoice.allCases) { choice in
                        Button(choice.title) { fuel = choice.id }
                    }
                } label: {
                    selectionField("Combustibil", value: FuelChoice.title(for: fuel))
                }

                Menu {
                    ForEach(TransmissionChoice.allCases) { choice in
                        Button(choice.title) { transmission = choice.id }
                    }
                } label: {
                    selectionField("Transmisie", value: TransmissionChoice.title(for: transmission))
                }
            }

            HStack(spacing: 11) {
                editorField("Caroserie", text: $bodyType)
                editorField("Motor", text: $engineSize, keyboard: .decimalPad, suffix: "L")
            }
            HStack(spacing: 11) {
                editorField("Putere", text: $power, keyboard: .numberPad, suffix: "CP")
                editorField("Proprietari", text: $owners, keyboard: .numberPad)
            }
            HStack(spacing: 11) {
                editorField("Uși", text: $doors, keyboard: .numberPad)
                editorField("Locuri", text: $seats, keyboard: .numberPad)
            }

            Toggle(isOn: $serviceHistory) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Istoric de service disponibil").font(.subheadline.weight(.bold))
                    Text("Marchează dacă ai documentele de întreținere.").font(.caption).foregroundStyle(AFTheme.muted)
                }
            }
            .tint(AFTheme.gold)
            .padding(15)
            .background(AFTheme.paper)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(AFTheme.line))
        }
    }

    private var photosStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeading("Fotografii și poveste", "Adaugă fotografii luminoase; prima va deveni fotografia principală a anunțului.")

            PhotosPicker(selection: $pickerItems, maxSelectionCount: max(0, 15 - images.count), matching: .images) {
                HStack(spacing: 11) {
                    Image(systemName: uploadingPhotos ? "arrow.triangle.2.circlepath" : "photo.badge.plus")
                        .font(.title3.weight(.semibold))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(uploadingPhotos ? "Se încarcă fotografiile…" : "Adaugă fotografii")
                            .font(.subheadline.weight(.bold))
                        Text("\(images.count) din 15 încărcate")
                            .font(.caption)
                            .opacity(0.75)
                    }
                    Spacer()
                    Image(systemName: "plus.circle.fill").font(.title2)
                }
                .foregroundStyle(AFTheme.graphite)
                .padding(16)
                .frame(maxWidth: .infinity)
                .background(AFTheme.paleGold.opacity(0.55))
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
            .disabled(uploadingPhotos || images.count >= 15)

            if !images.isEmpty {
                AFCard(padding: 8) {
                    VStack(spacing: 0) {
                        ForEach(images.indices, id: \.self) { index in
                            HStack(spacing: 11) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 10, style: .continuous).fill(AFTheme.graphite)
                                    Image(systemName: index == 0 ? "star.fill" : "photo.fill")
                                        .font(.caption)
                                        .foregroundStyle(index == 0 ? AFTheme.gold : .white.opacity(0.85))
                                }
                                .frame(width: 40, height: 40)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(index == 0 ? "Fotografie principală" : "Fotografia \(index + 1)")
                                        .font(.subheadline.weight(.bold))
                                        .foregroundStyle(AFTheme.ink)
                                    Text(index == 0 ? "Va apărea prima în anunț" : "Poți reordona fotografiile")
                                        .font(.caption)
                                        .foregroundStyle(AFTheme.muted)
                                }
                                Spacer(minLength: 4)
                                Button { move(index, index - 1) } label: {
                                    Image(systemName: "arrow.up").font(.caption.weight(.bold))
                                }
                                .disabled(index == 0)
                                Button { move(index, index + 1) } label: {
                                    Image(systemName: "arrow.down").font(.caption.weight(.bold))
                                }
                                .disabled(index == images.count - 1)
                                Button(role: .destructive) { images.remove(at: index) } label: {
                                    Image(systemName: "trash").font(.caption.weight(.bold))
                                }
                            }
                            .padding(10)

                            if index < images.count - 1 { Divider().padding(.leading, 50) }
                        }
                    }
                }
            }

            editorTextArea("Descrierea anunțului", hint: "Spune povestea mașinii: starea, istoricul și ce o face specială. Minimum 50 de caractere.", text: $description, minimumHeight: 145)
            editorField("VIN (opțional)", text: $vin)
            editorTextArea("Dotări", hint: "Separate prin virgulă: navigație, cameră, încălzire în scaune…", text: $features, minimumHeight: 90)
        }
    }

    private var reviewStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            stepHeading("Gata de publicare", "Verifică rezumatul înainte ca anunțul să devină vizibil cumpărătorilor.")

            ZStack(alignment: .bottomLeading) {
                LinearGradient(colors: [Color(red: 0.06, green: 0.15, blue: 0.31), AFTheme.graphite], startPoint: .topLeading, endPoint: .bottomTrailing)
                Circle().fill(AFTheme.gold.opacity(0.18)).frame(width: 190, height: 190).offset(x: 185, y: -80)
                VStack(alignment: .leading, spacing: 8) {
                    Text(title.isEmpty ? "Anunț fără titlu" : title)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(.white)
                    Text("\(make.isEmpty ? "Marcă" : make) \(model.isEmpty ? "model" : model) · \(year.isEmpty ? "—" : year)")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.78))
                    Text("\(price.isEmpty ? "—" : price) EUR · \(mileage.isEmpty ? "—" : mileage) km")
                        .font(.title3.weight(.bold))
                        .foregroundStyle(AFTheme.paleGold)
                    Text("\(city.isEmpty ? "Oraș" : city), \(county.isEmpty ? "județ" : county) · \(images.count) fotografii")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.72))
                }
                .padding(20)
            }
            .frame(height: 185)
            .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))

            HStack(alignment: .top, spacing: 11) {
                Image(systemName: images.isEmpty ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
                    .foregroundStyle(images.isEmpty ? Color.orange : Color.green)
                Text(images.isEmpty ? "Mai adaugă cel puțin o fotografie pentru a putea publica anunțul." : "Anunțul este gata. Îl poți publica acum sau îl poți păstra ca draft.")
                    .font(.subheadline)
                    .foregroundStyle(AFTheme.ink)
            }
            .padding(15)
            .background(images.isEmpty ? Color.orange.opacity(0.1) : Color.green.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
    }

    private var bottomActions: some View {
        HStack(spacing: 11) {
            if step > 0 {
                Button("Înapoi") {
                    message = ""
                    step -= 1
                }
                .buttonStyle(EditorOutlineButton())
                .disabled(saving || uploadingPhotos)
            }

            if step < ListingEditorStep.allCases.count - 1 {
                Button {
                    advance()
                } label: {
                    Label("Continuă", systemImage: "arrow.right")
                }
                .buttonStyle(AFGoldButton())
                .disabled(saving || uploadingPhotos)
            } else {
                Button("Salvează draft") { save("draft") }
                    .buttonStyle(EditorOutlineButton())
                    .disabled(saving || uploadingPhotos)

                Button {
                    save("published")
                } label: {
                    HStack(spacing: 7) {
                        if saving { ProgressView().tint(AFTheme.graphite).scaleEffect(0.78) }
                        Text(saving ? "Se publică…" : "Publică")
                    }
                }
                .buttonStyle(AFGoldButton())
                .disabled(saving || uploadingPhotos || images.isEmpty)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) { Divider().opacity(0.5) }
    }

    private func stepHeading(_ title: String, _ detail: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.title2.weight(.bold)).foregroundStyle(AFTheme.ink)
            Text(detail).font(.subheadline).foregroundStyle(AFTheme.muted).fixedSize(horizontal: false, vertical: true)
        }
    }

    private func editorField(_ label: String, text: Binding<String>, keyboard: UIKeyboardType = .default, suffix: String? = nil) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(AFTheme.muted)
            HStack(spacing: 6) {
                TextField(label, text: text)
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(keyboard == .default ? .words : .never)
                if let suffix {
                    Text(suffix).font(.caption.weight(.bold)).foregroundStyle(AFTheme.muted)
                }
            }
            .padding(.horizontal, 13)
            .padding(.vertical, 14)
            .background(AFTheme.paper)
            .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 15).stroke(AFTheme.line))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func selectionField(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(AFTheme.muted)
            HStack {
                Text(value).font(.subheadline.weight(.medium)).foregroundStyle(AFTheme.ink)
                Spacer(minLength: 2)
                Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.bold)).foregroundStyle(AFTheme.muted)
            }
            .padding(.horizontal, 13)
            .padding(.vertical, 14)
            .background(AFTheme.paper)
            .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 15).stroke(AFTheme.line))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func editorTextArea(_ label: String, hint: String, text: Binding<String>, minimumHeight: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption.weight(.semibold)).foregroundStyle(AFTheme.muted)
            ZStack(alignment: .topLeading) {
                TextEditor(text: text)
                    .scrollContentBackground(.hidden)
                    .padding(9)
                    .frame(minHeight: minimumHeight)
                if text.wrappedValue.isEmpty {
                    Text(hint)
                        .font(.subheadline)
                        .foregroundStyle(AFTheme.muted.opacity(0.75))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 17)
                        .allowsHitTesting(false)
                }
            }
            .background(AFTheme.paper)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(AFTheme.line))
        }
    }

    private func editorMessage(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "exclamationmark.triangle.fill").font(.subheadline.weight(.bold))
            Text(text).font(.footnote.weight(.medium)).fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(.red)
        .padding(13)
        .background(Color.red.opacity(0.09))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func publicationSuccess(_ slug: String) -> some View {
        VStack(spacing: 18) {
            Spacer()
            ZStack {
                RoundedRectangle(cornerRadius: 30, style: .continuous).fill(Color.green.opacity(0.13))
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 42, weight: .bold))
                    .foregroundStyle(.green)
            }
            .frame(width: 94, height: 94)

            Text("Anunț publicat!")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(AFTheme.ink)
            Text("Mașina ta este acum vizibilă pentru cumpărători. Poți verifica exact cum arată sau continua în spațiul tău de vânzare.")
                .font(.body)
                .foregroundStyle(AFTheme.muted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 26)

            VStack(spacing: 11) {
                Button { openPublishedListing(slug) } label: {
                    Label("Vezi anunțul", systemImage: "arrow.right")
                }
                .buttonStyle(AFGoldButton())

                Button { openSellerListings() } label: {
                    Text("Anunțurile mele")
                }
                .buttonStyle(EditorOutlineButton())
            }
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private func advance() {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedMake = make.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedModel = model.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedCounty = county.trimmingCharacters(in: .whitespacesAndNewlines)

        let issue: String?
        switch step {
        case 0:
            if trimmedTitle.count < 8 { issue = "Adaugă un titlu de cel puțin 8 caractere." }
            else if trimmedMake.isEmpty || trimmedModel.isEmpty { issue = "Completează marca și modelul mașinii." }
            else if Int(year) == nil || Double(price.replacingOccurrences(of: ",", with: ".")) == nil { issue = "Completează anul de fabricație și prețul." }
            else if trimmedCity.count < 2 || trimmedCounty.count < 2 { issue = "Completează orașul și județul." }
            else { issue = nil }
        case 2:
            issue = description.trimmingCharacters(in: .whitespacesAndNewlines).count < 50 ? "Descrierea are nevoie de cel puțin 50 de caractere." : nil
        default:
            issue = nil
        }

        if let issue {
            message = issue
        } else {
            message = ""
            step = min(step + 1, ListingEditorStep.allCases.count - 1)
        }
    }

    private func load() async {
        guard let id else { return }
        do {
            let data = try await app.api.call("seller_listing", payload: ["id": .number(Double(id))])
            guard let listing = data["listing"]?.object else { return }
            title = listing[string: "title"]
            description = listing[string: "description"]
            make = listing[string: "make"]
            model = listing[string: "model"]
            year = listing[string: "year"]
            mileage = listing[string: "mileage"]
            price = listing[string: "price"]
            city = listing[string: "city"]
            county = listing[string: "county"]
            fuel = listing[string: "fuel_type"].isEmpty ? fuel : listing[string: "fuel_type"]
            transmission = listing[string: "transmission"].isEmpty ? transmission : listing[string: "transmission"]
            vin = listing[string: "vin"]
            bodyType = listing[string: "body_type"]
            engineSize = listing[string: "engine_size"]
            power = listing[string: "power"]
            doors = listing[string: "doors"]
            seats = listing[string: "seats"]
            owners = listing[string: "owners"]
            serviceHistory = listing[bool: "service_history"]
            features = listing["features"]?.array?.compactMap(\.string).joined(separator: ", ") ?? ""
            images = listing["images"]?.array?.compactMap { $0.object?[string: "path"] }.filter { !$0.isEmpty } ?? []
        } catch {
            message = error.localizedDescription
        }
    }

    private func upload(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty, !uploadingPhotos else { return }
        uploadingPhotos = true
        message = ""
        defer {
            uploadingPhotos = false
            pickerItems = []
        }

        for item in items.prefix(max(0, 15 - images.count)) {
            do {
                guard let data = try await item.loadTransferable(type: Data.self), let image = UIImage(data: data) else { continue }
                images.append(try await app.api.uploadListingImage(image))
            } catch {
                message = error.localizedDescription
                break
            }
        }
    }

    private func move(_ from: Int, _ to: Int) {
        guard images.indices.contains(to), from != to else { return }
        let image = images.remove(at: from)
        images.insert(image, at: to)
    }

    private func save(_ status: String) {
        guard !saving else { return }
        if status == "published" && images.isEmpty {
            message = "Adaugă cel puțin o fotografie înainte de publicare."
            return
        }

        saving = true
        message = ""
        Task {
            defer { saving = false }
            var payload: [String: JSONValue] = [
                "status": .string(status),
                "title": .string(title.trimmingCharacters(in: .whitespacesAndNewlines)),
                "description": .string(description.trimmingCharacters(in: .whitespacesAndNewlines)),
                "make": .string(make.trimmingCharacters(in: .whitespacesAndNewlines)),
                "model": .string(model.trimmingCharacters(in: .whitespacesAndNewlines)),
                "year": .number(Double(year) ?? 0),
                "mileage": .number(Double(mileage) ?? -1),
                "price": .number(Double(price.replacingOccurrences(of: ",", with: ".")) ?? 0),
                "city": .string(city.trimmingCharacters(in: .whitespacesAndNewlines)),
                "county": .string(county.trimmingCharacters(in: .whitespacesAndNewlines)),
                "fuel_type": .string(fuel),
                "transmission": .string(transmission),
                "currency": .string("EUR"),
                "vin": .string(vin.trimmingCharacters(in: .whitespacesAndNewlines)),
                "body_type": .string(bodyType.trimmingCharacters(in: .whitespacesAndNewlines)),
                "service_history": .bool(serviceHistory),
                "features": .array(
                    features
                        .split(separator: ",")
                        .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
                        .filter { !$0.isEmpty }
                        .map(JSONValue.string)
                ),
                "images": .array(images.map { .object(["path": .string($0)]) }),
            ]
            if let id { payload["id"] = .number(Double(id)) }
            for (key, value) in [("engine_size", engineSize), ("power", power), ("doors", doors), ("seats", seats), ("owners", owners)] {
                if let number = Double(value.replacingOccurrences(of: ",", with: ".")) { payload[key] = .number(number) }
            }

            do {
                let result = try await app.api.call("save_listing", payload: payload)
                if status == "published", let slug = result["listing"]?.object?[string: "slug"], !slug.isEmpty {
                    publishedSlug = slug
                } else {
                    dismiss()
                }
            } catch {
                message = error.localizedDescription
            }
        }
    }

    private func openPublishedListing(_ slug: String) {
        if let open { open(.listing(slug)) } else { dismiss() }
    }

    private func openSellerListings() {
        if let open { open(.sellerListings) } else { dismiss() }
    }
}

private enum ListingEditorStep: String, CaseIterable {
    case details = "Detalii"
    case specifications = "Specificații"
    case photos = "Fotografii"
    case publish = "Publică"
}

private struct FuelChoice: Identifiable, CaseIterable {
    let id: String
    let title: String

    static let allCases = [
        FuelChoice(id: "petrol", title: "Benzină"),
        FuelChoice(id: "diesel", title: "Diesel"),
        FuelChoice(id: "hybrid", title: "Hibrid"),
        FuelChoice(id: "electric", title: "Electric"),
        FuelChoice(id: "lpg", title: "GPL"),
        FuelChoice(id: "cng", title: "CNG"),
    ]

    static func title(for id: String) -> String { allCases.first(where: { $0.id == id })?.title ?? "Selectează" }
}

private struct TransmissionChoice: Identifiable, CaseIterable {
    let id: String
    let title: String

    static let allCases = [
        TransmissionChoice(id: "manual", title: "Manuală"),
        TransmissionChoice(id: "automatic", title: "Automată"),
        TransmissionChoice(id: "semi_automatic", title: "Semi-automată"),
        TransmissionChoice(id: "cvt", title: "CVT"),
    ]

    static func title(for id: String) -> String { allCases.first(where: { $0.id == id })?.title ?? "Selectează" }
}

private struct EditorOutlineButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline.weight(.bold))
            .foregroundStyle(AFTheme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(AFTheme.paper.opacity(configuration.isPressed ? 0.65 : 1))
            .clipShape(Capsule())
            .overlay(Capsule().stroke(AFTheme.line))
    }
}

struct SellerDashboardView: View { @EnvironmentObject private var app: AppContainer; @State private var data = [String: JSONValue](); @State private var error = ""
    var body: some View { List { if !error.isEmpty { Text(error).foregroundStyle(.red) }; if let profile = data["profile"]?.object { Section("Cont") { Text(profile[string: "role"]); Text(profile[bool: "is_verified"] ? "Vânzător verificat" : "Verificare în așteptare") } }; Section("Performanța anunțurilor") { ForEach(Array((data["metrics"]?.array ?? []).indices), id: \.self) { index in let metric = (data["metrics"]?.array?[index].object) ?? [:]; VStack(alignment: .leading) { Text(metric[string: "title"]); Text("Vizualizări: \(metric[string: "view_count"]) · Favorite: \(metric[string: "favorite_count"])").foregroundStyle(.secondary) } } } }.navigationTitle("Dashboard seller").task { do { data = try await app.api.call("seller_dashboard") } catch { self.error = error.localizedDescription } } }
}

struct SellerProfileView: View { @EnvironmentObject private var app: AppContainer; @State private var data = [String: JSONValue](); @State private var error = ""; @State private var review = ""; @State private var rating = 5; let sellerID: String; let open: (Route) -> Void
    var body: some View { List { if !error.isEmpty { Text(error).foregroundStyle(.red) }; if let profile = data["profile"]?.object { Section { Text(profile[string: "display_name"]).font(.title3.bold()); if profile[bool: "is_verified"] { Label("Vânzător verificat", systemImage: "checkmark.seal.fill").foregroundStyle(.green) }; if !profile[string: "phone"].isEmpty { Text(profile[string: "phone"]) } } }; Section("Anunțuri") { ForEach(Array((data["listings"]?.array ?? []).indices), id: \.self) { index in let listing = (data["listings"]?.array?[index].object) ?? [:]; Button(listing[string: "title"]) { if let slug = listing["slug"]?.string { open(.listing(slug)) } } } }; Section("Recenzii") { ForEach(Array((data["reviews"]?.array ?? []).indices), id: \.self) { index in let row = (data["reviews"]?.array?[index].object) ?? [:]; VStack(alignment: .leading) { Text("\(row[string: "rating"])/5 ★"); Text(row[string: "comment"]) } }; Stepper("Rating: \(rating)", value: $rating, in: 1...5); TextField("Scrie o recenzie (minim 10 caractere)", text: $review); Button("Trimite recenzia") { Task { do { _ = try await app.api.call("save_review", payload: ["sellerId": .string(sellerID), "rating": .number(Double(rating)), "comment": .string(review)]); review = ""; await load() } catch { self.error = error.localizedDescription } } }.disabled(review.count < 10) } }.navigationTitle("Vânzător").task { await load() } }
    private func load() async { do { data = try await app.api.call("seller_profile", payload: ["sellerId": .string(sellerID)]) } catch { self.error = error.localizedDescription } }
}
