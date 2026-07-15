<script setup lang="ts">
const { $mixpanel } = useNuxtApp()

$mixpanel.track('Button Clicked', {
  button_name: 'Upgrade Plan',
  page_name: 'Nuxt Home',
})

// @ts-expect-error Registered Nuxt trackers reject unknown events.
$mixpanel.track('Unknown Event', {})

// @ts-expect-error Registered Nuxt event properties are required.
$mixpanel.track('Invite Sent')

$mixpanel.track('Invite Sent', {
  // @ts-expect-error Registered Nuxt event property literals are enforced.
  invite_role: 'owner',
  source: 'nuxt-example',
})
</script>

<template>
  <div />
</template>
