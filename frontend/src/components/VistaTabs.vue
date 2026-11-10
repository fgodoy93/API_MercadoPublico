<template>
  <nav class="flex flex-wrap gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-300">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex-1 min-w-[180px] text-center text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition"
      :class="esActiva(tab) ? tab.activa : 'text-slate-600 hover:bg-slate-100'"
    >
      {{ tab.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/', label: '🌐 Todas las Licitaciones (Más Nuevas)', activa: 'bg-blue-600 text-white shadow', match: ['/', '/licitaciones'] },
  { to: '/recomendadas', label: '🎯 Recomendadas para Mi Empresa', activa: 'bg-indigo-600 text-white shadow', match: ['/recomendadas'] },
  { to: '/compras-agiles', label: '⚡ Compras Ágiles (< 100 UTM)', activa: 'bg-emerald-600 text-white shadow', match: ['/compras-agiles'] }
]

const esActiva = (tab) => tab.match.includes(route.path)
</script>
