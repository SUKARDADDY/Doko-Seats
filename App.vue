<template>
  <div class="min-h-screen flex flex-col items-center p-6 space-y-4">
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded shadow"
      @click="loadDemo"
    >
      Load Demo Polygon
    </button>

    <div class="w-full max-w-3xl h-96">
      <PolygonEditor
        class="w-full h-full border"
        background="stadium.jpg"
        :polygon="polygon"
        @save="onSave"
      />
    </div>

    <pre
      v-if="saved"
      class="w-full max-w-3xl bg-gray-100 p-4 rounded overflow-auto"
    >{{ savedText }}</pre>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PolygonEditor from './js/components/PolygonEditor.vue'

const polygon = ref(null)
const saved = ref(null)

function loadDemo() {
  polygon.value = {
    id: 1,
    seatBlockName: 'Demo Block',
    points: [
      { x: 150, y: 80 },
      { x: 250, y: 60 },
      { x: 300, y: 200 },
      { x: 200, y: 220 }
    ]
  }
}

function onSave(data) {
  saved.value = data
}

const savedText = computed(() =>
  saved.value ? JSON.stringify(saved.value, null, 2) : ''
)
</script>

<style scoped>
</style>

