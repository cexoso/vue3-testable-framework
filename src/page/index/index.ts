import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useIndex = defineStore('index', () => {
  const count = ref(0)
  const handleClick = (_e: MouseEvent) => {
    count.value += 1
  }
  return {
    handleClick,
    count: count,
  }
})
