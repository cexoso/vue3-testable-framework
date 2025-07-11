<template>
  <div>
    <h1 class="center">welcome</h1>
    <p>这是一个 vue3 项目，用于展示如何构建一个可测试，开发友好的项目。</p>
    <p>这个项目中有一个 TodoList 应用，TodoList 是用于演示如何 mock 掉请求，从行为的角度描述软件行为的.</p>
    <p>
      这个项目依赖了 vue-router，采用了单页应用的方式，这为了演示在测试环境仍然可以把路由包含在内，除了
      vue-router 外，还会依赖 vue-i18n 国标化多语言插件——用于演示 v8 引擎全局单例的害处、以及应该如何避免
    </p>
  </div>
</template>
