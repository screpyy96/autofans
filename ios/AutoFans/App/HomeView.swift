import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var app: AppContainer
    @State private var query = ""
    @State private var featured = [Listing]()
    @State private var loading = true
    let explore: (String) -> Void
    let open: (Route) -> Void

    var body: some View {
        AFScreen { GeometryReader { proxy in ScrollView(showsIndicators: false) { VStack(spacing: 24) {
            hero
            VStack(alignment: .leading, spacing: 12) { Text("Începe inteligent").font(.title3.weight(.bold)).foregroundStyle(AFTheme.ink); ScrollView(.horizontal, showsIndicators: false) { HStack(spacing: 9) { Button { explore("SUV") } label: { AFPill("SUV", icon: "car.2") }; Button { explore("Automată") } label: { AFPill("Automată", icon: "gearshape.2") }; Button { explore("București") } label: { AFPill("București", icon: "mappin") }; Button { explore("Electric") } label: { AFPill("Electric", icon: "bolt") } } } }
            editorial
            VStack(alignment: .leading, spacing: 14) { HStack { Text("Anunțuri recente").font(.title3.weight(.bold)).foregroundStyle(AFTheme.ink); Spacer(); Button("Vezi toate") { explore("") }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.gold) }
                if loading { HStack(spacing: 12) { AFSkeleton().frame(width: 205, height: 180); AFSkeleton().frame(width: 205, height: 180) } }
                else if featured.isEmpty { AFCard { AFEmptyState(icon: "sparkles", title: "Selecția ta va apărea aici", detail: "Explorează catalogul și salvează mașinile care îți plac.") } }
                else { ScrollView(.horizontal, showsIndicators: false) { HStack(spacing: 14) { ForEach(featured) { listing in CompactListingCard(listing: listing).onTapGesture { open(.listing(listing.slug)) } } } } }
            }
        }.frame(width: max(0, proxy.size.width - 40)).padding(.top, 16).padding(.bottom, 24) }.frame(width: proxy.size.width) }.task { await load() } }
    }
    private var hero: some View { ZStack { AFBrandImage(name: "hero_background", ext: "jpg").frame(maxWidth: .infinity).frame(height: 258).clipped().overlay(LinearGradient(colors: [.black.opacity(0.06), AFTheme.graphite.opacity(0.84)], startPoint: .top, endPoint: .bottom)); GeometryReader { proxy in VStack(alignment: .leading, spacing: 14) { Text("Găsește mașina\npotrivită, simplu.").font(.system(size: 30, weight: .bold, design: .rounded)).foregroundStyle(.white); HStack(spacing: 10) { Image(systemName: "magnifyingglass").foregroundStyle(AFTheme.muted); TextField("Marcă, model sau oraș", text: $query).foregroundStyle(AFTheme.ink).submitLabel(.search).onSubmit { explore(query) }.layoutPriority(-1); Button(action: { explore(query) }) { Image(systemName: "arrow.right").font(.headline.bold()).foregroundStyle(AFTheme.paper).frame(width: 38, height: 38).background(AFTheme.graphite).clipShape(Circle()) }.layoutPriority(1) }.padding(7).padding(.leading, 8).background(.white).clipShape(Capsule()) }.frame(width: max(0, proxy.size.width - 40), alignment: .leading).padding(20).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading) } }.frame(maxWidth: .infinity).clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous)).shadow(color: AFTheme.cardShadow, radius: 18, y: 9) }
    private var editorial: some View { HStack(spacing: 12) { EditorialTile(title: "Cumpără cu încredere", subtitle: "Ghiduri practice", image: "card_buying"); EditorialTile(title: "Vinde mai simplu", subtitle: "Totul într-un loc", image: "card_selling") }.frame(height: 142) }
    private func load() async { defer { loading = false }; do { featured = try await app.repository.search(query: "", filters: .init(), sort: .dateDesc, page: 1, pageSize: 8).listings } catch { featured = [] } }
}

private struct EditorialTile: View { let title: String; let subtitle: String; let image: String
    var body: some View { ZStack(alignment: .bottomLeading) { AFBrandImage(name: image, ext: "jpg").frame(maxWidth: .infinity).clipped().overlay(LinearGradient(colors: [.clear, AFTheme.graphite.opacity(0.77)], startPoint: .top, endPoint: .bottom)); VStack(alignment: .leading, spacing: 3) { Text(subtitle.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(AFTheme.paleGold); Text(title).font(.subheadline.weight(.bold)).foregroundStyle(.white).lineLimit(2) }.padding(13) }.clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous)) }
}

struct CompactListingCard: View { let listing: Listing
    var body: some View { VStack(alignment: .leading, spacing: 10) { ZStack(alignment: .topTrailing) { AsyncImage(url: listing.mainImage?.url) { image in image.resizable().scaledToFill() } placeholder: { AFBrandImage(name: "hero_car", ext: "png") }.frame(width: 205, height: 110).clipped(); Image(systemName: "heart").foregroundStyle(AFTheme.ink).padding(8).background(.white.opacity(0.9)).clipShape(Circle()).padding(8) }; Text(listing.title).font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.ink).lineLimit(1); Text(listing.priceText).font(.headline.weight(.bold)).foregroundStyle(AFTheme.gold); Text(listing.details).font(.caption).foregroundStyle(AFTheme.muted).lineLimit(1) }.frame(width: 205, alignment: .leading).padding(8).background(AFTheme.paper).clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous)).overlay(RoundedRectangle(cornerRadius: 20).stroke(AFTheme.line)) }
}
