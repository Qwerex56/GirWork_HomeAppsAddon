import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Relative paths: HomeApps serves the add-on at /homemix/run/<installation>/. public/homemix.json lands in dist.
export default defineConfig({
  base: './',
  plugins: [vue()],
})
