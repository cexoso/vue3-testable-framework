import { createApp, type Component } from 'vue'

export const renderApplication = (options: { component: Component }) => {
  const app = createApp(options.component)
  const div = document.createElement('div')
  app.mount(div)
  document.body.appendChild(div)
}
