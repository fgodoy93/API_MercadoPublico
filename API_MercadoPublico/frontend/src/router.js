import { createRouter, createWebHistory } from 'vue-router'
import { defineAsyncComponent } from 'vue'

const Login = defineAsyncComponent(() => import('./views/Login.vue'))
const Dashboard = defineAsyncComponent(() => import('./views/Dashboard.vue'))
const Licitaciones = defineAsyncComponent(() => import('./views/Licitaciones.vue'))
const PerfilEmpresa = defineAsyncComponent(() => import('./views/PerfilEmpresa.vue'))
const DetalleLicitacion = defineAsyncComponent(() => import('./views/DetalleLicitacion.vue'))

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/licitaciones',
    name: 'Licitaciones',
    component: Licitaciones,
    meta: { requiresAuth: true }
  },
  {
    path: '/licitaciones/:codigo',
    name: 'DetalleLicitacion',
    component: DetalleLicitacion,
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'PerfilEmpresa',
    component: PerfilEmpresa,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
