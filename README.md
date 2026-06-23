# Mixpanel Tracker

用于在浏览器、Vue 和 Nuxt 项目中接入 Mixpanel 埋点的 TypeScript SDK。

## 安装

```sh
yarn add @mixchunk/mixpanel-tracker mixpanel-browser
```

Vue 是可选依赖，仅在使用 Vue 集成时需要安装：

```sh
yarn add vue
```

如果需要使用 Vue Router 页面浏览辅助函数，再安装 Vue Router：

```sh
yarn add vue-router
```

## 核心用法

```ts
import { createTracker } from '@mixchunk/mixpanel-tracker'

const tracker = createTracker({
  token: import.meta.env.VITE_MIXPANEL_TOKEN,
  enabled: true,
  debug: import.meta.env.DEV,
  apiHost: 'https://api.mixpanel.com',
  persistence: 'localStorage',
  commonProperties: {
    app_name: 'web-console',
    platform: 'web',
  },
  getCommonProperties: () => ({
    route_path: location.pathname,
  }),
  onError: (error) => {
    console.warn('Tracking failed', error)
  },
})

tracker.track('Page Viewed', {
  page_path: location.pathname,
})
```

核心 SDK 只会在浏览器环境中初始化 `mixpanel-browser`。在 SSR、测试或其他非浏览器环境中，可以安全创建 tracker，所有 Mixpanel 调用都会变成 no-op。

支持的核心方法：

- `track(eventName, properties)`
- `identify(userId)`
- `setUserProperties(properties)`
- `registerCommonProperties(properties)`
- `unregisterCommonProperty(name)`
- `reset()`

属性合并优先级如下：

```text
commonProperties < getCommonProperties() < registerCommonProperties() < track properties
```

`beforeTrack` 会在属性合并之后执行。它可以返回 `false` 阻止事件上报，返回对象替换最终属性，或不返回内容以继续使用合并后的属性。

SDK 会捕获埋点过程中的错误。可以通过 `onError` 上报到业务日志系统；当 `debug: true` 时，SDK 也会向控制台输出调试信息。

## Vue 用法

Vue 3 集成提供 Plugin、Composition API composable、`$mixpanel` 全局属性，以及可选的 Vue Router 页面浏览辅助函数。

### 安装 Plugin

```ts
import { createApp } from 'vue'
import { createTracker } from '@mixchunk/mixpanel-tracker'
import { createVueMixpanel } from '@mixchunk/mixpanel-tracker/vue'

const tracker = createTracker({ token: import.meta.env.VITE_MIXPANEL_TOKEN })

createApp(App).use(createVueMixpanel(tracker)).mount('#app')
```

### Composition API

```ts
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'

const mixpanel = useMixpanel()

mixpanel.track('Button Clicked', {
  button_name: 'Create Project',
})
```

如果需要业务事件类型提示，可以把事件映射类型传给 `useMixpanel`：

```ts
type AppEventMap = {
  'Project Created': {
    project_id: string
  }
}

const mixpanel = useMixpanel<AppEventMap>()
```

### Options API

```ts
export default {
  mounted() {
    this.$mixpanel.track('Page Viewed', {
      page_name: 'Dashboard',
    })
  },
}
```

### Vue Router 页面浏览

```ts
import { setupVueRouterTracking } from '@mixchunk/mixpanel-tracker/vue'

setupVueRouterTracking(router, tracker, {
  eventName: 'Page Viewed',
  getProperties: (to, from) => ({
    page_path: to.fullPath,
    page_name: String(to.name || ''),
    referrer_path: from.fullPath,
  }),
})
```

`getProperties` 可以返回 `false` 来跳过某次路由变化。该辅助函数会返回 `router.afterEach` 的移除函数。

## Nuxt 用法

Nuxt 3/4 集成通过 `@mixchunk/mixpanel-tracker/nuxt` 提供 Nuxt Module。它会注册 client-only plugin，提供 `$mixpanel`，并可在路由跳转后自动上报页面浏览事件。

```ts
export default defineNuxtConfig({
  modules: ['@mixchunk/mixpanel-tracker/nuxt'],
  mixpanelTracker: {
    token: process.env.NUXT_PUBLIC_MIXPANEL_TOKEN,
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
    persistence: 'localStorage',
    commonProperties: {
      app_name: 'nuxt-web',
      platform: 'web',
    },
    trackPageView: true,
    pageViewEventName: 'Page Viewed',
  },
})
```

该模块会把默认配置写入 `runtimeConfig.public.mixpanelTracker`。由于 Mixpanel Project Token 会在浏览器中使用，应将其视为公开运行时配置，而不是私有服务端密钥。

在 Nuxt app context 中使用注入的 tracker：

```ts
const { $mixpanel } = useNuxtApp()

$mixpanel.track('Button Clicked', {
  button_name: 'Upgrade Plan',
})
```

client plugin 还会为公共事件属性补充路由信息：

```text
route_path
route_name
```

自动页面浏览只会在路由变化时触发。模块初始化时不会额外发送首屏页面事件。

如果需要 `beforeTrack`、`onError` 或自定义路由属性等高级回调，可以创建手动的 `.client.ts` Nuxt plugin，并直接调用 `createTracker`。

## 示例项目

仓库包含可运行示例，示例通过 Yarn workspaces 使用本地包。

运行 Vue 示例：

```sh
yarn install
yarn example:vue:dev
```

运行 Nuxt 示例：

```sh
yarn install
yarn example:nuxt:dev
```

两个示例都会从本地环境文件读取 Mixpanel token。只有需要发送真实事件时，才复制示例环境文件并填入 token：

```sh
cp examples/vue/.env.example examples/vue/.env
cp examples/nuxt/.env.example examples/nuxt/.env
```

当 token 为空时，示例会保持埋点禁用，不会发送事件。

## 开发

```sh
yarn install
yarn typecheck
yarn test
yarn lint
yarn build
```

本包使用 Yarn 4，并配置 `nodeLinker: node-modules`。

## 版本管理

本包使用 Changesets 管理版本和 changelog。每个对用户可见的变更在合并前都应添加 changeset：

```sh
yarn changeset
```

示例 workspace 都是 private，并已被 Changesets 忽略，因此只有 SDK 包会参与版本管理和发布。

在 `0.x` 阶段，API 仍可能随着真实项目验证快速调整。`1.x` 版本线用于表示核心 API 稳定，并提供浏览器、Vue、Nuxt 基础集成。

## CI

Pull request 和推送到 `main` 时，GitHub Actions 会使用 Node 24 与 Yarn 4.17.0 运行：

```sh
yarn install --immutable
yarn typecheck
yarn lint
yarn test
```

## 发布

release workflow 会在推送到 `main` 时运行。当存在待处理 changeset 时，Changesets 会创建或更新 version pull request。合并该 version pull request 后，会通过以下命令发布到 npm：

```sh
yarn release
```

发布需要在仓库中配置 `NPM_TOKEN` secret。当前正式包名为 `@mixchunk/mixpanel-tracker`，发布账号需要拥有 `@mixchunk` scope 的 npm 发布权限。

Changesets 还需要创建 version pull request。仓库需要在 GitHub 的 `Settings -> Actions -> General -> Workflow permissions` 中开启 `Allow GitHub Actions to create and approve pull requests`。如果组织策略不允许开启该选项，可以创建一个具有 `contents: write` 和 `pull requests: write` 权限的 fine-grained personal access token，并保存为仓库 secret：

```text
CHANGESETS_TOKEN
```

release workflow 会优先使用 `CHANGESETS_TOKEN`，未配置时回退到默认的 `github.token`。

## 迁移说明

当前 `0.1.0` 版本不需要迁移。未来的破坏性变更应记录在本节中，并在包进入 `1.x` 后通过 major 版本发布。
