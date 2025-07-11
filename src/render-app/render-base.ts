import { createApp, type Component } from 'vue'
import { type RouterHistory, createRouter } from 'vue-router'
import { routes } from '../route'
import { createPinia } from 'pinia'

export const renderBase = (options: { component: Component; history: RouterHistory }) => {
  const app = createApp(options.component)
  const router = createRouter({
    history: options.history,
    routes: routes,
  })
  const div = document.createElement('div')
  app.use(router).use(createPinia())
  router
    .isReady()
    .then(() => {
      app.mount(div)
    })
    .catch(() => {
      // TODO
    })
  document.body.appendChild(div)
  return app
}
