# 🚛 Cyber Fleet Enterprise System

Nowoczesny system telematyczny PWA (Progressive Web App) z HUD-em dla kierowcy oraz podglądem floty w czasie rzeczywistym dla dyspozytora.

## 📂 Pliki projektu
- `index.html` – Wybór trybu (Kierowca / Dyspozytor)
- `kierowca.html` – Terminal HUD Kierowcy (AETR, Prędkość, Kamera DMS AI, Cyfrowy e-CMR)
- `dyspozytor.html` – Panel Centrali Dyspozytora (Monitoring GPS floty live)
- `app.js` – Główny silnik logiczny (Aplikacja + Obsługa Canvas i PWA)
- `manifest.json` – Konfiguracja instalacji PWA na urządzeniach mobilnych
- `sw.js` – Service Worker zapewniający pełną obsługę trybu Offline

## 🚀 Instrukcja wdrożenia na GitHub Pages
1. Umieść wszystkie 7 plików bezpośrednio w głównym folderze repozytorium (`main`).
2. Przejdź do zakładki **Settings** -> **Pages**.
3. W sekcji **Build and deployment** wybierz **Branch: main** i kliknij **Save**.
4. Aplikacja będzie dostępna pod wygenerowanym adresem URL z obsługą instalacji jako aplikacja mobilna na smartfonie.