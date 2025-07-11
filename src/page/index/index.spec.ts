import { describe, it } from 'vitest'
import { renderTest } from '../../render-app'
import { mockBaseScene } from '../../test/mock/base-scene'
import { useRouter } from 'vue-router'

describe('index', () => {
  it('todo list 从服务器端加载数据后能正确的展示', async () => {
    const { findByText } = await renderTest({
      initScript: async () => {
        mockBaseScene()
        await useRouter().replace({
          name: '首页',
        })
      },
    })
    await findByText('welcome')
  })
})
