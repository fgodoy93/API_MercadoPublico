import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import './style.css'

// Configurar axios base URL ANTES de montar la app
axios.defaults.baseURL = 'http://localhost:3001'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
