import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Relative paths: HomeApps serves the add-on at /homemix/run/<installation>/. public/homemix.json lands in dist.
export default defineConfig({
  base: './',
  plugins: [vue()],
  // @homemix/vue is linked from the HomeApps checkout: use this app's Vue, not a second copy from there.
  resolve: { dedupe: ['vue'] },
})
