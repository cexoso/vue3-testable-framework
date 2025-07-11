import { type RouteRecordRaw } from 'vue-router'
import List from './page/list.vue'
import Index from './page/index/index.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/index',
    component: Index,
  },
  {
    path: '/list',
    component: List,
  },
  {
    path: '/',
    redirect: '/index',
  },
]
