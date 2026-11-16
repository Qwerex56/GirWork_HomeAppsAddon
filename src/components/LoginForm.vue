<script setup lang="ts">
import { ref } from 'vue'
import { errorMessage, useSession } from '../composables/useSession'

const { login } = useSession()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function submit(): Promise<void> {
  if (!username.value.trim() || !password.value) {
    error.value = 'Uzupełnij e-mail i hasło.'
    return
  }

  isLoading.value = true
  error.value = ''
  try {
    await login(username.value.trim(), password.value)
  } catch (e) {
    error.value = errorMessage(e, 'Nie udało się zalogować.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form class="card login" @submit.prevent="submit">
    <p class="eyebrow">GIR Work Time Counter</p>
    <h1>Logowanie</h1>

    <label class="field">
      <span>E-mail / login</span>
      <input v-model="username" type="email" autocomplete="username" />
    </label>

    <label class="field">
      <span>Hasło</span>
      <input v-model="password" type="password" autocomplete="current-password" />
    </label>

    <p v-if="error" class="error">{{ error }}</p>

    <button class="button primary" type="submit" :disabled="isLoading">
      {{ isLoading ? 'Logowanie…' : 'Zaloguj się' }}
    </button>
  </form>
</template>

<style scoped>
.login {
  width: min(420px, 100%);
  display: grid;
  gap: 14px;
  margin: 10vh auto 0;
}
</style>
