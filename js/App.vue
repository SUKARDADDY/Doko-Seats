<template>
  <div class="w-full h-full relative">
    <SeatMapEditor class="w-full h-full" :background="bg" v-model:seats="seats" @save="saved = $event" />
    <pre class="absolute bottom-2 left-2 bg-white text-xs p-2 rounded shadow max-w-xs max-h-40 overflow-auto" v-if="saved">{{ JSON.stringify(saved, null, 2) }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SeatMapEditor from './components/SeatMapEditor.vue'

const bg = 'https://picsum.photos/800/600?random=1'
const seats = ref([])
const saved = ref(null)
</script>
