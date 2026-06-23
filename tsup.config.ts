import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vue: 'src/integrations/vue.ts',
    nuxt: 'src/integrations/nuxt.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  sourcemap: true,
  clean: true,
  target: 'es2020',
  platform: 'browser',
  tsconfig: 'tsconfig.build.json',
  external: ['#app', '@nuxt/kit', 'mixpanel-browser', 'nuxt', 'vue', 'vue-router'],
})