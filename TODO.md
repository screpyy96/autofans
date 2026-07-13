# AutoFans — implementare

## Etapa 2 · Model de date

- [x] Centralizează maparea `listings -> Car` pentru Home, Search, Compare și Favorites
- [x] Centralizează semnarea imaginilor din Storage
- [x] Înlocuiește mapările duplicate din Home, Search, Compare și Favorites
- [x] Uniformizează statusurile și fallback-urile pentru anunțuri
- [x] Adaugă teste pentru listing fără imagini, slug lipsă și locație lipsă
- [x] Verifică sincronizarea `favorites` local ↔ Supabase
- [x] Verifică evenimentele `listing_views` și `listing_contacts`

## Etapa 3 · Trust Score

- [x] Scor transparent din semnale existente
- [x] Câmpuri VIN normalizate și validate în schema de date
- [x] Detectare duplicate VIN cu semnal privat pentru proprietarul anunțului
- [x] Badge-uri de încredere pe card și pagina mașinii
- [x] Solicitare persistată de verificare manuală a vânzătorului
- [ ] Aprobare internă și integrare furnizor VIN/istoric auto

## Etapa 4 · Price Score

- [x] Preț comparat cu anunțuri similare publicate
- [x] Recomandare de negociere când prețul este peste piață
- [x] Cost lunar estimat cu ipoteze explicite

## Etapa 5 · Seller Dashboard

- [x] Vizualizări, favorite și contacte reale
- [x] Conversie vizualizare → contact
- [x] Recomandări de preț și optimizare anunț

## Etapa 6 · Search premium

- [x] Căutare naturală pentru marcă, combustibil, transmisie, preț, an și oraș
- [x] Hartă și rază geografică
  - [x] Markere interactive și card cu acces direct la anunț
  - [x] Filtru pe oraș și rază de 25–500 km
  - [x] Geocodare la publicarea/editarea anunțului, cu fallback pe oraș
  - [x] Aplică migrarea `listing_coordinates` în Supabase
- [x] Alerte pentru anunțuri și scăderi de preț
  - [x] Căutări salvate persistente cu opțiune de alertă email
  - [x] Inbox de alerte în aplicație și alerte price-drop
  - [x] Dispatcher Resend securizat și idempotent (activezi după setarea secretelor)
- [x] Recomandări personalizate
  - [x] Ranking din favorite și căutări salvate, fără date mock
  - [x] Explicație transparentă pentru fiecare recomandare

## Etapa 7 · Tranzacție

- [x] Chat intern
  - [x] Conversație unică cumpărător–vânzător pentru fiecare anunț
  - [x] Mesaje persistente, RLS și actualizare în timp real când Realtime e activ
- [ ] Ofertă și test-drive
- [ ] Rezervare și documente digitale
