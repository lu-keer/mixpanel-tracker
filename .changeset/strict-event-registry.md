---
"@mixchunk/mixpanel-tracker": patch
---

Add a shared event registry for strict event names and properties across the core, Vue, and Nuxt integrations. Remove the permissive typed `track` overload while keeping unregistered trackers flexible.
