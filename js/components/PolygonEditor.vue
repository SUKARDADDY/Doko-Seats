<template>
  <div class="relative w-full h-full select-none" @keydown="onKey" tabindex="0" ref="root">
    <img :src="background" class="absolute inset-0 w-full h-full object-cover" />
    <canvas ref="canvas" class="absolute inset-0"></canvas>
    <svg class="absolute inset-0" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @dblclick.stop="removeVertex" @click="canvasClick">
      <g v-for="(p, index) in points" :key="index">
        <circle
          :cx="p.x"
          :cy="p.y"
          r="6"
          class="fill-white stroke-blue-500 stroke-2 cursor-move"
          @mousedown.stop="startDrag(index, $event)"
          @dblclick.stop="deleteVertex(index)"
        />
      </g>
      <g v-for="(m, idx) in midHandles" :key="'m'+idx">
        <rect
          v-if="mode==='edit'"
          :x="m.x-5"
          :y="m.y-5"
          width="10" height="10"
          class="fill-blue-400 cursor-pointer"
          @mousedown.stop="startInsert(idx, $event)"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  background: String,
  polygon: Object
})
const emit = defineEmits(['save'])

const root = ref(null)
const canvas = ref(null)

const mode = ref('idle') // idle | drawing | edit
const points = reactive([])
const current = ref(null) // current mouse point for preview
const activeIndex = ref(null)
const history = reactive({ past: [], future: [] })
const seatBlockName = ref('')

watch(() => props.polygon, p => {
  points.splice(0)
  if (p && p.points) {
    p.points.forEach(pt => points.push({ x: pt.x, y: pt.y }))
    seatBlockName.value = p.seatBlockName || ''
    mode.value = 'edit'
  }
  draw()
}, { immediate: true })

function pushHistory() {
  history.past.push(JSON.stringify(points))
  history.future = []
}

function undo() {
  if (!history.past.length) return
  history.future.push(JSON.stringify(points))
  const prev = history.past.pop()
  points.splice(0)
  JSON.parse(prev).forEach(p => points.push(p))
  draw()
}
function redo() {
  if (!history.future.length) return
  history.past.push(JSON.stringify(points))
  const next = history.future.pop()
  points.splice(0)
  JSON.parse(next).forEach(p => points.push(p))
  draw()
}

function canvasClick(e) {
  if (mode.value === 'drawing') {
    const p = getPos(e)
    if (points.length > 2 && dist(p, points[0]) < 10) {
      finishDrawing()
    } else {
      points.push(p)
      pushHistory()
      draw()
    }
  }
}

function startDrawing(e) {
  mode.value = 'drawing'
  points.splice(0)
  points.push(getPos(e))
  pushHistory()
  draw()
}

function finishDrawing() {
  mode.value = 'edit'
  current.value = null
  draw()
  emit('save', {
    id: props.polygon?.id || Date.now(),
    points: points.map(p => ({ x: p.x, y: p.y })),
    seatBlockName: seatBlockName.value
  })
}

let drag = null
function startDrag(index, e) {
  activeIndex.value = index
  drag = { type: 'vertex', index }
}
function startInsert(index, e) {
  drag = { type: 'insert', index }
}
function onMouseDown(e) {
  if (mode.value === 'idle') {
    startDrawing(e)
  }
}
function onMouseMove(e) {
  if (mode.value === 'drawing') {
    current.value = getPos(e)
    draw()
  } else if (drag) {
    const p = snap(getPos(e), e)
    if (drag.type === 'vertex') {
      points[drag.index].x = p.x
      points[drag.index].y = p.y
    } else if (drag.type === 'insert') {
      points.splice(drag.index+1,0,{x:p.x,y:p.y})
      drag = { type:'vertex', index: drag.index+1 }
    }
    draw()
  }
}
function onMouseUp() {
  if (drag) {
    pushHistory()
    drag = null
  }
}
function deleteVertex(idx) {
  if (points.length <= 3) return
  points.splice(idx,1)
  pushHistory()
  draw()
}
function removeVertex(e) {
  if(mode.value==='drawing'){ finishDrawing() }
}

function onKey(e) {
  if (e.key === 'Escape') {
    if (mode.value === 'drawing') { mode.value='idle'; points.splice(0); draw() }
  } else if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z') { e.preventDefault(); undo() }
  else if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='y') { e.preventDefault(); redo() }
  else if (e.key==='Delete' && activeIndex.value!=null) { deleteVertex(activeIndex.value) }
  else if (e.altKey && activeIndex.value!=null) {
    const p = points[activeIndex.value]
    if (e.key==='ArrowLeft') p.x -=1
    if (e.key==='ArrowRight') p.x +=1
    if (e.key==='ArrowUp') p.y -=1
    if (e.key==='ArrowDown') p.y +=1
    draw(); pushHistory()
  } else if (e.key==='Enter' && mode.value==='drawing') { finishDrawing() }
}

function getPos(e) {
  const rect = canvas.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y) }
function snap(p,e){
  if(e.shiftKey && points.length){
    const last=points[drag?drag.index:points.length-1]
    const dx=p.x-last.x; const dy=p.y-last.y
    const angle=Math.round(Math.atan2(dy,dx)/ (Math.PI/4)) * (Math.PI/4)
    const len=Math.round(Math.hypot(dx,dy)/10)*10
    return {x:last.x+Math.cos(angle)*len, y:last.y+Math.sin(angle)*len}
  }
  return p
}

const midHandles = computed(() => {
  const arr=[]
  if (points.length <2) return arr
  for(let i=0;i<points.length;i++){
    const n=(i+1)%points.length
    arr.push({ x:(points[i].x+points[n].x)/2, y:(points[i].y+points[n].y)/2 })
  }
  return arr
})

function draw(){
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0,0,canvas.value.width,canvas.value.height)
  if(points.length){
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for(let i=1;i<points.length;i++){ ctx.lineTo(points[i].x, points[i].y) }
    if(mode.value!=='drawing') ctx.closePath()
    ctx.fillStyle='rgba(59,130,246,0.3)'
    ctx.strokeStyle='rgb(37,99,235)'
    ctx.lineWidth=2
    ctx.fill(); ctx.stroke()
  }
  if(mode.value==='drawing' && current.value){
    ctx.beginPath()
    const last=points[points.length-1]
    ctx.moveTo(last.x,last.y)
    ctx.lineTo(current.value.x,current.value.y)
    ctx.strokeStyle='rgb(37,99,235)'
    ctx.setLineDash([6,4])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

onMounted(() => {
  const el = canvas.value
  el.width = el.offsetWidth
  el.height = el.offsetHeight
  draw()
  root.value.focus()
})

onBeforeUnmount(() => { })
</script>

<style scoped>
</style>

