/** True when the app runs as a HomeMix add-on inside HomeApps' frame, false when opened on its own (npm run dev). */
export const inHomeMix = window.parent !== window
