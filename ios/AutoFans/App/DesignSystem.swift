import SwiftUI
import UIKit

enum AFTheme {
    static let ivory = Color(red: 0.975, green: 0.963, blue: 0.935)
    static let paper = Color.white
    static let graphite = Color(red: 0.075, green: 0.09, blue: 0.11)
    static let ink = Color(red: 0.12, green: 0.14, blue: 0.16)
    static let muted = Color(red: 0.40, green: 0.43, blue: 0.45)
    static let gold = Color(red: 0.73, green: 0.56, blue: 0.22)
    static let paleGold = Color(red: 0.96, green: 0.91, blue: 0.78)
    static let line = Color.black.opacity(0.075)
    static let cardShadow = Color.black.opacity(0.09)
}

struct AFScreen<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { content.background(AFTheme.ivory.ignoresSafeArea()).tint(AFTheme.gold) }
}

struct AFCard<Content: View>: View {
    var padding: CGFloat = 16
    let content: Content
    init(padding: CGFloat = 16, @ViewBuilder content: () -> Content) { self.padding = padding; self.content = content() }
    var body: some View {
        content.padding(padding).background(AFTheme.paper)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).stroke(AFTheme.line))
            .shadow(color: AFTheme.cardShadow, radius: 16, y: 7)
    }
}

struct AFPill: View {
    let title: String; let icon: String?
    init(_ title: String, icon: String? = nil) { self.title = title; self.icon = icon }
    var body: some View { HStack(spacing: 6) { if let icon { Image(systemName: icon) }; Text(title) }.font(.caption.weight(.semibold)).foregroundStyle(AFTheme.ink).padding(.horizontal, 12).padding(.vertical, 9).background(AFTheme.paper).clipShape(Capsule()).overlay(Capsule().stroke(AFTheme.line)) }
}

struct AFPrimaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View { configuration.label.font(.headline.weight(.bold)).foregroundStyle(AFTheme.paper).frame(maxWidth: .infinity).padding(.vertical, 15).background(AFTheme.graphite.opacity(configuration.isPressed ? 0.82 : 1)).clipShape(Capsule()).shadow(color: AFTheme.graphite.opacity(0.16), radius: 10, y: 5).scaleEffect(configuration.isPressed ? 0.98 : 1) }
}

struct AFGoldButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View { configuration.label.font(.headline.weight(.bold)).foregroundStyle(AFTheme.graphite).frame(maxWidth: .infinity).padding(.vertical, 15).background(LinearGradient(colors: [Color(red: 0.93, green: 0.79, blue: 0.43), AFTheme.gold], startPoint: .topLeading, endPoint: .bottomTrailing).opacity(configuration.isPressed ? 0.82 : 1)).clipShape(Capsule()).shadow(color: AFTheme.gold.opacity(0.28), radius: 12, y: 5).scaleEffect(configuration.isPressed ? 0.98 : 1) }
}

struct AFBrandImage: View {
    let name: String; let ext: String
    var contentMode: ContentMode = .fill
    var body: some View {
        Group {
            if let url = Bundle.main.url(forResource: name, withExtension: ext), let image = UIImage(contentsOfFile: url.path) { Image(uiImage: image).resizable().aspectRatio(contentMode: contentMode) }
            else { Rectangle().fill(AFTheme.paleGold) }
        }
    }
}

struct AFEmptyState: View {
    let icon: String; let title: String; let detail: String
    var body: some View { VStack(spacing: 13) { Image(systemName: icon).font(.system(size: 30, weight: .medium)).foregroundStyle(AFTheme.gold).frame(width: 62, height: 62).background(AFTheme.paleGold).clipShape(Circle()); Text(title).font(.title3.weight(.bold)).foregroundStyle(AFTheme.ink); Text(detail).font(.subheadline).foregroundStyle(AFTheme.muted).multilineTextAlignment(.center) }.frame(maxWidth: .infinity).padding(28) }
}

struct AFSkeleton: View { var body: some View { RoundedRectangle(cornerRadius: 18).fill(Color.black.opacity(0.06)).overlay(LinearGradient(colors: [.clear, .white.opacity(0.7), .clear], startPoint: .leading, endPoint: .trailing).mask(Rectangle().offset(x: -80))).redacted(reason: .placeholder) } }

struct PremiumHeader: View {
    let signedIn: Bool; let unreadCount: Int; let account: () -> Void; let alerts: () -> Void
    var body: some View {
        ZStack {
            AFBrandImage(name: "logo-header", ext: "png", contentMode: .fit).frame(width: 136, height: 38).accessibilityLabel("AutoFans")
            HStack { Button(action: account) { Image(systemName: signedIn ? "person.fill" : "person").font(.system(size: 15, weight: .bold)).foregroundStyle(AFTheme.paper).frame(width: 40, height: 40).background(AFTheme.graphite).clipShape(Circle()) }.accessibilityLabel(signedIn ? "Cont" : "Conectare"); Spacer(); Button(action: alerts) { ZStack(alignment: .topTrailing) { Image(systemName: "bell").font(.system(size: 16, weight: .semibold)).frame(width: 40, height: 40).background(AFTheme.paper).clipShape(Circle()).overlay(Circle().stroke(AFTheme.line)); if unreadCount > 0 { Text(unreadCount > 9 ? "9+" : "\(unreadCount)").font(.caption2.bold()).foregroundStyle(.white).padding(4).background(Color.red).clipShape(Circle()).offset(x: 4, y: -3) } } }.foregroundStyle(AFTheme.ink) }
        }.padding(.horizontal, 20).padding(.vertical, 10).background(.ultraThinMaterial).overlay(alignment: .bottom) { Divider().opacity(0.45) }
    }
}

enum AppTab: Hashable { case home, search, favorites, messages, account
    var title: String { switch self { case .home: "Acasă"; case .search: "Caută"; case .favorites: "Favorite"; case .messages: "Mesaje"; case .account: "Cont" } }
    var icon: String { switch self { case .home: "house"; case .search: "magnifyingglass"; case .favorites: "heart"; case .messages: "message"; case .account: "person" } }
}

struct PremiumTabBar: View {
    @Binding var selection: AppTab
    var body: some View { HStack(spacing: 2) { ForEach([AppTab.home, .search, .favorites, .messages, .account], id: \.self) { tab in Button { selection = tab } label: { VStack(spacing: 4) { Image(systemName: selection == tab ? "\(tab.icon).fill" : tab.icon).font(.system(size: 17, weight: .semibold)); Text(tab.title).font(.caption2.weight(.semibold)) }.foregroundStyle(selection == tab ? AFTheme.gold : AFTheme.muted).frame(maxWidth: .infinity).padding(.vertical, 9).contentShape(Rectangle()) }.accessibilityAddTraits(selection == tab ? .isSelected : []) } }.padding(.horizontal, 10).padding(.top, 7).padding(.bottom, 3).background(.ultraThinMaterial).overlay(alignment: .top) { Divider().opacity(0.5) } }
}
