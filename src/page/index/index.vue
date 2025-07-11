<template>
  <div>
    {{ store.count }}
    <button @click="index.handleClick">click</button>
  </div>
</template>
<script lang="ts" setup>
import { useIndex } from './index'
import { storeToRefs } from 'pinia'
const index = useIndex()
const store = storeToRefs(index)
</script>
