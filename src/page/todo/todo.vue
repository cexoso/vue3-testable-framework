<template>
  <div class="p-4 max-w-lg mx-auto">
    <h1 class="text-2xl font-bold mb-4">TODO List</h1>

    <div class="flex gap-2 mb-4">
      <input
        v-model="newTodo"
        @keyup.enter="todoController.addTodo"
        placeholder="添加新任务"
        class="flex-1 px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
      />
      <button
        @click="todoController.addTodo"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
      >
        添加
      </button>
    </div>

    <ul class="space-y-2">
      <li v-for="todo of todos" :key="todo.id" class="flex items-center gap-2 p-2 border rounded">
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="todoController.toggleTodo(todo.id)"
          class="h-5 w-5"
        />
        <span
          :class="{
            'line-through text-gray-500': todo.completed,
          }"
          class="flex-1"
        >
          {{ todo.text }}
        </span>
        <button
          @click="todoController.removeTodo(todo.id)"
          class="px-2 py-1 text-red-500 hover:bg-red-100 rounded"
        >
          删除
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { useTodoStore } from './todo'
import { storeToRefs } from 'pinia'

const todoController = useTodoStore()
todoController.loadTodoListfromServer()
const { todos, newTodo } = storeToRefs(todoController)
</script>
