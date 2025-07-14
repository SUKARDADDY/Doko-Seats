// Vue is loaded globally, so use the runtime APIs directly

function pointInPolygon(point, vs) {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default {
  props: {
    polygons: Array,
    activeTool: String,
    selectedPolygonId: Number,
    selectedSeat: Object,
  },
  emits: ['update:polygons', 'update:selectedPolygonId', 'update:selectedSeat'],
  setup(props, { emit }) {
    const svgRef = Vue.ref(null);
    const transform = Vue.reactive({ x: 0, y: 0, scale: 1 });
    const drawing = Vue.reactive({ active: false, points: [] });

    const startPan = Vue.reactive({ active: false, x: 0, y: 0, tx: 0, ty: 0 });

    const nextPolygonId = Vue.ref(1);
    const nextSeatId = Vue.ref(1);

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      transform.scale = Math.max(0.2, transform.scale + delta);
    };

    const onMouseDown = (e) => {
      if (props.activeTool === 'select') {
        startPan.active = true;
        startPan.x = e.clientX;
        startPan.y = e.clientY;
        startPan.tx = transform.x;
        startPan.ty = transform.y;
      }
    };

    const onMouseMove = (e) => {
      if (startPan.active) {
        const dx = e.clientX - startPan.x;
        const dy = e.clientY - startPan.y;
        transform.x = startPan.tx + dx;
        transform.y = startPan.ty + dy;
      }
    };

    const onMouseUp = () => {
      startPan.active = false;
    };

    const svgPoint = (e) => {
      const rect = svgRef.value.getBoundingClientRect();
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      return { x, y };
    };

    const startDrawing = (e) => {
      const p = svgPoint(e);
      drawing.active = true;
      drawing.points.push(p);
    };

    const addPoint = (e) => {
      const p = svgPoint(e);
      const first = drawing.points[0];
      if (drawing.points.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) < 10) {
        finishPolygon();
        return;
      }
      drawing.points.push(p);
    };

    const finishPolygon = () => {
      if (drawing.points.length >= 3) {
        props.polygons.push({
          id: nextPolygonId.value++,
          points: drawing.points.slice(),
          seats: [],
        });
        emit('update:polygons', props.polygons);
      }
      drawing.active = false;
      drawing.points.length = 0;
    };

    const onSvgClick = (e) => {
      if (props.activeTool === 'draw') {
        if (!drawing.active) startDrawing(e); else addPoint(e);
      } else if (props.activeTool === 'seats') {
        if (props.selectedPolygonId) {
          const poly = props.polygons.find(p => p.id === props.selectedPolygonId);
          if (poly && pointInPolygon(svgPoint(e), poly.points)) {
            poly.seats.push({
              id: nextSeatId.value++,
              x: svgPoint(e).x,
              y: svgPoint(e).y,
              number: '',
              price: '',
            });
            emit('update:polygons', props.polygons);
          }
        }
      } else if (props.activeTool === 'select') {
        const p = svgPoint(e);
        let found = false;
        for (const poly of props.polygons) {
          if (pointInPolygon(p, poly.points)) {
            emit('update:selectedPolygonId', poly.id);
            props.selectedSeat && emit('update:selectedSeat', null);
            found = true;
            break;
          }
        }
        if (!found) {
          emit('update:selectedPolygonId', null);
        }
      } else if (props.activeTool === 'delete') {
        if (props.selectedPolygonId) {
          const idx = props.polygons.findIndex(p => p.id === props.selectedPolygonId);
          if (idx !== -1) props.polygons.splice(idx, 1);
          emit('update:selectedPolygonId', null);
          emit('update:polygons', props.polygons);
        } else if (props.selectedSeat) {
          const poly = props.polygons.find(p => p.id === props.selectedSeat.polyId);
          if (poly) {
            const idx = poly.seats.findIndex(s => s.id === props.selectedSeat.id);
            if (idx !== -1) poly.seats.splice(idx, 1);
            emit('update:polygons', props.polygons);
            emit('update:selectedSeat', null);
          }
        }
      }
    };

    const onDblClick = () => {
      if (props.activeTool === 'draw') finishPolygon();
    };

    const seatClick = (poly, seat) => {
      emit('update:selectedPolygonId', poly.id);
      emit('update:selectedSeat', { ...seat, polyId: poly.id });
    };

    return {
      svgRef,
      transform,
      drawing,
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onSvgClick,
      onDblClick,
      seatClick,
    };
  },
  template: `
    <svg ref="svgRef"
         class="flex-1 bg-gray-100"
         @wheel="onWheel"
         @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"
         @click="onSvgClick" @dblclick="onDblClick">
      <g :transform="'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.scale + ')'">
        <g v-for="poly in polygons" :key="poly.id">
          <polygon
            :points="poly.points.map(p => \`${p.x},${p.y}\`).join(' ')"
            fill="none" stroke="black" stroke-width="2"
            :class="{'stroke-blue-500': poly.id === selectedPolygonId}" />
          <circle v-for="seat in poly.seats"
                  :key="seat.id"
                  :cx="seat.x" :cy="seat.y" r="4" fill="red"
                  @click.stop="seatClick(poly, seat)" />
        </g>
        <polyline v-if="drawing.active"
                  :points="drawing.points.map(p=>\`${p.x},${p.y}\`).join(' ')"
                  fill="none" stroke="blue" stroke-dasharray="4" />
        <circle v-for="(p,i) in drawing.points" :key="i" :cx="p.x" :cy="p.y" r="3" fill="blue" />
      </g>
    </svg>
  `,
};

