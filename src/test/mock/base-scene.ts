import { useAxios, useHttp } from '../../layout/http-service'
import { getOrCreateStub } from './get-or-create-stub'
import type { AxiosResponse } from 'axios'

// 创建一个 axios 成功响应的数据类型
const success = <T>(data: T) => ({ status: 200, data } as unknown as AxiosResponse<T, any>)

const mockAxios = () => {
  const axios = useAxios()
  const getStub = getOrCreateStub(axios, 'get')
  getStub.callsFake(async (...o) => {
    // 在测试环境中，如果上层没有对接口进行 mock，一旦 axios.get 被调用，就会抛出错误告诉研发需要对接口
    // 进行 mock
    throw new Error(`你还没有对 get ${o} 进行 mock`)
  })
}

const mockHttp = () => {
  const http = useHttp()
  const getTodoListStub = getOrCreateStub(http, 'getTodoList')

  // 这里指定了 getTodoList 这个接口返回特定的数据，特定的数据对于让单元测试可以稳定——稳定成功
  // 或者稳定失败
  getTodoListStub.resolves(
    success([
      {
        id: new Date('2025/01/22 10:30:25').getTime(),
        text: '读一本书',
        completed: false,
      },
      {
        id: new Date('2025/01/22 10:35:59').getTime(),
        text: '吃超辣的螺蛳粉',
        completed: false,
      },
    ])
  )
}

export const mockBaseScene = () => {
  // mockBaseScene 的作用是 mock 一个基础的场景，这个函数应该包含一个应用所有的 mock
  // 基础的场景可以衍生出分支场景，只需要在该函数后调用需要叠加的 mock 函数即可
  mockAxios()
  mockHttp()
}

export const mockFail = () => {
  // mockFail 演示了在基础场景上衍生新场景，只需要在 mockBaseScene 后继续进行 mock 就好了
  mockBaseScene()
  const http = useHttp()
  // 这个场景中，http 被 mock 了两次，一次是在 mockBaseScene 中，另一次是在这
  // 这里也可以体现出 getOrCreateStub 的作用，如果是原生 sinon 的 stub 函数，在这一步是会报错的
  const getTodoListStub = getOrCreateStub(http, 'getTodoList')
  getTodoListStub.rejects('network error')
}
