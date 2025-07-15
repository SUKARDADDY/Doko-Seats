<template>
  <div
    ref="container"
    tabindex="0"
    class="relative w-full h-full outline-none select-none"
    @click="onBackgroundClick"
    @keydown="onKey"
  >
    <img :src="background" class="absolute inset-0 w-full h-full object-cover pointer-events-none" />
    <div
      v-for="seat in seatList"
      :key="seat.id"
      class="absolute flex items-center justify-center w-6 h-6 rounded-full text-xs bg-white cursor-pointer border"
      :class="seat.id === (selectedSeat && selectedSeat.id) ? 'border-blue-500 ring-2 ring-blue-400' : 'border-gray-400'"
      :style="{ left: seat.x + 'px', top: seat.y + 'px' }"
      @mousedown.stop.prevent="startDrag(seat, $event)"
      @click.stop="selectSeat(seat)"
      @dblclick.stop="editSeat(seat)"
    >
      <input
        v-if="editingId === seat.id"
        ref="editInput"
        v-model="seat.label"
        class="w-full h-full text-center text-xs bg-transparent border-none focus:outline-none"
        @blur="finishEdit"
        @keydown.enter.prevent="finishEdit"
      />
      <span v-else>{{ seat.label }}</span>
    </div>
    <button class="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-sm rounded" @click.stop="save">Save</button>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  background: String,
  seats: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:seats', 'save'])

const container = ref(null)
const seatList = reactive([])
watch(
  () => props.seats,
  (val) => {
    seatList.splice(0)
    val.forEach(s => seatList.push({ ...s }))
    updateNextNumber()
  },
  { immediate: true }
)

const nextNumber = ref(1)
function updateNextNumber() {
  if (seatList.length) {
    const nums = seatList.map(s => parseInt(s.label) || 0)
    nextNumber.value = Math.max(...nums) + 1
  }
}

const selectedSeat = ref(null)
const editingId = ref(null)
const editInput = ref(null)

const drag = ref(null)
function onBackgroundClick(e) {
  if (e.target !== container.value) return
  const rect = container.value.getBoundingClientRect()
  const seat = {
    id: crypto.randomUUID(),
    label: String(nextNumber.value++),
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  seatList.push(seat)
  emit('update:seats', seatList)
}

function selectSeat(seat) {
  selectedSeat.value = seat
}

function startDrag(seat, e) {
  drag.value = { seat, sx: seat.x, sy: seat.y, ox: e.clientX, oy: e.clientY }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', stopDrag)
}
function onDragMove(e) {
  if (!drag.value) return
  const { seat, sx, sy, ox, oy } = drag.value
  seat.x = sx + (e.clientX - ox)
  seat.y = sy + (e.clientY - oy)
}
function stopDrag() {
  if (drag.value) {
    emit('update:seats', seatList)
    drag.value = null
  }
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', stopDrag)
}

function editSeat(seat) {
  editingId.value = seat.id
  nextTick(() => {
    editInput.value && editInput.value.focus()
  })
}
function finishEdit() {
  if (editingId.value) {
    editingId.value = null
    emit('update:seats', seatList)
  }
}

function onKey(e) {
  if (e.key === 'Delete') {
    deleteSelected()
  }
}

function deleteSelected() {
  if (!selectedSeat.value) return
  const idx = seatList.findIndex(s => s.id === selectedSeat.value.id)
  if (idx !== -1) {
    seatList.splice(idx, 1)
    emit('update:seats', seatList)
  }
  selectedSeat.value = null
}

function save() {
  emit('save', {
    seats: seatList.map(s => ({ id: s.id, label: s.label, x: s.x, y: s.y }))
  })
}

onMounted(() => {
  container.value && container.value.focus()
})
</script>
