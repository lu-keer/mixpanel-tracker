import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@mixchunk/mixpanel-tracker': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      '@mixchunk/mixpanel-tracker/vue': fileURLToPath(
        new URL('../../src/integrations/vue.ts', import.meta.url),
      ),
    },
  },
})