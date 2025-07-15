<template>
  <div class="w-full h-full relative">
    <SeatMapEditor
      class="w-full h-full"
      :background="background"
      v-model:seats="seats"
      @save="handleSave"
    />
    <pre
      v-if="saved"
      class="absolute bottom-2 left-2 bg-white text-xs p-2 rounded shadow max-w-xs max-h-40 overflow-auto"
    >{{ JSON.stringify(saved, null, 2) }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SeatMapEditor from './components/SeatMapEditor.vue'

const background =
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80'

const seats = ref([
  { id: crypto.randomUUID(), label: '1', x: 120, y: 80 },
  { id: crypto.randomUUID(), label: '2', x: 220, y: 160 }
])

const saved = ref(null)

function handleSave(payload) {
  saved.value = payload
}
</script>
