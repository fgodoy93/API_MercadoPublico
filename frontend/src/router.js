import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue')
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('./views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/licitaciones',
    name: 'Licitaciones',
    component: () => import('./views/Licitaciones.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/compras-agiles',
    name: 'ComprasAgiles',
    component: () => import('./views/ComprasAgiles.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/postulaciones',
    name: 'Postulaciones',
    component: () => import('./views/Postulaciones.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/licitaciones/:codigo',
    name: 'DetalleLicitacion',
    component: () => import('./views/DetalleLicitacion.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'PerfilEmpresa',
    component: () => import('./views/PerfilEmpresa.vue'),
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
