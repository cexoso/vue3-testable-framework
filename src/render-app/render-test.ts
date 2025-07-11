import { createMemoryHistory } from 'vue-router'
import App from '../app.vue'
import { renderBase } from '../render-app/render-base'

export const renderTest = () => {
  const app = renderBase({
    history: createMemoryHistory(),
    component: App,
  })

  return app
}
