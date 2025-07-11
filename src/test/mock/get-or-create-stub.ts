/**
getOrCreateStub 是解决这个问题的：
sinon 的 stub 可以对一个对象进行 stub 操作，使用方法如下
const a = { get() { return 1 }}
const getStub = stub(a, 'get')
getStub.returnValue(2) -> 这一行可以让 a.get() 返回 2
stub(a, 'get') -> 这一条会报错，因为 sinon 已经对 a 进行一次『包裹(wrap)』了
getOrCreateStub 就是为了解决重复对同一个对象进行 stub 错误的问题的，其原理就是如果没有 stub 就进行 stub
如果已经 stub 了就直接返回上一次对象就行了
*/

import type { SinonStub } from 'sinon'
import { stub } from 'sinon'

type StubHandler = unknown
type key = number | string | symbol

const instanceMap = new WeakMap<object, Map<key, StubHandler>>()

export function getOrCreateStub<T extends object, K extends keyof T>(service: T, name: K) {
  const getOrCreateInstanceMap = () => {
    let x = instanceMap.get(service)
    if (x === undefined) {
      x = new Map()
      instanceMap.set(service, x)
    }
    return x
  }
  const methodMap = getOrCreateInstanceMap()
  const getOrCreateMethodStubhandler = (map: Map<key, StubHandler>) => {
    let x = map.get(name)
    if (x === undefined) {
      x = stub(service, name)
      map.set(name, x)
    }
    return x
  }
  type Value = T[K]
  type Method = Value extends (i: infer I) => infer O ? (i: I) => O : never
  type Req = Parameters<Method>
  type Res = ReturnType<Method>
  const stubMethod: unknown = getOrCreateMethodStubhandler(methodMap)

  return stubMethod as SinonStub<Req, Res>
}
