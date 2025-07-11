import { createWebHistory } from 'vue-router'
import App from '../app.vue'
import { renderBase } from './render-base'

export const renderProduction = () => {
  return renderBase({
    history: createWebHistory(),
    component: App,
  })
}
