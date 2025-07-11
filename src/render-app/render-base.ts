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
    .then(() => {
      app.runWithContext(() => {
        options.initScript?.()
      })
      app.mount(div)
    })
    .catch(() => {
      // TODO
    })
  document.body.appendChild(div)
  return {
    app,
  }
}
