<script setup lang="ts">
const { $mixpanel } = useNuxtApp()
const config = useRuntimeConfig()

const isEnabled = computed(() => Boolean(config.public.mixpanelTracker?.token))

function trackUpgradeClick() {
  $mixpanel.track('Button Clicked', {
    button_name: 'Upgrade Plan',
    page_name: 'Nuxt Home',
  })
}

function trackInviteSent() {
  $mixpanel.track('Invite Sent', {
    invite_role: 'member',
    source: 'nuxt-example',
  })
}
</script>

<template>
  <main class="page">
    <section class="panel">
      <h1>Nuxt tracking example</h1>
      <p>
        This page demonstrates the Nuxt module, public runtime config, injected
        <code>$mixpanel</code>, and automatic route page-view tracking.
      </p>

      <div class="actions">
        <button type="button" @click="trackUpgradeClick">Track Upgrade Click</button>
        <button type="button" class="secondary" @click="trackInviteSent">Track Invite Sent</button>
      </div>

      <p class="status">
        {{ isEnabled ? 'Tracking is enabled with NUXT_PUBLIC_MIXPANEL_TOKEN.' : 'Tracking is disabled until NUXT_PUBLIC_MIXPANEL_TOKEN is configured.' }}
      </p>

      <NuxtLink to="/settings">Open settings route</NuxtLink>
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
  margin: 0 auto;
  max-width: 820px;
  padding: 24px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0;
}

button {
  background: #1c6f5b;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  padding: 10px 14px;
}

button.secondary {
  background: #40516d;
}

.status {
  background: #eef3f8;
  border-radius: 6px;
  padding: 12px;
}
</style>