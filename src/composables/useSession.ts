import { ref } from 'vue'
import * as api from '../api/client'
import { localTokenStore } from '../homemix/localTokenStore'
import type { TokenStore } from '../homemix/tokenStore'

// One session for the whole app.
let store: TokenStore = localTokenStore
const token = ref('')
const restored = ref(false)
const employeeId = ref<number | null>(null)

/** Picks where the token lives (HomeMix data inside HomeApps) and reads the saved one. Call once at start. */
async function restore(next: TokenStore = localTokenStore): Promise<void> {
  store = next
  try {
    token.value = await store.read()
  } catch {
    token.value = ''
  } finally {
    restored.value = true
  }
}

async function login(username: string, password: string): Promise<void> {
  const newToken = await api.login(username, password)
  await store.write(newToken)
  token.value = newToken
  employeeId.value = null
}

function logout(): void {
  token.value = ''
  employeeId.value = null
  store.clear().catch(() => {})
}

async function requireEmployeeId(): Promise<number> {
  employeeId.value ??= await api.fetchEmployeeId(token.value)
  if (!employeeId.value) throw new Error('Brak identyfikatora pracownika. Zaloguj się ponownie.')
  return employeeId.value
}

/** Runs an API call with the current token and logs out when the token has expired. */
async function withToken<T>(action: (token: string) => Promise<T>): Promise<T> {
  try {
    return await action(token.value)
  } catch (error) {
    if (error instanceof api.UnauthorizedError) logout()
    throw error
  }
}

export function useSession() {
  return { token, restored, restore, login, logout, requireEmployeeId, withToken }
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
