import SwiftUI

struct OnboardingView: View {
    @AppStorage("onboarding_complete") private var complete = false
    @State private var page = 0
    private let pages = [
        OnboardingPage(eyebrow: "Bun venit", title: "Cumpără cu încredere", detail: "Descoperă anunțuri clare, filtre utile și detalii care te ajută să alegi mai bine.", image: "onboarding_buy"),
        OnboardingPage(eyebrow: "Alege informat", title: "Compară înainte să decizi", detail: "Păstrează până la trei mașini și compară prețul, kilometrajul și dotările într-un singur loc.", image: "onboarding_compare"),
        OnboardingPage(eyebrow: "Totul într-un singur loc", title: "Vinde simplu și sigur", detail: "Publică anunțul, vorbește direct cu cumpărătorii și gestionează totul din contul tău.", image: "onboarding_sell"),
    ]

    var body: some View {
        AFScreen {
            VStack(spacing: 0) {
                HStack { AFBrandImage(name: "autofans_logo", ext: "png", contentMode: .fit).frame(width: 160, height: 48); Spacer(); Button("Sari peste") { complete = true }.font(.subheadline.weight(.bold)).foregroundStyle(AFTheme.gold) }.padding(.horizontal, 24).padding(.top, 14)
                TabView(selection: $page) { ForEach(pages.indices, id: \.self) { index in onboardingPage(pages[index]).tag(index) } }.tabViewStyle(.page(indexDisplayMode: .never))
                HStack(spacing: 8) { ForEach(pages.indices, id: \.self) { index in Capsule().fill(index == page ? AFTheme.gold : AFTheme.ink.opacity(0.15)).frame(width: index == page ? 28 : 8, height: 8) } }.padding(.bottom, 23)
                Button(page == pages.count - 1 ? "Începe acum" : "Continuă") { if page == pages.count - 1 { complete = true } else { withAnimation(.spring(response: 0.35)) { page += 1 } } }.buttonStyle(AFGoldButton()).padding(.horizontal, 24).padding(.bottom, 14)
            }
        }
    }

    private func onboardingPage(_ item: OnboardingPage) -> some View {
        VStack(spacing: 0) {
            Spacer(minLength: 18)
            AFBrandImage(name: item.image, ext: "png", contentMode: .fit).frame(maxWidth: .infinity).frame(height: 310).padding(.horizontal, 28)
            Spacer(minLength: 20)
            Text(item.eyebrow.uppercased()).font(.caption.weight(.bold)).tracking(1.4).foregroundStyle(AFTheme.gold)
            Text(item.title).font(.system(size: 31, weight: .bold, design: .rounded)).foregroundStyle(AFTheme.ink).multilineTextAlignment(.center).padding(.top, 10)
            Text(item.detail).font(.body).foregroundStyle(AFTheme.muted).multilineTextAlignment(.center).lineSpacing(4).padding(.horizontal, 36).padding(.top, 12)
            Spacer()
        }
    }
}

private struct OnboardingPage { let eyebrow: String; let title: String; let detail: String; let image: String }
