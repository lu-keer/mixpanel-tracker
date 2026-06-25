# Mixpanel Tracker

面向浏览器、Vue 3 和 Nuxt 3/4 项目的 Mixpanel 埋点 SDK。

它的目标是让业务项目用更少的样板代码完成 Mixpanel 接入：统一初始化、统一公共属性、统一事件上报，并在 Vue / Nuxt 中提供符合框架习惯的使用方式。

## 特性

- **开箱即用的 Mixpanel 封装**：封装 `track`、`identify`、`people.set`、`reset` 等常用能力。
- **Vue / Nuxt 友好**：提供 Vue Plugin、`useMixpanel()`、Vue Router 页面浏览埋点，以及 Nuxt Module。
- **公共属性统一治理**：支持静态公共属性、动态公共属性、运行时公共属性和 `beforeTrack` 上报前钩子。
- **TypeScript 类型提示**：业务项目可以为事件名和事件属性定义类型，获得自动补全和编译期校验。
- **SSR 安全**：非浏览器环境下不会初始化 `mixpanel-browser`，SSR、测试环境可安全创建 tracker。
- **可控开关**：通过 `enabled` 关闭埋点，适合本地开发、测试环境和未配置 token 的预览环境。

## Vue 3 项目接入

### 安装

```sh
yarn add @mixchunk/mixpanel-tracker
```

前置条件：项目已使用 Vue 3；如果需要自动上报路由页面浏览事件，项目需已接入 Vue Router 4。

### 配置环境变量

```env
VITE_MIXPANEL_TOKEN=your_project_token
```

Mixpanel Project Token 会暴露在浏览器中，应视为公开配置。不要在前端环境变量中放入服务端密钥或其他敏感凭据。

### 创建 tracker

建议在业务项目中创建统一入口，例如 `src/analytics/tracker.ts`：

```ts
import { createTracker } from '@mixchunk/mixpanel-tracker'

export const tracker = createTracker({
  token: import.meta.env.VITE_MIXPANEL_TOKEN,
  enabled: Boolean(import.meta.env.VITE_MIXPANEL_TOKEN),
  debug: import.meta.env.DEV,
  persistence: 'localStorage',
  commonProperties: {
    app_name: 'admin-web',
    platform: 'web',
  },
  getCommonProperties: () => ({
    route_path: location.pathname,
  }),
  onError: (error) => {
    console.warn('[analytics] tracking failed', error)
  },
})
```

### 注册 Vue Plugin

```ts
import { createApp } from 'vue'
import { createVueMixpanel } from '@mixchunk/mixpanel-tracker/vue'
import { tracker } from './analytics/tracker'
import App from './App.vue'

createApp(App).use(createVueMixpanel(tracker)).mount('#app')
```

### 在组件中上报事件

Composition API：

```ts
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'

const mixpanel = useMixpanel()

mixpanel.track('Button Clicked', {
  button_name: 'Save',
  page_name: 'Settings',
})
```

Options API：

```ts
export default {
  mounted() {
    this.$mixpanel.track('Page Viewed', {
      page_name: 'Dashboard',
    })
  },
}
```

### 自动上报路由页面浏览

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { setupVueRouterTracking } from '@mixchunk/mixpanel-tracker/vue'
import { tracker } from './analytics/tracker'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

setupVueRouterTracking(router, tracker, {
  eventName: 'Page Viewed',
  getProperties: (to, from) => ({
    page_path: to.fullPath,
    page_name: String(to.name || ''),
    referrer_path: from.fullPath,
  }),
})
```

`getProperties` 返回 `false` 时会跳过本次路由变化。

## Nuxt 3/4 项目接入

### 安装

```sh
yarn add @mixchunk/mixpanel-tracker
```

前置条件：项目已使用 Nuxt 3 或 Nuxt 4。

### 配置环境变量

```env
NUXT_PUBLIC_MIXPANEL_TOKEN=your_project_token
```

### 启用 Nuxt Module

在 `nuxt.config.ts` 中注册模块：

```ts
export default defineNuxtConfig({
  modules: ['@mixchunk/mixpanel-tracker/nuxt'],
  mixpanelTracker: {
    token: process.env.NUXT_PUBLIC_MIXPANEL_TOKEN,
    enabled: Boolean(process.env.NUXT_PUBLIC_MIXPANEL_TOKEN),
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

该模块会注册 client-only typed plugin，并向 Nuxt app context 注入 `$mixpanel`。执行 `nuxi prepare` 后，编辑器应能为 `$mixpanel.track`、`identify`、`setUserProperties`、`reset` 等方法提供类型提示。

### 在 Nuxt 中上报事件

```ts
const { $mixpanel } = useNuxtApp()

$mixpanel.track('Button Clicked', {
  button_name: 'Upgrade Plan',
})
```

模块会自动为事件补充路由公共属性：

```text
route_path
route_name
```

开启 `trackPageView` 后，页面浏览事件会在路由变化时上报。模块初始化时不会额外发送首屏页面事件。

### 高级自定义

如果项目需要 `beforeTrack`、`onError` 或更复杂的动态属性，可以不使用 Nuxt Module，改为创建手动 client plugin：

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      mixpanelToken: process.env.NUXT_PUBLIC_MIXPANEL_TOKEN,
    },
  },
})
```

```ts
// plugins/mixpanel.client.ts
import { createTracker } from '@mixchunk/mixpanel-tracker'
import type { MixpanelTracker } from '@mixchunk/mixpanel-tracker'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const route = useRoute()

  const tracker: MixpanelTracker = createTracker({
    token: config.public.mixpanelToken,
    enabled: Boolean(config.public.mixpanelToken),
    getCommonProperties: () => ({
      route_path: route.fullPath,
      route_name: String(route.name || ''),
    }),
    beforeTrack: (eventName, properties) => {
      if (properties.skip_tracking) {
        return false
      }

      return properties
    },
  })

  return {
    provide: {
      mixpanel: tracker,
    },
  }
})
```

为获得 Nuxt / Volar / ts-plugin 的稳定类型提示，手动插件也推荐使用 `return { provide }` 注入 `$mixpanel`，不要将 `nuxtApp.provide(...)` 作为主要注入方式。升级依赖后如果编辑器仍显示旧类型，执行 `nuxi prepare` 并重启 TypeScript Server。

## 普通浏览器项目接入

### 安装

```sh
yarn add @mixchunk/mixpanel-tracker
```

前置条件：项目运行在浏览器环境，并能提供公开的 Mixpanel Project Token。

### 创建并使用 tracker

```ts
import { createTracker } from '@mixchunk/mixpanel-tracker'

const tracker = createTracker({
  token: import.meta.env.VITE_MIXPANEL_TOKEN,
  enabled: Boolean(import.meta.env.VITE_MIXPANEL_TOKEN),
  debug: import.meta.env.DEV,
  commonProperties: {
    app_name: 'web-app',
    platform: 'web',
  },
})

tracker.track('Page Viewed', {
  page_path: location.pathname,
  page_title: document.title,
})
```

核心包不依赖 Vue 或 Nuxt，可以在浏览器前端项目中直接使用。

## TypeScript 事件类型

业务项目可以声明事件映射，让事件名和属性获得类型提示：

```ts
import { createTracker } from '@mixchunk/mixpanel-tracker'

type AppEventMap = {
  'Project Created': {
    project_id: string
    source: 'blank' | 'template'
  }
  'Invite Sent': {
    invitee_role: 'admin' | 'member'
    source: 'settings' | 'project'
  }
}

export const tracker = createTracker<AppEventMap>({
  token: import.meta.env.VITE_MIXPANEL_TOKEN,
})

tracker.track('Project Created', {
  project_id: 'p_001',
  source: 'template',
})
```

Vue 组件中也可以复用同一份事件类型：

```ts
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'
import type { AppEventMap } from '@/analytics/events'

const mixpanel = useMixpanel<AppEventMap>()
```

## 公共属性

公共属性用于给每个事件补充统一上下文，例如应用名、版本、路由、租户、用户角色等。

### 静态公共属性

```ts
createTracker({
  token,
  commonProperties: {
    app_name: 'admin-web',
    app_version: '1.2.3',
    app_env: import.meta.env.MODE,
    platform: 'web',
  },
})
```

### 动态公共属性

`getCommonProperties` 会在每次 `track` 时执行，适合读取路由、登录态、租户等运行时信息：

```ts
createTracker({
  token,
  getCommonProperties: () => ({
    route_path: router.currentRoute.value.fullPath,
    route_name: String(router.currentRoute.value.name || ''),
    tenant_id: auth.currentTenantId,
  }),
})
```

### 运行时公共属性

```ts
tracker.registerCommonProperties({
  user_id: user.id,
  tenant_id: user.tenantId,
})

tracker.unregisterCommonProperty('tenant_id')
```

属性合并优先级如下，右侧会覆盖左侧同名字段：

```text
commonProperties < getCommonProperties() < registerCommonProperties() < track properties
```

## 用户识别

用户登录后可以绑定 Mixpanel distinct id，并设置用户属性：

```ts
tracker.identify(user.id)

tracker.setUserProperties({
  user_role: user.role,
  company_id: user.companyId,
})
```

用户退出登录时建议调用：

```ts
tracker.reset()
```

## 上报前处理

`beforeTrack` 会在属性合并之后执行，可用于过滤事件或统一补充最终属性：

```ts
const tracker = createTracker({
  token,
  beforeTrack: (eventName, properties) => {
    if (properties.skip_tracking) {
      return false
    }

    return {
      ...properties,
      event_source: 'web',
    }
  },
})
```

## API 速查

### `createTracker(options)`


| 字段                    | 类型                                                 | 说明                     |
| --------------------- | -------------------------------------------------- | ---------------------- |
| `token`               | `string`                                           | Mixpanel Project Token |
| `enabled`             | `boolean`                                          | 是否启用埋点，默认为 `true`      |
| `debug`               | `boolean`                                          | 是否输出调试日志               |
| `apiHost`             | `string`                                           | 自定义 Mixpanel API Host  |
| `persistence`         | `'cookie' | 'localStorage' | 'none'`               | Mixpanel 持久化方式         |
| `commonProperties`    | `Record<string, unknown>`                          | 静态公共属性                 |
| `getCommonProperties` | `() => Record<string, unknown>`                    | 动态公共属性                 |
| `beforeTrack`         | `(eventName, properties) => false | object | void` | 上报前处理或过滤               |
| `onError`             | `(error) => void`                                  | SDK 内部错误回调             |


### Tracker 方法


| 方法                                     | 说明                                      |
| -------------------------------------- | --------------------------------------- |
| `track(eventName, properties?)`        | 上报事件                                    |
| `identify(userId)`                     | 绑定 Mixpanel distinct id                 |
| `setUserProperties(properties)`        | 设置用户属性                                  |
| `registerCommonProperties(properties)` | 注册运行时公共属性                               |
| `unregisterCommonProperty(name)`       | 删除单个运行时公共属性                             |
| `reset()`                              | 重置 Mixpanel 状态并清空运行时公共属性                |
| `getState()`                           | 获取 `enabled`、`initialized`、`browser` 状态 |


## 建议的业务侧组织方式

推荐在业务项目中集中管理埋点代码：

```text
src/
  analytics/
    events.ts
    tracker.ts
    properties.ts
```

- `events.ts`：维护事件名和事件属性类型。
- `tracker.ts`：初始化并导出项目唯一 tracker。
- `properties.ts`：封装公共属性、用户属性或路由属性读取逻辑。

事件名建议使用英文动作或过去式：

```text
Page Viewed
Button Clicked
Project Created
Invite Sent
Billing Plan Changed
```

属性名建议使用 `snake_case`：

```text
project_id
button_name
page_path
tenant_id
```

## 隐私与安全

默认不要上报以下内容：

- 明文手机号、邮箱、身份证号、银行卡号。
- access token、refresh token、session id。
- 完整地址、支付密码、验证码。
- 大段用户输入内容或可能包含隐私的数据。

如确需关联用户，优先使用业务内部 user id、tenant id 或经过业务确认的匿名标识。