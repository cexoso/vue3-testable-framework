import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useHttp } from '../../layout/http-service'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const newTodo = ref('')

  const addTodo = () => {
    if (newTodo.value.trim()) {
      todos.value.push({
        id: Date.now(),
        text: newTodo.value,
        completed: false,
      })
      newTodo.value = ''
    }
  }

  const toggleTodo = (id: number) => {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter((t) => t.id !== id)
  }

  const http = useHttp()

  const loadTodoListfromServer = async () => {
    const response = await http.getTodoList({ status: 'done' })
    todos.value = response.data
  }

  return {
    todos,
    newTodo,
    addTodo,
    toggleTodo,
    removeTodo,
    loadTodoListfromServer,
  }
})
