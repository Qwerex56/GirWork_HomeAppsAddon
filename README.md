# Czas pracy GIR

**Nieoficjalny** dodatek HomeMix do HomeApps: Twoje godziny, grafik i wnioski o zmianę z GIR w jednym miejscu.
Nie jest związany z GIR ani Mapal; korzysta z tego samego API co ich aplikacja mobilna.

Dodatek jest tylko dla **konta** (Moje aplikacje), nie dla domów.

## Co robi

- **Podsumowanie:** przepracowane i zaplanowane godziny oraz zarobek w tym miesiącu, w tym tygodniu i w poprzednim
  miesiącu.
- **Kalendarz zmian:** Twój grafik na miesiąc; kliknięcie dnia pokazuje, kto jest z Tobą na zmianie.
- **Wnioski o zmianę:** zaznacz dni, wybierz typ (dzień pracujący, wolny, godziny pracy, nie przed lub nie po godzinie) i wyślij; lista wysłanych wniosków
  z możliwością usunięcia.
- **Widżet w Moich aplikacjach:** mały (godziny w tym miesiącu), średni (do tego plan, zarobek i następna zmiana)
  albo duży (do tego lista nadchodzących zmian). Kliknięcie otwiera dodatek.

## O co prosi i dlaczego

| Uprawnienie | Po co |
|---|---|
| Twoje prywatne dane dodatku (`storage.user`) | zapamiętanie tokenu sesji GIR, żeby nie logować się za każdym razem; widzisz go tylko Ty |
| `https://gotogir.com` | logowanie do GIR (Twój login i hasło idą tylko tam) |
| `https://v5api.workforce.mapal-os.com` | grafik, czas pracy i wnioski o zmianę |

Hasło nie jest nigdzie zapisywane. HomeApps nie dostaje żadnych danych z GIR poza tokenem sesji, a dodatek nie ma
dostępu do niczego w HomeApps. „Wyloguj” usuwa token. Zdjęcia współpracowników z innych serwerów są blokowane przez
sandbox, dlatego widać inicjały.

## Instalacja

Moje aplikacje → **Dodaj dodatek** → **Link do GitHuba** → link do tego repozytorium (bierze `addon.zip` z ostatniego
wydania). Działa z HomeApps 2.4.0 lub nowszym.

---

## Dla autorów

Vue 3 + TypeScript + Vite. Ta sama aplikacja działa samodzielnie (`npm run dev`, token w `localStorage`) i jako
dodatek HomeMix (`src/homemix/`, token w `storage.user`).

```
npm install
npm run dev     # sama aplikacja: http://localhost:5173
npm run mix     # jako dodatek w udawanym HomeApps: http://localhost:5180 (wybierz „Moje konto”)
npm run check   # sprawdzenia, które robi HomeApps przy dodawaniu
npm run pack    # addon.zip z SHA-256
```

Wydanie: podnieś `version` w `public/homemix.json`, commit, `git tag v1.1.0 && git push origin v1.1.0`. Workflow
`.github/workflows/release.yml` sprawdza, że tag zgadza się z wersją, i dołącza `addon.zip` do wydania. Przewodnik:
[docs/homemix-authoring.md](https://github.com/Qwerex56/HomeApps/blob/master/docs/homemix-authoring.md).

- `src/api/` – zapytania do GIR / Mapal i ich typy. Nic innego nie łączy się z siecią.
- `src/domain/` – czyste funkcje bez Vue: daty i okna wniosków, godziny i zarobki, kody wniosków, grafik.
- `src/composables/` – stan i akcje: sesja (token), czas pracy, wnioski, szczegóły zmiany.
- `src/components/` – komponenty Vue; `App.vue` pokazuje logowanie, panel albo widżet (`ShiftWidget.vue`).
- `src/homemix/` – działanie w HomeApps: wykrycie ramki i miejsce na token.

Poprzednia wersja jest w `.old/`.
