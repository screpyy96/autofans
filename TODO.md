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
- [x] Câmpuri VIN și istoric pregătite în schema de date
- [ ] Detectare duplicate/fraudă
- [x] Badge-uri de încredere pe card și pagina mașinii
- [ ] Flux real de verificare vânzător/VIN/istoric

## Etapa 4 · Price Score

- [x] Preț comparat cu anunțuri similare publicate
- [x] Recomandare de negociere când prețul este peste piață
- [x] Cost lunar estimat cu ipoteze explicite

## Etapa 5 · Seller Dashboard

- [x] Vizualizări, favorite și contacte reale
- [x] Conversie vizualizare → contact
- [x] Recomandări de preț și optimizare anunț

## Etapa 6 · Search premium

- [ ] Căutare naturală
- [ ] Hartă și rază geografică
- [ ] Alerte pentru anunțuri și scăderi de preț
- [ ] Recomandări personalizate

## Etapa 7 · Tranzacție

- [ ] Chat intern
- [ ] Ofertă și test-drive
- [ ] Rezervare și documente digitale
