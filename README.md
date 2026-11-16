# GIR Work Time Counter (web)

Vue 3 + TypeScript + Vite. Shows worked and planned hours, the shift calendar, and lets you file shift requests.

```
npm install
npm run dev     # http://localhost:5173
npm run build
```

## HomeMix add-on (HomeApps)

The same app is an unofficial HomeMix add-on `gir-czas-pracy` for a person's own account (not households): a page
"Czas pracy" and a widget with this month's hours in "Moje aplikacje". It only talks to GIR; HomeApps keeps the GIR
session token in the person's private add-on data (`storage.user`), never the password.

The HomeMix tooling is not on npm yet, so it comes from the HomeApps checkout next to this folder
(`~/Documents/RiderProjects/HomeApps`). Build it once (and again after pulling HomeApps):

```
cd ~/Documents/RiderProjects/HomeApps/src/Web && npm ci
cd homemix && npm ci && npm run build
```

Then, here:

```
npm install
npm run mix     # builds on every change and runs a fake HomeApps at http://localhost:5180 (pick "Moje konto")
npm run check   # the checks HomeApps makes when the add-on is added
npm run pack    # addon.zip with its SHA-256
```

In HomeApps: account menu → Moje aplikacje → Dodaj dodatek → Plik zip → `addon.zip`. A zip has no updates: to try a
new build, remove the add-on and add the new zip (its data, the saved token, comes back for 30 days). Raise `version`
in `public/homemix.json` with every zip you install.

Inside HomeApps the app runs in a sandbox: no `localStorage` (`src/homemix/`), colleagues' photos from other sites
are blocked (initials show instead), and GIR's API must answer CORS for the origin `null`.

## Layout

- `src/api/` – HTTP calls to the GIR / Mapal API and their response types. Nothing else talks to the network.
- `src/domain/` – plain functions, no Vue: dates and request windows, hours and earnings, request type codes, roster names.
- `src/composables/` – state and actions: session (token), work time, shift requests, shift details.
- `src/components/` – presentational Vue components. `App.vue` shows the login form, the dashboard or the HomeMix widget.
- `src/homemix/` – running inside HomeApps: detecting the frame and where the token is kept.

The previous implementation lives in `.old/` for reference.
