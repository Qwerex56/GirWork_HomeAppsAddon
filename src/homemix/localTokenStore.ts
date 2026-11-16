import type { TokenStore } from './tokenStore'

const TOKEN_KEY = 'gir_access_token'

/** The browser's localStorage, for the app opened on its own. The HomeMix sandbox has no localStorage. */
export const localTokenStore: TokenStore = {
  async read() {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? ''
    } catch {
      return ''
    }
  },
  async write(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  async clear() {
    localStorage.removeItem(TOKEN_KEY)
  },
}
