import { beforeEach, describe, expect, it } from 'vitest'
import { renderTest } from '../../render-app'
import { mockBaseScene } from '../../test/mock/base-scene'
import userEvent from '@testing-library/user-event'
import { findByText } from '@testing-library/dom'
import { useTodoStore } from './todo'
import { createPinia, setActivePinia } from 'pinia'

describe('todo list', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('todo list 从服务器端加载数据后能正确的展示', async () => {
    const { findByText } = await renderTest({
      initScript: mockBaseScene,
    })
    await findByText('读一本书')
  })

  it('直接对 core 进行测试', async () => {
    mockBaseScene()
    const todoController = useTodoStore()
    await todoController.loadTodoListfromServer()
    expect(todoController.todos.find((i) => i.text === '读一本书')).not.null
  })
  it('用户可以手动新增一条 todo 项', async () => {
    const { findByPlaceholderText, findAllByRole } = await renderTest({
      initScript: mockBaseScene,
    })
    await userEvent.type(await findByPlaceholderText('添加新任务'), '写一篇文章')
    await userEvent.keyboard('[enter]')
    const liList = await findAllByRole('listitem')
    expect(liList).lengthOf(3, '新增一条数据后，总 TODO 项有三条')
  })
  it('可以删除一条 TODO 项', async () => {
    const { findAllByText, findAllByRole } = await renderTest({
      initScript: mockBaseScene,
    })
    const list = await findAllByText('删除')
    const first = list[0]
    const deleteButton = await findByText(first, '删除')
    await userEvent.click(deleteButton)

    const liList = await findAllByRole('listitem')
    expect(liList).lengthOf(1, '删除一条后只剩下一条了')
  })
})
