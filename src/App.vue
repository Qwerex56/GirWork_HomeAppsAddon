<script setup lang="ts">
import DashboardView from './components/DashboardView.vue'
import LoginForm from './components/LoginForm.vue'
import { useSession } from './composables/useSession'

const { token } = useSession()
</script>

<template>
  <main class="app">
    <DashboardView v-if="token" />
    <LoginForm v-else />
  </main>
</template>
