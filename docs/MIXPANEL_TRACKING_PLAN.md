# 前端 Mixpanel 埋点集成方案

## 目标

在当前目录规划并逐步实现一个可发布到 npm 的前端埋点 SDK，用于统一接入 Mixpanel。SDK 需要同时满足普通前端项目、Vue 项目、Nuxt 项目的使用，并支持业务项目定义公共属性、事件独立属性、自定义事件和后续远端版本迭代。

## 适用范围

- 任意浏览器前端项目：通过核心包直接初始化与上报。
- Vue 3 项目：通过 Vue Plugin 注入埋点能力。
- Nuxt 3 项目：通过 Nuxt Module / Plugin 注入埋点能力。
- 其他框架：通过核心包 API 接入，不强绑定 Vue 或 Nuxt。

## 包设计

建议先采用单包发布，内部按模块划分；当 Vue / Nuxt 能力明显变复杂后，再拆分为 monorepo。

推荐包名：

- 私有域：`@mixchunk/mixpanel-tracker`
- 通用名：`mixpanel-tracker`

首期目录建议：

```text
mixpanel-tracker/
  src/
    core/
      tracker.ts
      types.ts
      properties.ts
      queue.ts
    integrations/
      vue.ts
      nuxt.ts
    index.ts
  examples/
    vue/
    nuxt/
  README.md
  package.json
  tsconfig.json
  tsup.config.ts
```

## 核心能力

### 初始化

业务项目通过 `createTracker` 初始化 SDK：

```ts
import { createTracker } from '@mixchunk/mixpanel-tracker'

export const tracker = createTracker({
  token: import.meta.env.VITE_MIXPANEL_TOKEN,
  debug: import.meta.env.DEV,
  enabled: true,
  persistence: 'localStorage',
  apiHost: 'https://api.mixpanel.com',
  commonProperties: {
    app_name: 'web-console',
    app_env: import.meta.env.MODE,
    app_version: __APP_VERSION__,
  },
})
```

初始化配置建议：

| 字段 | 说明 |
| --- | --- |
| `token` | Mixpanel Project Token |
| `enabled` | 是否启用上报，便于测试环境关闭 |
| `debug` | 是否输出调试日志 |
| `apiHost` | Mixpanel API Host，支持代理或 EU 域名 |
| `persistence` | Mixpanel 持久化方式 |
| `commonProperties` | 静态公共属性 |
| `getCommonProperties` | 动态公共属性函数 |
| `beforeTrack` | 事件上报前钩子，可补充或过滤属性 |
| `onError` | SDK 内部错误回调 |

### 基础事件 API

SDK 对外暴露稳定的基础 API：

```ts
tracker.track('Button Clicked', {
  button_name: 'Save',
  page_name: 'Settings',
})

tracker.identify(userId)

tracker.setUserProperties({
  user_role: 'admin',
  company_id: 'c_001',
})

tracker.reset()

tracker.registerCommonProperties({
  locale: 'zh-CN',
})

tracker.unregisterCommonProperty('locale')
```

### 自定义事件

业务项目可以直接使用自定义事件名，也可以通过事件字典约束事件：

```ts
tracker.track('Project Created', {
  project_id: 'p_001',
  source: 'template',
})
```

更推荐在业务侧维护事件定义：

```ts
export const events = {
  projectCreated: 'Project Created',
  inviteSent: 'Invite Sent',
  billingPlanChanged: 'Billing Plan Changed',
} as const

tracker.track(events.projectCreated, {
  project_id: project.id,
  source: 'template',
})
```

## 公共属性设计

公共属性分为静态公共属性与动态公共属性。

### 静态公共属性

适合应用级、环境级、发布级信息：

```ts
createTracker({
  token,
  commonProperties: {
    app_name: 'admin-web',
    app_version: '1.2.3',
    platform: 'web',
  },
})
```

### 动态公共属性

适合运行时变化的信息，例如用户、租户、路由、实验分组：

```ts
createTracker({
  token,
  getCommonProperties: () => ({
    user_id: auth.user?.id,
    tenant_id: auth.tenant?.id,
    route_name: router.currentRoute.value.name,
    ab_group: experiment.currentGroup,
  }),
})
```

### 属性合并优先级

建议统一使用以下优先级：

```text
SDK 默认属性 < 初始化公共属性 < 动态公共属性 < registerCommonProperties < 单次事件属性 < beforeTrack 返回属性
```

这样业务在单次事件中可以覆盖公共属性，`beforeTrack` 也能作为最后治理层。

## 事件独立属性设计

每个事件的独立属性由业务项目维护，SDK 只负责类型支持、合并公共属性和发送。

推荐事件定义格式：

```ts
type AppEventMap = {
  'Project Created': {
    project_id: string
    source: 'blank' | 'template' | 'import'
  }
  'Invite Sent': {
    invitee_email: string
    invite_role: 'admin' | 'member'
  }
}
```

如果实现 TypeScript 类型增强，可以提供泛型：

```ts
const tracker = createTracker<AppEventMap>({ token })

tracker.track('Project Created', {
  project_id: 'p_001',
  source: 'template',
})
```

收益：

- 事件名自动补全。
- 每个事件只允许传入自身属性。
- 属性类型在编译期校验。
- SDK 仍然兼容无类型的普通 JavaScript 项目。

## Vue 接入方案

### 插件安装

```ts
import { createApp } from 'vue'
import { createTracker, createVueMixpanel } from '@mixchunk/mixpanel-tracker'

const tracker = createTracker({ token })

const app = createApp(App)

app.use(createVueMixpanel(tracker))
app.mount('#app')
```

### 组件内使用

```ts
import { useMixpanel } from '@mixchunk/mixpanel-tracker/vue'

const mixpanel = useMixpanel()

mixpanel.track('Button Clicked', {
  button_name: 'Create Project',
})
```

### 路由埋点

Vue Router 页面浏览事件可由业务控制是否启用：

```ts
router.afterEach((to, from) => {
  tracker.track('Page Viewed', {
    page_path: to.fullPath,
    page_name: String(to.name || ''),
    referrer_path: from.fullPath,
  })
})
```

SDK 可以提供辅助函数：

```ts
setupVueRouterTracking(router, tracker, {
  eventName: 'Page Viewed',
  getProperties: (to, from) => ({
    page_path: to.fullPath,
    page_name: String(to.name || ''),
    referrer_path: from.fullPath,
  }),
})
```

## Nuxt 接入方案

### Nuxt Plugin

```ts
// plugins/mixpanel.client.ts
import { createTracker } from '@mixchunk/mixpanel-tracker'

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()

  const tracker = createTracker({
    token: runtimeConfig.public.mixpanelToken,
    enabled: process.client,
    getCommonProperties: () => ({
      route_path: useRoute().fullPath,
    }),
  })

  nuxtApp.provide('mixpanel', tracker)
})
```

### Nuxt Composable

业务项目可封装：

```ts
export const useMixpanelTracker = () => {
  const { $mixpanel } = useNuxtApp()
  return $mixpanel
}
```

后续 SDK 可以内置 Nuxt Module：

```ts
export default defineNuxtConfig({
  modules: ['@mixchunk/mixpanel-tracker/nuxt'],
  mixpanelTracker: {
    token: process.env.NUXT_PUBLIC_MIXPANEL_TOKEN,
    trackPageView: true,
  },
})
```

Nuxt 侧必须注意：

- 只在 client 端初始化 Mixpanel。
- token 使用 `runtimeConfig.public` 注入。
- SSR 阶段不访问 `window`、`document`、`localStorage`。
- 自动页面浏览事件应允许业务关闭或自定义属性。

## 事件治理规范

### 命名规范

建议事件名使用英文过去式或业务动作名：

```text
Page Viewed
Button Clicked
Project Created
Invite Sent
Billing Plan Changed
```

属性命名建议使用 snake_case：

```text
project_id
button_name
page_path
tenant_id
```

### 事件字典

实际项目中建议维护单独文件：

```text
src/analytics/
  events.ts
  properties.ts
  tracker.ts
```

职责：

- `events.ts`：定义所有事件名与事件属性类型。
- `properties.ts`：定义公共属性来源。
- `tracker.ts`：初始化 SDK 并导出业务统一实例。

### 隐私与安全

默认不允许上报：

- 明文手机号、邮箱、身份证号。
- access token、refresh token、session id。
- 完整地址、银行卡、支付密码。
- 大段用户输入内容。

如确需用户标识，建议使用业务内部 user id 或哈希值。

## npm 发布方案

### 构建产物

推荐使用 TypeScript + tsup 输出：

```text
dist/
  index.mjs
  index.cjs
  index.d.ts
  vue.mjs
  vue.d.ts
  nuxt.mjs
  nuxt.d.ts
```

`package.json` 建议：

```json
{
  "name": "@mixchunk/mixpanel-tracker",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./vue": {
      "types": "./dist/vue.d.ts",
      "import": "./dist/vue.mjs"
    },
    "./nuxt": {
      "types": "./dist/nuxt.d.ts",
      "import": "./dist/nuxt.mjs"
    }
  },
  "peerDependencies": {
    "mixpanel-browser": "^2.0.0",
    "vue": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "vue": {
      "optional": true
    }
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

发布流程：

1. 使用 `changesets` 管理版本与 changelog。
2. PR 合并后由 CI 运行 lint、test、typecheck。
3. 合并到主分支后手动或自动执行 `npm publish --access public`。
4. 业务项目通过 semver 控制升级节奏。

### 版本策略

- `0.x`：内部试用期，API 可快速调整。
- `1.x`：核心 API 稳定，支持 Vue / Nuxt 基础接入。
- minor：新增能力，保持兼容。
- patch：修复问题。
- major：破坏性变更。

## 实施路线

### 第一阶段：核心 SDK

- 实现 `createTracker`。
- 封装 Mixpanel 初始化、track、identify、people.set、reset。
- 支持静态公共属性、动态公共属性、运行时公共属性。
- 支持 `beforeTrack`、`onError`、`enabled`、`debug`。
- 提供 TypeScript 类型定义。

### 第二阶段：Vue 集成

- 实现 Vue Plugin。
- 实现 `useMixpanel`。
- 提供 Vue Router 页面浏览辅助函数。
- 增加 Vue 示例项目。

### 第三阶段：Nuxt 集成

- 提供 Nuxt client plugin 示例。
- 实现 Nuxt Module。
- 支持 runtime config。
- 支持自动页面浏览事件配置。
- 增加 Nuxt 示例项目。

### 第四阶段：工程化发布

- 配置 tsup、TypeScript、eslint、vitest。
- 配置 changesets。
- 配置 GitHub Actions 发布流程。
- 完善 README、API 文档、迁移说明。

## 验证策略

默认优先轻量验证：

- `npm run typecheck`：验证类型。
- `npm run lint`：验证代码风格。
- `npm run test`：验证属性合并、事件过滤、Vue 注入等核心逻辑。

不默认运行重型构建；只有修改构建配置、发布配置或用户明确要求时再运行 `npm run build`。

核心测试用例：

- 未启用 SDK 时不调用 Mixpanel。
- 初始化公共属性与事件属性正确合并。
- 动态公共属性每次上报都会重新读取。
- 单事件属性可覆盖公共属性。
- `beforeTrack` 可以修改或阻止事件。
- Vue Plugin 能正确 provide / inject。
- Nuxt 环境不会在 SSR 阶段访问浏览器 API。

## 推荐对外 API 草案

```ts
export interface MixpanelTrackerOptions {
  token: string
  enabled?: boolean
  debug?: boolean
  apiHost?: string
  persistence?: 'cookie' | 'localStorage' | 'none'
  commonProperties?: Record<string, unknown>
  getCommonProperties?: () => Record<string, unknown>
  beforeTrack?: (
    eventName: string,
    properties: Record<string, unknown>
  ) => false | Record<string, unknown> | void
  onError?: (error: unknown) => void
}

export interface MixpanelTracker<EventMap = Record<string, Record<string, unknown>>> {
  track<EventName extends keyof EventMap & string>(
    eventName: EventName,
    properties: EventMap[EventName]
  ): void
  track(eventName: string, properties?: Record<string, unknown>): void
  identify(userId: string): void
  setUserProperties(properties: Record<string, unknown>): void
  registerCommonProperties(properties: Record<string, unknown>): void
  unregisterCommonProperty(name: string): void
  reset(): void
}
```

## 风险与约束

- Mixpanel token 属于前端公开配置，不能放入私密服务端密钥。
- SDK 不应直接耦合业务用户系统，只接收业务传入的用户和租户属性。
- 自动页面浏览事件不能默认假设所有项目路由结构一致。
- Nuxt 集成必须避免 SSR 阶段访问浏览器环境。
- 公共属性过多会影响分析质量，需要业务侧做字段治理。
- 发布 npm 后需要严格维护 semver，避免破坏业务项目。

## 建议下一步

1. 初始化 TypeScript npm 包。
2. 添加 `mixpanel-browser` 作为 peer dependency。
3. 先实现核心 SDK 和属性合并逻辑。
4. 补充单元测试。
5. 再接 Vue Plugin 与 Nuxt 示例。
