import { defineStore } from 'pinia'
import Axios from 'axios'

export const useAxios = defineStore('axios-service', () => {
  // 我们把 axios 独立封装一个 service 的目的在于，我们可以在测试环境下对其最终收口，一旦某个上层请求层
  // 没有对用到请求进行 mock 时，会由当前层统一处理——告诉研发应该 mock 或者默认成功等
  const axios = Axios.create()
  return {
    get: axios.get.bind(axios),
    post: axios.post.bind(axios),
  }
})

export const useHttp = defineStore('http-service', () => {
  const { get } = useAxios()

  // 业务请求层的目的在于，我们通常是对某个业务请求进行 mock 的，所以我们需要有这一个概念存在，如果总是
  // 直接调用最原始的 axios.get 进行请求，在存在多个请求时，对于底层的 axios 进行 mock 会存在需要区分业
  // 务请求的成本
  const getTodoList = async (params: { status: 'todo' | 'done' }) => {
    interface Todo {
      id: number
      text: string
      completed: boolean
    }
    return get<Todo[]>('/api/get-todolist', {
      params,
    })
    // 请求层是一种谦卑对象模式、是测试的边界，所以这个层要保持绝对简单，保留最最少的代码，存在对数据
    // 处理或者数据校验等逻辑全部不要在请求层实现，例如下面这段处理响应的逻辑
    // .then((response) => {
    //   if (response.status !== 200) {
    //     return Promise.reject(response.statusText)
    //   }
    //   return response.data
    // })
    // 如何你是希望所有的接口使用相同的响应处理逻辑，就使用拦截器完成，问之不要在测试的边界写不必要的
    // 代码，写得越多，出错的机会也会越多
  }
  return {
    getTodoList,
  }
})
