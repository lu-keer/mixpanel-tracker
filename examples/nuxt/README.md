# Nuxt Example

This example demonstrates the Nuxt 3/4 module, a shared event registry, public runtime config, strictly typed injected `$mixpanel`, custom event tracking, and automatic route page-view tracking.

The example imports the local module source from `../../src/integrations/nuxt` so it can run before the SDK package has been built. Published projects should use `modules: ['@mixchunk/mixpanel-tracker/nuxt']`.

## Setup

```sh
yarn install
```

Copy the environment file and add a Mixpanel project token if you want to send real events:

```sh
cp examples/nuxt/.env.example examples/nuxt/.env
```

With an empty token, tracking is disabled and no events are sent.

## Run

```sh
yarn example:nuxt:dev
```

## Typecheck

```sh
yarn workspace @mixchunk/mixpanel-tracker-example-nuxt typecheck
```
