<script setup lang="ts">
import { useHomeMix } from '@home-apps/vue'
import { computed } from 'vue'
import DashboardView from './components/DashboardView.vue'
import LoginForm from './components/LoginForm.vue'
import ShiftWidget from './components/ShiftWidget.vue'
import { useSession } from './composables/useSession'
import { homeMixTokenStore } from './homemix/homeMixTokenStore'
import { inHomeMix } from './homemix/inHomeMix'

const { token, restored, restore } = useSession()

// Inside HomeApps: its theme, a frame as tall as the page, and the token in the person's private add-on data.
const mix = inHomeMix ? useHomeMix() : null
if (mix) {
  document.documentElement.classList.add('in-homemix')
  mix.loaded.then(() => restore(homeMixTokenStore(mix.homemix)))
} else {
  restore()
}

const widget = computed(() => !!mix?.context.value?.widget)
</script>

<template>
  <ShiftWidget v-if="restored && widget" />
  <main v-else-if="restored" class="app">
    <DashboardView v-if="token" />
    <LoginForm v-else />
  </main>
</template>
