import SwiftUI

@MainActor
final class CatalogModel: ObservableObject {
    @Published var query = ""
    @Published var listings = [Listing]()
    @Published var isLoading = false
    @Published var error: String?
    @Published var sort: ListingSort = .relevance
    @Published var filters = ListingSearchFilters()
    @Published var hasMore = false
    private var page = 1
    func search(repository: SupabaseRepository, reset: Bool = true) async {
        if reset { page = 1; listings = [] }
        isLoading = true; error = nil
        do { let result = try await repository.search(query: query, filters: filters, sort: sort, page: page); listings += result.listings; hasMore = result.hasMore; page += 1 }
        catch { self.error = error.localizedDescription }
        isLoading = false
    }
}

struct CatalogView: View {
    @EnvironmentObject private var app: AppContainer
    @EnvironmentObject private var auth: AuthStore
    @StateObject private var model = CatalogModel()
    @Binding var seed: String
    @State private var filtersOpen = false
    @State private var saveOpen = false
    @State private var saveName = ""
    let open: (Route) -> Void
    let account: () -> Void

    var body: some View {
        AFScreen { ScrollView(showsIndicators: false) { VStack(alignment: .leading, spacing: 18) {
            heading
            searchField
            controls
            if let error = model.error, model.listings.isEmpty { AFCard { VStack(spacing: 12) { AFEmptyState(icon: "wifi.exclamationmark", title: "Catalog indisponibil", detail: error); Button("Încearcă din nou") { Task { await model.search(repository: app.repository) } }.buttonStyle(AFPrimaryButton()) } } }
            else if model.isLoading && model.listings.isEmpty { loadingCards }
            else if model.listings.isEmpty { AFCard { AFEmptyState(icon: "car.side", title: "Niciun anunț aici încă", detail: "Ajustează căutarea sau filtrele și încearcă din nou.") } }
            else { LazyVStack(spacing: 14) { ForEach(model.listings) { listing in ListingCard(listing: listing).onTapGesture { open(.listing(listing.slug)) }; if model.hasMore { Button { Task { await model.search(repository: app.repository, reset: false) } } label: { model.isLoading ? AnyView(ProgressView().frame(maxWidth: .infinity).padding()) : AnyView(Text("Încarcă mai multe").frame(maxWidth: .infinity)) }.buttonStyle(AFPrimaryButton()).padding(.top, 2) } } } }
        }.padding(.horizontal, 20).padding(.top, 18).padding(.bottom, 24) }.refreshable { await model.search(repository: app.repository) } }
        .sheet(isPresented: $filtersOpen) { FilterView(filters: $model.filters) { Task { await model.search(repository: app.repository) } } }
        .alert("Salvează căutarea", isPresented: $saveOpen) { TextField("Numele căutării", text: $saveName); Button("Salvează") { Task { await saveSearch() } }; Button("Renunță", role: .cancel) {} } message: { Text("Vei primi alertele disponibile pentru aceste filtre.") }
        .task { if model.listings.isEmpty { await model.search(repository: app.repository) } }
        .onChange(of: seed) { _, value in guard !value.isEmpty else { return }; model.query = value; Task { await model.search(repository: app.repository) }; seed = "" }
    }
    private var heading: some View { VStack(alignment: .leading, spacing: 5) { Text("Anunțuri auto").font(.system(size: 32, weight: .bold, design: .rounded)).foregroundStyle(AFTheme.ink); Text("Caută, filtrează și alege informat.").font(.subheadline).foregroundStyle(AFTheme.muted) } }
    private var searchField: some View { HStack(spacing: 10) { Image(systemName: "magnifyingglass").foregroundStyle(AFTheme.gold); TextField("Marcă, model sau oraș", text: $model.query).textInputAutocapitalization(.words).submitLabel(.search).onSubmit { Task { await model.search(repository: app.repository) } }; if !model.query.isEmpty { Button { model.query = ""; Task { await model.search(repository: app.repository) } } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.secondary) } } }.padding(15).background(AFTheme.paper).clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous)).overlay(RoundedRectangle(cornerRadius: 18).stroke(AFTheme.line)).shadow(color: AFTheme.cardShadow, radius: 8, y: 3) }
    private var controls: some View { VStack(alignment: .leading, spacing: 10) { HStack { Button { filtersOpen = true } label: { Label("Filtre", systemImage: "slider.horizontal.3") }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.ink).padding(.horizontal, 13).padding(.vertical, 10).background(AFTheme.paper).clipShape(Capsule()).overlay(Capsule().stroke(AFTheme.line)); Menu { Picker("Sortează", selection: $model.sort) { ForEach(ListingSort.allCases) { Text($0.title).tag($0) } }.onChange(of: model.sort) { _, _ in Task { await model.search(repository: app.repository) } } } label: { Label("Sortează", systemImage: "arrow.up.arrow.down").font(.subheadline.weight(.semibold)).foregroundStyle(AFTheme.muted) }; Spacer(); Text("\(model.listings.count) rezultate").font(.caption.weight(.semibold)).foregroundStyle(AFTheme.muted) }
        if !model.filters.isEmpty || !model.query.isEmpty { HStack { AFPill("Filtre active", icon: "checkmark"); Spacer(); Button("Resetează") { model.query = ""; model.filters = .init(); Task { await model.search(repository: app.repository) } }.font(.caption.weight(.bold)).foregroundStyle(AFTheme.gold) } }
        if auth.session != nil && (model.query.trimmed != nil || !model.filters.isEmpty) { Button { saveOpen = true } label: { Label("Salvează această căutare", systemImage: "bookmark") }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.gold) }
    } }
    private var loadingCards: some View { LazyVStack(spacing: 14) { ForEach(0..<4, id: \.self) { _ in AFSkeleton().frame(height: 140) } } }
    private func saveSearch() async { guard let name = saveName.trimmed else { return }; do { _ = try await app.api.call("save_search", payload: ["name": .string(name), "query": model.filters.savedSearch(query: model.query)]); saveName = "" } catch { model.error = error.localizedDescription } }
}

struct ListingCard: View {
    let listing: Listing
    var body: some View { AFCard(padding: 9) { HStack(spacing: 14) { ZStack(alignment: .topTrailing) { AsyncImage(url: listing.mainImage?.url) { image in image.resizable().scaledToFill() } placeholder: { AFBrandImage(name: "hero_car", ext: "png") }.frame(width: 126, height: 128).clipped().clipShape(RoundedRectangle(cornerRadius: 17, style: .continuous)); Image(systemName: "heart").font(.caption.bold()).foregroundStyle(AFTheme.ink).padding(7).background(.white.opacity(0.92)).clipShape(Circle()).padding(7) }; VStack(alignment: .leading, spacing: 7) { Text(listing.title).font(.headline.weight(.bold)).foregroundStyle(AFTheme.ink).lineLimit(2); Text(listing.priceText).font(.title3.weight(.bold)).foregroundStyle(AFTheme.gold); Text(listing.details).font(.caption).foregroundStyle(AFTheme.muted).lineLimit(2); Spacer(minLength: 1); if !listing.location.isEmpty { Label(listing.location, systemImage: "mappin.and.ellipse").font(.caption).foregroundStyle(AFTheme.muted).lineLimit(1) } }.frame(maxWidth: .infinity, alignment: .leading) } }.accessibilityElement(children: .combine).accessibilityLabel("\(listing.title), \(listing.priceText)") }
}

struct FilterView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var filters: ListingSearchFilters
    let apply: () -> Void
    var body: some View { NavigationStack { AFScreen { ScrollView { VStack(alignment: .leading, spacing: 18) { Text("Găsește exact ce cauți").font(.title2.weight(.bold)).foregroundStyle(AFTheme.ink); filterCard("Marcă și locație") { text("Marcă", binding(\.makes)); text("Model", binding(\.models)); text("Oraș", $filters.city) }; filterCard("Buget și istoric") { numeric("Preț minim", \.minPrice); numeric("Preț maxim", \.maxPrice); numeric("An minim", \.minYear); numeric("An maxim", \.maxYear); numeric("Km minim", \.minMileage); numeric("Km maxim", \.maxMileage) }; filterCard("Configurație") { text("Combustibil", binding(\.fuelTypes)); text("Transmisie", binding(\.transmissions)) }; Button("Aplică filtrele") { apply(); dismiss() }.buttonStyle(AFGoldButton()) }.padding(20) } }.navigationTitle("Filtre").toolbar { ToolbarItem(placement: .topBarLeading) { Button("Resetează") { filters = .init() }.foregroundStyle(AFTheme.gold) }; ToolbarItem(placement: .topBarTrailing) { Button("Gata") { dismiss() }.foregroundStyle(AFTheme.ink) } } } }
    private func filterCard<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View { AFCard { VStack(alignment: .leading, spacing: 10) { Text(title).font(.headline.weight(.bold)).foregroundStyle(AFTheme.ink); content() } } }
    private func text(_ label: String, _ value: Binding<String>) -> some View { TextField(label, text: value).padding(12).background(AFTheme.ivory).clipShape(RoundedRectangle(cornerRadius: 12)) }
    private func binding(_ keyPath: WritableKeyPath<ListingSearchFilters, [String]>) -> Binding<String> { Binding(get: { filters[keyPath: keyPath].joined(separator: ", ") }, set: { filters[keyPath: keyPath] = $0.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty } }) }
    private func numeric(_ title: String, _ keyPath: WritableKeyPath<ListingSearchFilters, Int?>) -> some View { TextField(title, value: Binding(get: { filters[keyPath: keyPath] }, set: { filters[keyPath: keyPath] = $0 }), format: .number).keyboardType(.numberPad).padding(12).background(AFTheme.ivory).clipShape(RoundedRectangle(cornerRadius: 12)) }
}
