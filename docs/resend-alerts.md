# Alerte email cu Resend

După ce ai verificat domeniul `autofans.ro` în Resend, setează în platforma de deploy valorile din `.env.example`: `RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `ALERTS_CRON_SECRET` și `APP_URL`.

Programează apoi un job la fiecare 15 minute care face `POST /api/alerts/dispatch` cu header-ul `Authorization: Bearer $ALERTS_CRON_SECRET`. Endpoint-ul este protejat, creează alerte în aplicație pentru anunțuri noi și scăderi de preț, apoi trimite emailurile Resend rămase. Reîncercările sunt idempotente pe alertă.

Folosește o cheie Resend cu permisiunea **Sending access**, restrânsă la domeniul verificat. Nu pune niciodată cheia în variabile `VITE_*` sau în Git.
