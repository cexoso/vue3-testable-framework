import { createMemoryHistory } from 'vue-router'
import App from '../app.vue'
import { renderBase } from './render-base'
import { within } from '@testing-library/dom'

export const renderTest = async (opts: { initScript?: () => unknown }) => {
  const container = document.createElement('div')
  const app = await renderBase({
    history: createMemoryHistory(),
    component: App,
    container,
    initScript: opts.initScript,
  })

  return {
    app,
    container,
    ...within(container),
  }
}
