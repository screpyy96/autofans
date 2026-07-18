# AutoFans iOS

Client iOS nativ, construit cu SwiftUI și `URLSession`. Nu include SDK-uri terțe și nu trimite niciodată cheia Supabase service-role în aplicație.

## Deschidere

1. Rulează `sh ios/scripts/configure-secrets.sh` din rădăcina repository-ului. Scriptul creează `Config/Secrets.xcconfig` din valorile locale `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY` din `.env.local`. Alternativ, copiază manual `Config/Secrets.xcconfig.example` ca `Config/Secrets.xcconfig` și completează valorile.
2. Deschide `AutoFans.xcodeproj` în Xcode.
3. Alege un simulator iOS 17+ și rulează schema **AutoFans**.

`Secrets.xcconfig` este ignorat de Git. În CI, aceleași valori pot fi furnizate prin configurarea build settings `SUPABASE_URL`, `SUPABASE_ANON_KEY` și `APP_URL`.

## Integrare Supabase / Apple

- Adaugă `autofans://auth/callback` la **Redirect URLs** în Supabase Auth.
- Pentru Google OAuth, configurează aplicația iOS (`ro.autofans.app`) în Google Cloud și provider-ul în Supabase.
- Universal Link-urile pentru `https://www.autofans.ro/car/{slug}` sunt declarate. Pentru dispozitive reale, activează asocierea domeniului și publică `apple-app-site-association` pentru `ro.autofans.app`.
- Tokenurile sunt păstrate exclusiv în Keychain; aplicația reînnoiește tokenul înainte de apelurile autentificate.

## Acoperire funcțională

Catalog cu căutare, sortare, filtre și paginare; detaliu cu galerie și comparație; autentificare, creare cont, resetare parolă și Google OAuth; favorite, căutări salvate, alerte, mesaje, profil, recenzii, anunțuri și dashboard de vânzător. Mutațiile folosesc aceeași fațadă `/api/mobile/v1` ca Android.
