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
