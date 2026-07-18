import SwiftUI

@main
struct AutoFansApp: App {
    @StateObject private var app: AppContainer

    init() {
        let configuration: APIConfiguration
        do { configuration = try APIConfiguration.load() }
        catch { fatalError(error.localizedDescription) }
        _app = StateObject(wrappedValue: AppContainer(config: configuration))
    }

    var body: some Scene {
        WindowGroup { RootView().environmentObject(app).environmentObject(app.auth).tint(.blue) }
    }
}

@MainActor
final class AppContainer: ObservableObject {
    let config: APIConfiguration
    let auth: AuthStore
    let repository: SupabaseRepository
    let api: MobileAPI
    @Published var compared = [Listing]()
    init(config: APIConfiguration) { self.config = config; auth = AuthStore(config: config); repository = SupabaseRepository(config: config); api = MobileAPI(config: config, auth: auth) }
    func toggleCompare(_ listing: Listing) { if let index = compared.firstIndex(where: { $0.id == listing.id }) { compared.remove(at: index) } else if compared.count < 3 { compared.append(listing) } }
}

enum Route: Hashable { case listing(String), login, account, collection(CollectionKind), messages, sellerListings, listingEditor(Int?), sellerDashboard, seller(String), compare, sellerHub }
enum CollectionKind: String, Hashable { case favorites, saved, notifications
    var title: String { switch self { case .favorites: return "Favorite"; case .saved: return "Căutări salvate"; case .notifications: return "Notificări" } }
    var operation: String { switch self { case .favorites: return "favorites"; case .saved: return "saved_searches"; case .notifications: return "notifications" } }
    var key: String { switch self { case .favorites: return "favorites"; case .saved: return "searches"; case .notifications: return "notifications" } }
}

struct RootView: View {
    @EnvironmentObject private var app: AppContainer
    @EnvironmentObject private var auth: AuthStore
    @State private var path = NavigationPath()
    @State private var loginPresented = false
    @State private var tab: AppTab = .home
    @State private var searchSeed = ""
    @AppStorage("onboarding_complete") private var onboardingComplete = false

    var body: some View {
        if !onboardingComplete { OnboardingView() }
        else { NavigationStack(path: $path) {
            rootContent
                .navigationDestination(for: Route.self) { route in destination(route) }
                .sheet(isPresented: $loginPresented) { NavigationStack { LoginView(done: { loginPresented = false }) } }
                .onOpenURL { url in Task { await auth.completeRedirect(url) } }
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    guard let url = activity.webpageURL, url.pathComponents.count >= 3, url.pathComponents[1] == "car" else { return }
                    path.append(Route.listing(url.pathComponents[2]))
                }
        } }
    }
    @ViewBuilder private var rootContent: some View {
        ZStack {
            switch tab {
            case .home: CatalogView(seed: $searchSeed, open: navigate, account: openAccount)
            case .search: CatalogView(seed: $searchSeed, open: navigate, account: openAccount)
            case .favorites: protectedTab(title: "Mașinile tale preferate", detail: "Conectează-te ca să păstrezi mașinile pe care vrei să le urmărești.") { CollectionView(kind: .favorites, open: navigate) }
            case .messages: protectedTab(title: "Conversații într-un singur loc", detail: "Conectează-te pentru a discuta în siguranță cu vânzătorii.") { MessagesView() }
            case .account: auth.session == nil ? AnyView(signInPrompt(title: "Bun venit la AutoFans", detail: "Conectează-te pentru favorite, alerte și experiența completă.")) : AnyView(AccountView(open: navigate))
            }
        }
        .safeAreaInset(edge: .top, spacing: 0) { if path.isEmpty { PremiumHeader(signedIn: auth.session != nil, unreadCount: 0, account: openAccount, alerts: openAlerts) } }
        .safeAreaInset(edge: .bottom, spacing: 0) { if path.isEmpty { PremiumTabBar(selection: $tab) } }
    }
    @ViewBuilder private func protectedTab<Content: View>(title: String, detail: String, @ViewBuilder content: () -> Content) -> some View {
        if auth.session == nil { signInPrompt(title: title, detail: detail) } else { content() }
    }
    private func signInPrompt(title: String, detail: String) -> some View { AFScreen { VStack { Spacer(); AFCard { VStack(spacing: 15) { AFEmptyState(icon: "lock.fill", title: title, detail: detail); Button("Conectează-te") { loginPresented = true }.buttonStyle(AFPrimaryButton()) } }; Spacer() }.padding(20) } }
    private func openSearch(_ query: String) { searchSeed = query; tab = .search }
    private func openAccount() { if auth.session == nil { loginPresented = true } else { tab = .account } }
    private func openAlerts() { guard auth.session != nil else { loginPresented = true; return }; navigate(.collection(.notifications)) }
    private func openSellerHub() { guard auth.session != nil else { loginPresented = true; return }; navigate(.sellerHub) }
    @ViewBuilder private func destination(_ route: Route) -> some View {
        switch route {
        case .listing(let slug): ListingDetailView(slug: slug, open: navigate)
        case .login: LoginView(done: { path.removeLast() })
        case .account: AccountView(open: navigate)
        case .collection(let kind): CollectionView(kind: kind, open: navigate)
        case .messages: MessagesView()
        case .sellerListings: SellerListingsView(open: navigate)
        case .listingEditor(let id): ListingEditorView(id: id)
        case .sellerDashboard: SellerDashboardView()
        case .seller(let id): SellerProfileView(sellerID: id, open: navigate)
        case .compare: CompareView()
        case .sellerHub: SellerEntryView(open: navigate)
        }
    }
    private func navigate(_ route: Route) { path.append(route) }
}
