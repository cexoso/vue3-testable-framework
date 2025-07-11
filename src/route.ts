import { type RouteRecordRaw } from 'vue-router'
import Index from './page/index/index.vue'
import Todo from './page/todo/todo.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/index',
    component: Index,
    name: '首页',
  },
  {
    path: '/todo',
    component: Todo,
  },
  {
    path: '/',
    redirect: '/todo',
  },
]
