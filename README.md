# GIR Work Time Counter (web)

Vue 3 + TypeScript + Vite. Shows worked and planned hours, the shift calendar, and lets you file shift requests.

```
npm install
npm run dev     # http://localhost:5173
npm run build
```

## Layout

- `src/api/` – HTTP calls to the GIR / Mapal API and their response types. Nothing else talks to the network.
- `src/domain/` – plain functions, no Vue: dates and request windows, hours and earnings, request type codes, roster names.
- `src/composables/` – state and actions: session (token), work time, shift requests, shift details.
- `src/components/` – presentational Vue components. `App.vue` shows the login form or the dashboard.

The previous implementation lives in `.old/` for reference.
