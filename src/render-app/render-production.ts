import { createWebHistory } from 'vue-router'
import App from '../app.vue'
import { renderBase } from '../render-app/render-base'

export const renderProduction = () => {
  return renderBase({
    history: createWebHistory(),
    component: App,
  })
}
