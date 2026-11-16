import { ref } from 'vue'
import * as api from '../api/client'

const TOKEN_KEY = 'gir_access_token'

function readStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

// One session for the whole app.
const token = ref(readStoredToken())
const employeeId = ref<number | null>(null)

async function login(username: string, password: string): Promise<void> {
  const newToken = await api.login(username, password)
  localStorage.setItem(TOKEN_KEY, newToken)
  token.value = newToken
  employeeId.value = null
}

function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  token.value = ''
  employeeId.value = null
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
  return { token, login, logout, requireEmployeeId, withToken }
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
