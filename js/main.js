const { loadModule } = window['vue3-sfc-loader']
const options = {
  moduleCache: { vue: Vue },
  async getFile(url) { return (await fetch(url)).text() },
  addStyle(text) { const style = Object.assign(document.createElement('style'),{textContent:text}); document.head.appendChild(style) }
}
const App = Vue.defineAsyncComponent(() => loadModule('./js/App.vue', options))
Vue.createApp(App).mount('#app')
