<script setup lang="ts">
const { $mixpanel } = useNuxtApp()

function trackSettingsSave() {
  $mixpanel.track('Button Clicked', {
    button_name: 'Save Settings',
    page_name: 'Nuxt Settings',
  })
}
</script>

<template>
  <main class="page">
    <section class="panel">
      <h1>Settings</h1>
      <p>Navigate between pages to trigger automatic route page-view tracking.</p>
      <button type="button" @click="trackSettingsSave">Track Save Settings</button>
      <NuxtLink to="/">Back home</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.page {
  background: #f5f7fb;
  color: #18202f;
  min-height: 100vh;
  padding: 32px;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.panel {
  background: #ffffff;
  border: 1px solid #dbe1ec;
  border-radius: 8px;
  display: grid;
  gap: 16px;
  margin: 0 auto;
  max-width: 820px;
  padding: 24px;
}

button {
  background: #1c6f5b;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  justify-self: start;
  padding: 10px 14px;
}
</style>