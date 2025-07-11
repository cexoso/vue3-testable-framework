import { createApp, type Component } from 'vue'
import { createWebHistory, type RouterHistory, createMemoryHistory, createRouter } from 'vue-router'
import { routes } from './route'
import App from './app.vue'

export const renderApplication = (options: { component: Component; history: RouterHistory }) => {
  const app = createApp(options.component)
  const router = createRouter({
    history: options.history,
    routes: routes,
  })
  const div = document.createElement('div')
  app.use(router)
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

export const renderTest = () => {
  const app = renderApplication({
    history: createMemoryHistory(),
    component: App,
  })
  return app
}

export const renderProduction = () => {
  renderApplication({
    history: createWebHistory(),
    component: App,
  })
}
