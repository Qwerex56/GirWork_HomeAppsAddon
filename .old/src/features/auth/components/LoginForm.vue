<script setup lang="ts">
const props = defineProps<{
  email: string
  password: string
  errorMessage: string
  isLoading: boolean
}>()

const emit = defineEmits<{
  (event: 'update:email', value: string): void
  (event: 'update:password', value: string): void
  (event: 'login'): void
}>()
</script>

<template>
  <section class="auth-panel">
    <div class="auth-card">
      <div class="auth-heading">
        <p class="eyebrow">Gir Work Time Counter</p>
        <h1>Logowanie JWT</h1>
      </div>

      <label class="input-wrap">
        <span>E-mail / login</span>
        <input
          :value="props.email"
          type="email"
          autocomplete="username"
          placeholder="E-mail / login"
          @input="emit('update:email', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="input-wrap">
        <span>Hasło</span>
        <input
          :value="props.password"
          type="password"
          autocomplete="current-password"
          placeholder="Hasło"
          @input="emit('update:password', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <p v-if="props.errorMessage" class="error-message">{{ props.errorMessage }}</p>

      <button class="primary-button" :disabled="props.isLoading" @click="emit('login')">
        {{ props.isLoading ? 'Logowanie...' : 'Zaloguj się' }}
      </button>

      <div class="info-box">
        <h2>Wymagane dane</h2>
        <p>
          Aplikacja wysyła żądanie do token endpointu oraz pobiera ShiftStaff/Shifts i
          AttendanceHistory po poprawnym logowaniu.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-panel {
  width: min(100%, 1100px);
}

.auth-card,
.topbar,
.summary-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
}

.auth-card {
  max-width: 440px;
  margin: 0 auto;
  padding: 28px;
}

.auth-heading {
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #8b5cf6;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.8rem);
  color: white;
}

h2 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: white;
}

.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  color: #cbd5e1;
  font-size: 0.92rem;
}

.input-wrap input {
  width: 100%;
  background: rgba(148, 163, 184, 0.08);
  color: white;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 14px 16px;
  outline: none;
}

.input-wrap input:focus {
  border-color: rgba(139, 92, 246, 0.8);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18);
}

.primary-button {
  width: 100%;
  padding: 14px 16px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error-message {
  margin: 0 0 14px;
  color: #fca5a5;
  font-size: 0.88rem;
}

.info-box {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.info-box p {
  margin: 0;
  line-height: 1.5;
}
</style>
