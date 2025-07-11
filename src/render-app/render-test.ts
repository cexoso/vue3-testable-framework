import { createMemoryHistory } from 'vue-router'
import App from '../app.vue'
import { renderBase } from '../render-app/render-base'
import { findByRole, findByText } from '@testing-library/dom'

export const renderTest = async () => {
  const container = document.createElement('div')
  const app = await renderBase({
    history: createMemoryHistory(),
    component: App,
    container,
  })

  type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never
  type findByRoleArgs = Tail<Parameters<typeof findByRole>>
  // type findAllByRoleArgs = Tail<Parameters<typeof findAllByRole>>
  // type getByTextArgs = Tail<Parameters<typeof getByText>>
  // type getByRoleArgs = Tail<Parameters<typeof getByRole>>
  // type findByPlaceholderTextArgs = Tail<Parameters<typeof findByPlaceholderText>>
  // type findAllByTextArgs = Tail<Parameters<typeof findAllByText>>
  type findByTextArgs = Tail<Parameters<typeof findByText>>

  return {
    findByText: (...args: findByTextArgs) => {
      return findByText(container, ...args)
    },
    findByRole: (...args: findByRoleArgs) => {
      return findByRole(container, ...args)
    },
    app,
    container,
  }
}
