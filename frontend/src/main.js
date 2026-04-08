import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Configurar axiosinstance con base URL
import axios from 'axios'
axios.defaults.baseURL = 'http://localhost:3001'
