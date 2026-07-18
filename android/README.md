# AutoFans Android

Client Android nativ AutoFans pentru cumpărători și vânzători. Catalogul public citește Supabase cu RLS, iar acțiunile autentificate trec prin `/api/mobile/v1` cu JWT-ul utilizatorului. Cheia service-role nu ajunge niciodată în APK.

Include autentificare Supabase cu email/parolă, creare cont, confirmare email, resetare parolă și sesiune criptată în Android Keystore. Include profil, favorite, căutări salvate și alerte, comparație, conversații, raportări și recenzii. Pentru vânzători include promovarea contului, cererea de verificare, dashboard și gestionarea manuală a anunțurilor/imaginilor.

## Cerințe

- Android Studio recent, JDK 17 şi Android SDK Platform 35.
- URL-ul Supabase și cheia **anon/publishable**. Nu folosiți și nu adăugați cheia `SUPABASE_SERVICE_ROLE_KEY` în acest proiect.

## Configurare locală

```bash
cd android
cp local.properties.example local.properties
```

În `local.properties`, păstrați sau adăugați `sdk.dir` conform Android Studio și completați:

```properties
SUPABASE_URL=https://projectul-vostru.supabase.co
SUPABASE_ANON_KEY=cheia_anon_sau_publishable
APP_URL=https://www.autofans.ro
# Opțional: Web OAuth client ID din același proiect Google Cloud ca providerul Supabase.
GOOGLE_WEB_CLIENT_ID=1234567890-example.apps.googleusercontent.com
```

Aceste valori pot fi injectate și în CI prin `-PSUPABASE_URL=... -PSUPABASE_ANON_KEY=...` sau variabilele de mediu cu aceleași nume. `local.properties` este ignorat de Git.

Dacă proiectul web are deja `.env.local` cu `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` și `APP_URL`, Gradle le reutilizează automat. Nu copiați cheia în alt fișier doar pentru Android.

## Google Sign-In și linkuri email

În Supabase Auth adăugați `autofans://auth/callback` la Redirect URLs. Este folosit exclusiv pentru confirmarea emailului și resetarea parolei; păstrați Website URL-ul web ca URL principal al site-ului.

Butonul Google este nativ Android, prin Credential Manager: nu deschide Chrome și nu redirecționează la site. Activează providerul Google în Supabase și înregistrează în același proiect Google Cloud câte un client OAuth Android pentru:

- debug: `ro.autofans.app.debug` + amprentele din `./gradlew :app:signingReport`;
- release: `ro.autofans.app` + certificatul release/Play App Signing.

Folosește Web OAuth Client ID al providerului Supabase în `GOOGLE_WEB_CLIENT_ID`. Fără clientul Android și amprentele corecte, Google va afișa selectorul de cont, dar nu va emite tokenul aplicației.

Ecranele aplicației folosesc exclusiv rute interne Compose, de exemplu `listing/{slug}`. Nu există app links către paginile web; schema `autofans://auth/callback` rămâne doar pentru revenirea obligatorie din OAuth/Supabase în aplicație.

## Rulare și verificare

```bash
./gradlew :app:assembleDebug
./gradlew :app:testDebugUnitTest
./gradlew :app:bundleRelease
```

APK-ul debug este la `app/build/outputs/apk/debug/`; AAB-ul de release la `app/build/outputs/bundle/release/`.

Pentru verificarea manuală, testați autentificarea email/parolă, resetarea parolei, căutarea salvată, un buyer și un seller, imaginile unui anunț și conversațiile. Necesită o configurație Supabase reală și un emulator/dispozitiv API 26+.

## Play Store

Înainte de primul upload, configurați semnarea release într-un mediu sigur (de preferat Play App Signing/CI), incrementați `versionCode`, completați Data safety și politica de confidențialitate.

Pentru a semna AAB-ul local sau în CI, furnizați următoarele proprietăți (în `local.properties`, secrete CI sau argumente `-P`): `RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD`. Fără ele Gradle poate produce un AAB de verificare, dar nu îl încărcați în Play Console. Nu adăugați keystore-ul ori parolele în Git.
