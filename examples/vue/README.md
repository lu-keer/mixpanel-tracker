# Vue Example

This example demonstrates the browser SDK, Vue plugin, `useMixpanel`, runtime common properties, and Vue Router page-view tracking.

## Setup

```sh
yarn install
```

Copy the environment file and add a Mixpanel project token if you want to send real events:

```sh
cp examples/vue/.env.example examples/vue/.env
```

With an empty token, tracking is disabled and no events are sent.

## Run

```sh
yarn example:vue:dev
```

## Typecheck

```sh
yarn workspace @mixchunk/mixpanel-tracker-example-vue typecheck
```