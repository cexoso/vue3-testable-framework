
<video width="320" height="240" controls>
    <source src="./video/on_shell.mov" type="video/mp4">
</video>

# 摘要
本篇文章用于分享如何基于 vue3 搭建一个测试友好的框架，搭建完成后你将得到一个可以使用行为测试驱动开发的 vue3 项目。
本文会以一个简单的 Todo List 项目为例子，并且为了演示测试的覆盖范围，还会添加 vue-router、pinia，以演示测试如何覆盖到这些组件的。
Todo List 项目地址：https://github.com/cexoso/vue3-testable-framework/tree/main
最终效果演示
暂时无法在飞书文档外展示此内容

# 如何确定一个项目的可测试性
以一个测试用例的结构下手，一个测试用例分为三部分：
1. 准备测试环境
2. 运行需要测试的代码
3. 检查最终的结果

一个测试用例的构建分为以上三步，通常在测试完成后我们需要清理测试环境，这与准备测试环境可以放在一个步骤中。

以下让我们逐个分析每一步可能遇到的困难点以及应该如何通过设计解决:

## 准备测试环境
有一些对前端项目没有必要做测试的声音，他们的反对理由是前端没有什么可以测试的东西。在他们看来测试无法就是从准备一个 Data，将 Data set 到 Model 中，并且从 Model 中获取并断言那个 Data。这是一个很简单的单元测试，它负责的范围太小了。
让我们看看以下的测试用例：
- 场景一：用户打开浏览器后，应该看到 TodoList 页面，并且看到两条从服务器端拉取到的 todo 项
- 场景二：在场景一的基础上，用户点击 Input 框输入内容后点击添加控制，界面上展示三项
- 场景三：在场景一的基础上，用户点击第一项的删除按钮，界面上展示一项

以上的测试用例描述很像是 QA 同学写的测试用例——软件的行为测试（behavior testing），因为行为测试更贴近用户的真实使用行为，所以测试的覆盖面也更广，测试的真实性也更大。

让我们来分析这其中遇到的难点:

### 对软件的控制力度
你的软件能提供 100% 的控制能力吗，在你的任意一个代码逻辑处，你能否让你的软件做到它可以做到的所有事情？
更简单一点——我们需要软件可以在写测试用例的代码处，可以让研发指定软件到达所有可能的状态，以及可以指定软件的行为
更具体一点——我们需要你的软件在这个测试用例中某个接口请求到的数据是被 mock、是明确的。

一个简单的办法——使用依赖倒置的方法，让你的软件有层次，让这些层可以在拿到软件内核的情况下轻易的触达，在这个项目中，我们使用 pinia 来完成。

软件的内核——在 pinia 下，我们可以通过 `createPinia` 来创建软件的内核（core），这个 core 中存储的是 pinia 定义出来的实例。

软件的层——在这个项目中，我们将请求相关的行为抽象为请求层，请求层负责具体的业务接口、其依赖 http 的具体实现层——axios，代码如下：
```typescript
import { defineStore } from 'pinia'
import Axios from 'axios'

export const useAxios = defineStore('axios-service', () => {
  // 我们把 axios 独立封装一个 service 的目的在于，我们可以在测试环境下对其最终收口，一旦某个上层请求层
  // 没有对用到请求进行 mock 时，会由当前层统一处理——告诉研发应该 mock 或者默认成功等
  const axios = Axios.create()
  return {
    get: axios.get.bind(axios),
    post: axios.post.bind(axios),
  }
})

export const useHttp = defineStore('http-service', () => {
  const { get } = useAxios()

  // 业务请求层的目的在于，我们通常是对某个业务请求进行 mock 的，所以我们需要有这一个概念存在，如果总是
  // 直接调用最原始的 axios.get 进行请求，在存在多个请求时，对于底层的 axios 进行 mock 会存在需要区分业
  // 务请求的成本
  const getTodoList = async (params: { status: 'todo' | 'done' }) => {
    interface Todo {
      id: number
      text: string
      completed: boolean
    }
    return get<Todo[]>('/api/get-todolist', {
      params,
    })
    // 请求层是一种谦卑对象模式、是测试的边界，所以这个层要保持绝对简单，保留最最少的代码，存在对数据
    // 处理或者数据校验等逻辑全部不要在请求层实现，例如下面这段处理响应的逻辑
    // .then((response) => {
    //   if (response.status !== 200) {
    //     return Promise.reject(response.statusText)
    //   }
    //   return response.data
    // })
    // 如何你是希望所有的接口使用相同的响应处理逻辑，就使用拦截器完成，问之不要在测试的边界写不必要的
    // 代码，写得越多，出错的机会也会越多
  }
  return {
    getTodoList,
  }
})
```

这个代码的关键点是：
- 当使用 defineStore 定义一个 useHttp 时，实际上定义的是一类，或者说是一个 Store 类型。这里并没有进行实例化，只有当 `useHttp()` 调用时才真实的进行了实例化，并且实例实际上会存储在 createPinia 创建的 pinia 实例中。

- createPinia 创建的实例被我们定义为了 core、还记得当我们可以拿到 core 时就可以指定软件的一切行为的说法吗，就是因为当我们拿到 core 时，就可以使用 useStore 获取到所有控制软件的行为。

- useHttp 中使用了 useAxios 来获取可以 get/post 的实例，这里的实现体现了依赖倒置思想，http-service 依赖了 axios-service，但是并未关注 axios-service 实例化的细节，axios 实例的细节是 axios 自己决定的，对于 http-service 来说 axios-service 的实例化是上层决定的——被倒置了出去。

- 这个特性可以让我们在不影响 http-service 的情况下，修改 axios-service 的行为。我们可以在测试用例环境下获取到 axios-service，并告诉它 get 和 post 方法不应该被调用到，如果调用到就报错。我们之所以能做到这一点是因为我们在测试用例中创建并修改的 axios-service 实例就是 http-service 真实使用到的实例，你也可以认为做到这点的关键是单例的设计。

### 单例的陷阱

 大部分人可能对单例的认知是——单例无法就是不管实例化多少次都只会真实的实例化一次，而多次尝试实例化获取到的实例都指向同一个。
这个描述有一个前提是作用域——在什么作用域下是单例的。
还是以 pinia 为例，上面的代码 useHttp 多次调用返回的实例是同一个，这里的前提是在同一个 pinia 实例下（createPinia 创建的）如果在不同的 pinia 实例下时，useHttp 返回的实例是不同的，更准确的说法是在 pinia 实例下 useHttp 是单例模式的。所以我们在谈论单例时要加上一个前提，这个单例是什么级别的。
在可测试性中，我们要避免代码引擎级别的全局单例（以下称为全局单例），全局单例的的例子如下代码：
```typescript
import { computed, ref } from 'vue';

export const count = ref(0);
export const doubleCount = computed(() => count.value * 2);
export function increment() {
  count.value++;
}
```
在这个例子中，count 定义在了 ESModule 上，ESModule 加载执行过后 count 的指化就不会再变化了，它会影响不同的测试之间的隔离性。
全局单例的解决方法是——将全局单例变为应用级单例，在应用中是同一个实例，不同的应用使用不同的实例，做到应用性隔离。上面提到的 pinia 就是一种可以支持应用级实例的库，使用 pinia 更改后代码如下：
```typescript
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const doubleCount = computed(() => count.value * 2);
  function increment() {
    count.value++;
  }

  return { count, doubleCount, increment };
});
```

这个代码中，count 定义在 store 内，而 store 存储在 pinia 实例上，不同的 App 拥有不同的 pinia 实例，从而做到 App 级的实例隔离。

那有一些第三方库、或者环境相关的 API —— history、localStorage 浏览器级全局单例的应该如何解决呢？请看下一节。

## 测试的边界谦卑对象模式
测试是有边界的，对于单元测试而言接口就是一它的边界，接口的逻辑我们没有办法测试，除非真实的发起请求，但是这又会引入另一个问题，测试就不能称为单元测试了，其也会依赖外部变得不那么稳定。

对于单元测试而言，一个万能的确定边界的方法是采用谦卑对象模式来实现边界逻辑。谦卑对象的命名很有意思——它知道自己的能力有限，所以退后到只做必要的事情，因为它做到事情足够的少，所以出 Bug 的机会也少。对于接口来说，谦卑对象应该实现的就是描述接口的地址，入参和出参数。

以上实现的 http-service 就是一个谦卑对象
```typescript
export const useHttp = defineStore('http-service', () => {
  const { get } = useAxios()

  // 业务请求层的目的在于，我们通常是对某个业务请求进行 mock 的，所以我们需要有这一个概念存在，如果总是
  // 直接调用最原始的 axios.get 进行请求，在存在多个请求时，对于底层的 axios 进行 mock 会存在需要区分业
  // 务请求的成本
  const getTodoList = async (params: { status: 'todo' | 'done' }) => {
    interface Todo {
      id: number
      text: string
      completed: boolean
    }
    return get<Todo[]>('/api/get-todolist', {
      params,
    })
    // 请求层是一种谦卑对象模式、是测试的边界，所以这个层要保持绝对简单，保留最最少的代码，存在对数据
    // 处理或者数据校验等逻辑全部不要在请求层实现，例如下面这段处理响应的逻辑
    // .then((response) => {
    //   if (response.status !== 200) {
    //     return Promise.reject(response.statusText)
    //   }
    //   return response.data
    // })
    // 如何你是希望所有的接口使用相同的响应处理逻辑，就使用拦截器完成，问之不要在测试的边界写不必要的
    // 代码，写得越多，出错的机会也会越多
  }
  return {
    getTodoList,
  }
})
```
如果刨除掉类型，getTodoList 的实现只剩下三行，且不涉及逻辑。

```typescript
const getTodoList = async (params) => {
    return get('/api/get-todolist', { params })
}
```

本章节前抛出的问题，浏览器的 history、localStorage 以及一些第三方全局单例的库应该怎么处理，一个万能的方式就是使用谦卑对象隔离，将这些实现隔离在测试边界外。虽然这是一个万能的方法，但对于可测试来说并不一定是最优的方式，假设被隔离的逻辑是构成应用重要的一部分，隔离会导致可测试的覆盖变少。

另一种解决单例问题的方式是里氏替换

## 里氏替换
以 history 为例，假设我们要测试的应用是一个依赖浏览器路由的单页应用，因为浏览器路由是浏览器级别单例子的，为了测试的隔离我们不能依赖浏览器路由。但是把浏览器路由排除在测试边界外的话，我们就很难测试到由路由驱动的界面渲染，由逻辑触发的界面跳转逻辑了，这会让行为测试的范围极大的缩小。

好在现在的路由实现逻辑都会提供不同模式的路由，以为 vue-router 为例子，浏览器路由是 createWebHistory，对应原生的 history，除此外 vue-router 还提供了 createMemoryHistory，该接口可以返回一个内存路由，路由的状态会保存在内存中而非浏览器 history 对象上。

createMemoryHistory 和 createWebHistory 返回的对象类型是 RouterHistory，对于应用来说，我们应该依赖 RouterHistory。我们依赖的是父类型 RouterHistory，当被替换成 createMemoryHistory 时对于依赖 RouterHistory 的模块来说，是感知不到的。

使用 memoryHistory 的好处是，当我们使用 router.push 或者 router.replace 对路由进行操作时，界面仍然会进行相应的跳转、渲染。这保留了软件的可测试范围且因为 memoryHistory 是多实例的，允许我们做到测试用例间实例隔离。

应用以上策略，基本上可以构建并准备一个可测试的环境了，具体的操作在后续章节再进行详细介绍。下一节先聚集到如何运行待代码的代码。

# 运行需要测试的代码
运行需要测试的代码，不是简单的调用就可以吗？例如我需要测试页面的加载逻辑，我可以调用 indexController.load() 方法，并且在 load 结束后断言 indexController 上的状态。这是一种办法，并且我们还有其它的办法。直接调用函数是一种高效的面向开发的方式，但是并不是面向测试的。在行为驱动测试中认为，我们的描述越贴近用户的真实行为，我们的测试用例越有效。举个例子，用户并不会调用 indexController.load 来加载数据，用户只会访问页面并期望看到数据。调用 indexController.load() 之所以有效是因为我们明确在页面渲染时会在合适的时机调用 indexController.load 方法。但是这属于我们的内部逻辑，这类内部测试用例会遇到假成功或者是假失败的情况。

假成功指的是测试用例跑成功，但是在用户看来是有 BUG 的，例如页面没有调用 indexController.load 用户则看不到页面正常的显示了。但是测试用例仍是成功的，因为测试用例中直接调用了 indexController.load 方法

假失败指的是测试用例挂了，但是在用户看来是成功的，比如页面重构使用了更适合的数据加载方式，indexController.load 方法内部依赖的加载逻辑被修改掉了。直接调用 indexController.load 的测试用例会失败，但实际的页面依赖另一个让数据展示出来的逻辑正常的展示了。

如果我们追求的是质量，我们应该以更贴近用户使用的方式来描述用例，甚至以更贴近用户的环境。以上的理念也是 testing-library 追求的，这个库同时也提供了类似 e2e 的方式来写行为测试用例。

以下是 TodoList 项目测试用例，描述了用户访问后应该看到『看一本书』Todo 项。
```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { renderTest } from '../../render-app'
import { mockBaseScene } from '../../test/mock/base-scene'
import userEvent from '@testing-library/user-event'
import { findByText } from '@testing-library/dom'
import { useTodoStore } from './todo'
import { createPinia, setActivePinia } from 'pinia'

describe('todo list', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('todo list 从服务器端加载数据后能正确的展示', async () => {
    const { findByText } = await renderTest({
      initScript: mockBaseScene,
    })
    await findByText('读一本书')
  })

  it('直接对 core 进行测试', async () => {
    mockBaseScene()
    const todoController = useTodoStore()
    await todoController.loadTodoListfromServer()
    expect(todoController.todos.find((i) => i.text === '读一本书')).not.null
  })

})

todo.vue 
<template>
  ...
</template>

<script lang="ts" setup>
import { useTodoStore } from './todo'
import { storeToRefs } from 'pinia'

const todoController = useTodoStore()
todoController.loadTodoListfromServer()
const { todos, newTodo } = storeToRefs(todoController)
</script>

todo.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useHttp } from '../../layout/http-service'


export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const http = useHttp()

  const loadTodoListfromServer = async () => {
    const response = await http.getTodoList({ status: 'done' })
    todos.value = response.data
  }

  return {
    todos,
    loadTodoListfromServer,
  }
})
```

testing-library 通过渲染应用，应用依赖了路由，路由驱动了 todo.vue 加载，todo.vue 中调用了 todoController 的 loadTodoListFromServer 方法来填充数据。并且 testing-library 通过 await findByText('读一本书')  来断言界面上将会渲染『读一本书』这个文案。整体过程是模拟了用户的真实使用场景的。

另一个直接测试 core 的用例完全忽略了 todo.vue 文件，通过直接获取 todoController 的方式调用 loadTodoListFromServer，并且直接断言内部状态被填充了。

直接测试内核的方案优点是实现简单，但是测试质量是低于 testing-library 通过模拟用户真实使用场景进行测试的。testing-library 的缺点是学习成本不低，它有自己的 API 进行用户的行为描述，一些场景（比如上传文件）比较难直观的写下来，但是好在现在有 AI 的加持，可以一定程序的降低对 API 的理解。
```typescript
const fakeFile = new File(['mock'], 'hello.csv', { type: 'text/csv' })
userEvent.upload(inputElement, fakeFile)
```
上传文件行为实现

# 检查最终的结果
对代码运行的结果断言往往是最简单的，这里需要做的就是熟练使用工具。

直接断言的工具有 vitest 的 expect、chai，testing-library 的 getByRole（获取不到元素直接报错） 等

testing-library 还提供了如 waitFor/waitUntil 的方法（vitest 也有）这些方式会轮询的断言直到成功（或者直到超时）对于面向外观测试的情况好像有效果。

比如 load 方法会填充数据，但是 load 返回并不会返回 promise 告诉外部什么时间数据填充完成，这种情况下可以使用 waitFor 等待数据填充完成。
```typescript
it('直接对 core 进行测试', async () => {
  mockBaseScene()
  const todoController = useTodoStore()
  todoController.loadTodoListfromServer()
  vi.waitFor(
    () => {
      expect(todoController.todos.find((i) => i.text === '读一本书')).not.null
    },
    { timeout: 1000, interval: 20 }
  )
})
```
waitFor 会轮询检查，直到 `expect(todoController.todos.find((i) => i.text === '读一本书')).not.null` 不再报错，或者直到超时。

# 开始搭建一下 vue3 项目

以上介绍了关心可测试需要解决的三部分准备测试环境；运行需要测试的代码；检查最终的结果；下面开始搭建一个可测试的 vue3 项目。先从创建一个 vue3 应用开始：

## 创建一个 vue 应用
首先，生产环境与测试环境所创建的 app 实例一定不是一样的，测试环境需要使用 memoryHistory，而生产环境使用 browserHistory。除此之外，生产环境的 app 创建与测试环境的 app 其它逻辑应该是一致的，我们会实现一个 renderBase 方法，把相同的渲染逻辑封装到该方法中，不同的逻辑通过参数的方式隔离到外部调用处。

代码如下：
```typescript
import { createApp, type Component } from 'vue'
import { type RouterHistory, createRouter } from 'vue-router'
import { routes } from '../route'
import { createPinia } from 'pinia'
import './style.css'

export const renderBase = async (options: {
  component: Component
  history: RouterHistory
  container?: Element
  initScript?: () => unknown
}) => {
  const app = createApp(options.component)
  const router = createRouter({
    history: options.history,
    routes: routes,
  })
  const div = options.container ?? document.createElement('div')
  app.use(router).use(createPinia())
  await router
    .isReady()
    .then(() => app.runWithContext(() => Promise.resolve(options.initScript?.())))
    .then(() => {
      app.mount(div)
    })
  document.body.appendChild(div)
  return {
    app,
  }
}
```

第 5 行 `import './style.css'`，样式的引入生产环境和测试环境都可以引入，如果不是生产环境独有的可以直接在 renderBase 文件实现

第 15 行 `options.history` 是我们上文提到的，我们采用了里氏替换的方式，在生产环境使用 browserHistory、测试环境使用 memoryHistory，renderBase 中通过参数的方式将具体的 History 实例外置到函数调用处决定

第 19 行 `app.use(router).use(createPinia())` 对应上文提到的应用级实例问题，这里 `createPinia` 创建了一个 pinia 实例，在 app 内所有的 useStore 方法是保持单实例的，不同的 app 之间实例是隔离的。

第 11、22 行的 `initScript` 和 `runWithContext` 的调用是一个勾子的实现，这个勾子允许在应用初始化好、真实业务执行前的时机执行一段逻辑。这个时机通常是用于在准备测试环境环节对软件的行为进行 mock、stub。

## 生产环境调用方式
```typescript
import { createWebHistory } from 'vue-router'
import App from '../app.vue'
import { renderBase } from './render-base'

export const renderProduction = () => {
  return renderBase({
    history: createWebHistory(),
    component: App,
  })
}
```
生产环境指定了入口的 component 以及使用的路由实例

## 测试环境调用方式
```typescript
import { createMemoryHistory } from 'vue-router'
import component from '../app.vue'
import { renderBase } from './render-base'
import { within } from '@testing-library/dom'
import type { App } from 'vue'

let container: HTMLDivElement | undefined
const weakMap = new WeakMap<HTMLDivElement, App<Element>>()

function singleCreateContainer() {
  if (container) {
    // 保证上一次的应用被清除掉
    const app = weakMap.get(container)
    app?.unmount()
    document.body.removeChild(container)
  }
  container = document.createElement('div')
  return container
}
export const renderTest = async (opts: { initScript?: () => unknown }) => {
  const container = singleCreateContainer()
  const { app } = await renderBase({
    history: createMemoryHistory(),
    component,
    container,
    initScript: opts.initScript,
  })
  weakMap.set(container, app)

  return {
    app,
    container,
    ...within(container),
  }
}
```

测试环境采用了 singleCreateContainer 函数创建最终要渲染的 div，这个设计的目的是保证下一个用例执行前清除上一个用例相关的环境
```typescript
app?.unmount()
document.body.removeChild(container)
```

第 23 行 `createMemoryHistory()` 指定了测试使用的路由实例是 MemoryHistory

第 33 行 `within` 是对 testing-library 库的一次封装，这一行代码表达的是，renderTest 上的 testing-library 方法如 getByRole 这些，调用的时候查找范围是 container。

这里有一个问题，testing-library 有直接提供 testling-library/vue 直接支持对 vue 组件进行测试，为什么我们的示例为直接基于 testing-library/dom 来从零开始实现呢？

这是因为 testing-library/dom 更灵活
1. testing-library/vue 对同构的支持并不友好，生产环境的渲染与测试环境的渲染是独立的
2. 我们希望在测试前可以在 app 实例下运行一些代码来初始化，这一点在 testing-library/vue 下并不好实现

相反 testing-library/dom 只需要简单的封装就可以达到 testing-library/vue 的能力，并且还能提供更底层的 API 以篇灵活的响应测试的需求。

## mock 数据
mock 数据也需要准备环境的一部分，借助 sinon 工具我们可以很简单的做到对 core 内 service 层的 mock。

mock 数据示例代码如下：

<i>todo.spec.ts</i>
```typescript
import { describe, it } from 'vitest'
import { renderTest } from '../../render-app'
import { useHttp } from '../../layout/http-service'
import { stub } from 'sinon'

describe('todo list', () => {
  it('todo list 从服务器端加载数据后能正确的展示', async () => {
    const { findByText } = await renderTest({
      initScript: () => {
        const http = useHttp()
        const getTodoListStub = stub(http, 'getTodoList')
        getTodoListStub.resolves(
          success([
            {
              id: new Date('2025/01/22 10:30:25').getTime(),
              text: '读一本书',
              completed: false,
            },
            {
              id: new Date('2025/01/22 10:35:59').getTime(),
              text: '吃超辣的螺蛳粉',
              completed: false,
            },
          ])
        )
      },
    })
    await findByText('读一本书')
  })
})
```
<i>todo.ts</i>
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useHttp } from '../../layout/http-service'
export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])

  const http = useHttp()

  const loadTodoListfromServer = async () => {
    const response = await http.getTodoList({ status: 'done' })
    todos.value = response.data
  }

  return {
    todos,
    loadTodoListfromServer,
  }
})
```

原理是：

useHttp 返回的 http 实例在 app 下是单例的，这意味着在 todo.spec.ts 的<b>第 10 行 const http = useHttp() </b> 与 todo.ts 中的 <b>const http = useHttp()</b> 持有的实例是同一份，所以 todo.spec.ts 中对 http 实例进行的 stub 操作（指定 getTodoList 返回特定的数据）对 todo.ts 中的 http 实例同样有效。通过单例的特性完成了对生产代码 http 行为的修改。最终在 todo.ts 生产代码中 const response = await http.getTodoList({ status: 'done' }) 返回的是指定的 mock 数据。


这里会有几个问题：
### 1. 为什么对 http-service 进行 mock，而不是更底层的 axios-service
```typescript
import { defineStore } from 'pinia'
import Axios from 'axios'

export const useAxios = defineStore('axios-service', () => {
  // 我们把 axios 独立封装一个 service 的目的在于，我们可以在测试环境下对其最终收口，一旦某个上层请求层
  // 没有对用到请求进行 mock 时，会由当前层统一处理——告诉研发应该 mock 或者默认成功等
  const axios = Axios.create()
  return {
    get: axios.get.bind(axios),
    post: axios.post.bind(axios),
  }
})

export const useHttp = defineStore('http-service', () => {
  const { get } = useAxios()

  // 业务请求层的目的在于，我们通常是对某个业务请求进行 mock 的，所以我们需要有这一个概念存在，如果总是
  // 直接调用最原始的 axios.get 进行请求，在存在多个请求时，对于底层的 axios 进行 mock 会存在需要区分业
  // 务请求的成本
  const getTodoList = async (params: { status: 'todo' | 'done' }) => {
    interface Todo {
      id: number
      text: string
      completed: boolean
    }
    return get<Todo[]>('/api/get-todolist', {
      params,
    })
    // 请求层是一种谦卑对象模式、是测试的边界，所以这个层要保持绝对简单，保留最最少的代码，存在对数据
    // 处理或者数据校验等逻辑全部不要在请求层实现，例如下面这段处理响应的逻辑
    // .then((response) => {
    //   if (response.status !== 200) {
    //     return Promise.reject(response.statusText)
    //   }
    //   return response.data
    // })
    // 如何你是希望所有的接口使用相同的响应处理逻辑，就使用拦截器完成，问之不要在测试的边界写不必要的
    // 代码，写得越多，出错的机会也会越多
  }
  return {
    getTodoList,
  }
})
```

axios-service 和 http-service 的逻辑如上代码所示，相关原因可以直接看注释。

原因在于基于业务的层更容易进行 mock，axios 过于底层，所有的请求都会进到 axios，这会导致 mock 的成本上升，所以我们基于业务的请求层进行 mock 是成本最低，效率最高的方式。

### 2. 对于复杂的项目，要如何管理 mock 数据？

TodoList 演示的是小项目，对于正常的项目会存在很多分支场景。

举个例子，当用户没有登录时会展示登录界面，用户可以成功登录。这里我们需要对用户登录的行为进行 mock，保证用户可以登录成功。

当登录成功后进入了业务，我们希望描述的是业务的场景——用户可以看到页面业务。此时我们不会关注用户登录相关的行为。对于业务场景来说，登录行为是基础场景，而业务场景是在基础场景上的叠加。

我们管理 mock 数据时也可以考虑采用基础场景和叠加组合的方式来进行。见示例代码：
```typescript
import { useAxios, useHttp } from '../../layout/http-service'
import { getOrCreateStub } from './get-or-create-stub'
import type { AxiosResponse } from 'axios'

// 创建一个 axios 成功响应的数据类型
const success = <T>(data: T) => ({ status: 200, data } as unknown as AxiosResponse<T, any>)

const mockAxios = () => {
  const axios = useAxios()
  const getStub = getOrCreateStub(axios, 'get')
  getStub.callsFake(async (...o) => {
    // 在测试环境中，如果上层没有对接口进行 mock，一旦 axios.get 被调用，就会抛出错误告诉研发需要对接口
    // 进行 mock
    throw new Error(`你还没有对 get ${o} 进行 mock`)
  })
}

const mockHttp = () => {
  const http = useHttp()
  const getTodoListStub = getOrCreateStub(http, 'getTodoList')

  // 这里指定了 getTodoList 这个接口返回特定的数据，特定的数据对于让单元测试可以稳定——稳定成功
  // 或者稳定失败
  getTodoListStub.resolves(
    success([
      {
        id: new Date('2025/01/22 10:30:25').getTime(),
        text: '读一本书',
        completed: false,
      },
      {
        id: new Date('2025/01/22 10:35:59').getTime(),
        text: '吃超辣的螺蛳粉',
        completed: false,
      },
    ])
  )
}

export const mockBaseScene = () => {
  // mockBaseScene 的作用是 mock 一个基础的场景，这个函数应该包含一个应用所有的 mock
  // 基础的场景可以衍生出分支场景，只需要在该函数后调用需要叠加的 mock 函数即可
  mockAxios()
  mockHttp()
}

export const mockFail = () => {
  // mockFail 演示了在基础场景上衍生新场景，只需要在 mockBaseScene 后继续进行 mock 就好了
  mockBaseScene()
  const http = useHttp()
  // 这个场景中，http 被 mock 了两次，一次是在 mockBaseScene 中，另一次是在这
  // 这里也可以体现出 getOrCreateStub 的作用，如果是原生 sinon 的 stub 函数，在这一步是会报错的
  const getTodoListStub = getOrCreateStub(http, 'getTodoList')
  getTodoListStub.rejects('network error')
}
```

在代码中，mockBaseScene  mock 的是基础的场景，保证了应用有一个基础的行为。mockBaseScene 是 mockAxios 和 mockHttp 的叠加组合（顺序是有关系的）。

mockFail 是基于 mockBaseScene 的一轮新的叠加，mockFail 在基础的行为上修改了 getTodoList 的行为，指定其行为为『请求超时』
通过组合的方式，我们在编写新的测试用例时，可以简单的 fork 自己希望关注的分支用例，修改差异的行为得到一个新的用例。


叠加组合 mock 数据其中的一个难点是 sinon 的 stub 方法，该方法只允许对一个 Object 对象进行一次 stub。如果我们尝试对 http 的 getTodoList 方法进行两次 stub 操作，sinon 会报错这个错误 TypeError: Attempted to wrap getTodoList which is already wrapped。

一个解决方法是，如果我们没有进行过 stub 操作，则正常的进行 stub，如果我们已经 stub 过了，就返回上一次的 stub 对象，这就是 getOrCreateStub 函数的作用。

<i>get-or-create-stub.ts</i>
```typescript
/**
getOrCreateStub 是解决这个问题的：
sinon 的 stub 可以对一个对象进行 stub 操作，使用方法如下
const a = { get() { return 1 }}
const getStub = stub(a, 'get')
getStub.returnValue(2) -> 这一行可以让 a.get() 返回 2
stub(a, 'get') -> 这一条会报错，因为 sinon 已经对 a 进行一次『包裹(wrap)』了
getOrCreateStub 就是为了解决重复对同一个对象进行 stub 错误的问题的，其原理就是如果没有 stub 就进行 stub
如果已经 stub 了就直接返回上一次对象就行了
*/

import type { SinonStub } from 'sinon'
import { stub } from 'sinon'

type StubHandler = unknown
type key = number | string | symbol

const instanceMap = new WeakMap<object, Map<key, StubHandler>>()

export function getOrCreateStub<T extends object, K extends keyof T>(service: T, name: K) {
  const getOrCreateInstanceMap = () => {
    let x = instanceMap.get(service)
    if (x === undefined) {
      x = new Map()
      instanceMap.set(service, x)
    }
    return x
  }
  const methodMap = getOrCreateInstanceMap()
  const getOrCreateMethodStubhandler = (map: Map<key, StubHandler>) => {
    let x = map.get(name)
    if (x === undefined) {
      x = stub(service, name)
      map.set(name, x)
    }
    return x
  }
  type Value = T[K]
  type Method = Value extends (i: infer I) => infer O ? (i: I) => O : never
  type Req = Parameters<Method>
  type Res = ReturnType<Method>
  const stubMethod: unknown = getOrCreateMethodStubhandler(methodMap)

  return stubMethod as SinonStub<Req, Res>
}
```

以上这部分就是 vue3 项目整项目可测试的所有内容了，以下的文章会继续讨论一些别的话题。
# vitest browser mode
相对于 mocha 来说，vitest 是一个非常先进的测试框架，browser mode (浏览器模式)更是跨时代的，浏览器模式可以用真实的浏览器来跑测试用例。十多年前使用 jasmine&karma 框架也能做到将测试用例放到浏览器上跑，vitest 浏览器模式的跨时代并不是体现在在浏览器上跑测试用例，而是将 vite 的工程化和浏览器模式结合了起来，这两者的结合让浏览器上跑真实项目测试成为了可能，研发不再需要为测试框架应该如何处理 typescript、css 等烦恼了。

当前用于演示的 Todo List 项目就是使用的浏览器模式进行测试的。

浏览器模式相对于 node 环境进行测试的好处是：
1. 应用可以真实的渲染出现，研发可以真实的看到界面，看到界面可以很直观的指导研发下一步应该怎么测试
2. css 也会被测试到，假设一个 UI 组件使用 .hide 类来控制组件显隐的，.hide 的实现是 { display: none }，在浏览器模式下，.hide 会真实的影响 getByRole 的结果——如果隐藏了就会获取不到元素。而在 node 环境下使用 jsdom 或者 hippydom 的方案，.hide 并不会影响结果，因为虚拟的 jsdom 和 hippydom 并没有实现真实的 css 渲染引擎，它们并不知道最终元素是显示的还是隐藏的
3. 在访问 BOM 时，浏览器模式的性能会更快。这很容易理解，jsdom 的实现毕竟是 javascript 实现的，而 chrome的内核是使用高性能的 C 实现的。当你的测试用例需要渲染一个很大的应用时，这两个模式的性能差异会非常的大。

# vitest 浏览器模式和 e2e
vitest 浏览器模式和 e2e 很像，但它不是 e2e。如果你使用过 playwright、cypress，你会发现使用 vitest 浏览器模式和 testing-library 来写测试用例，与 playwright 和 cypress 的语法非常的像。表现上也很像，大家都是在浏览器上跑效果并断言。

但是本质上，playwright 和 cypress 使用类似命令模式的方式在操作浏览器，测试用例是运行在 node 上的，通过协议控制浏览器并从浏览器获取信息到 node 上断言，或者显示。

而 vitest 的测试用例是跑在浏览器上的，vitest 用例和需要测试的代码共享同一个上下文，这让 mock 数据，修改软件行为都更方便，更快捷。

打个比方，你能否使用 e2e 写两个用例，访问同一个连接，一个用例登录成功、另一个用户登录失败？对于 e2e 来说要做到这点很麻烦，因为软件的真实表现与测试用例跑在不同的程序上，测试用例需要去调度真实跑项目的程序告诉他要 stub 掉某些行为，这个实现效率相当低下。并且不在一个上下文中的两个程序希望共享同一上下文还需要额外的 id 来识别。但是 vitest 要做到这点很简单，因为 vitest 和生产代码就是在一个上下文内的，只要做到了应用间隔离，vitest 就可以对当前要测试的应用为为所欲为。
