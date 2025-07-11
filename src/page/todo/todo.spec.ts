import { describe, it } from 'vitest'
import { renderTest } from '../../render-app'
import { mockBaseScene } from '../../test/mock/base-scene'

describe('todo list', () => {
  it('todo list 从服务器端加载数据后能正确的展示', async () => {
    const { findByText } = await renderTest({
      initScript: mockBaseScene,
    })
    await findByText('读一本书')
  })
})
