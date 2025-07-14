/* global Vue */
/* eslint-disable no-undef */
const { createApp } = Vue;

import Toolbar   from './components/Toolbar.js';
import MapEditor from './components/MapEditor.js';
import SeatEditor from './components/SeatEditor.js';

const App = {
  components: { Toolbar, MapEditor, SeatEditor },

  setup() {
    const state = Vue.reactive({
      polygons: [],
      activeTool: 'select',
      selectedPolygonId: null,
      selectedSeat: null,
    });

    const setTool = tool => {
      state.activeTool = tool;
      state.selectedSeat = null;
      state.selectedPolygonId = null;
    };

    const saveMap = () => {
      const data = JSON.stringify({ polygons: state.polygons }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: 'seating-map.json',
      });
      a.click();
      URL.revokeObjectURL(url);
    };

    return { state, setTool, saveMap };
  },

  /* ─────────────────────────────  UI  ───────────────────────────── */
  template: `
    <div style="height:100%;display:flex;flex-direction:column">
      <!-- Toolbar -->
      <Toolbar
        :active-tool="state.activeTool"
        @tool-change="setTool"
        @save="saveMap"
      />

      <!-- Canvas / editor -->
      <MapEditor
        style="flex:1"
        :polygons="state.polygons"
        :activeTool="state.activeTool"
        :selectedPolygonId="state.selectedPolygonId"
        :selectedSeat="state.selectedSeat"
        @update:polygons="state.polygons = $event"
        @update:selectedPolygonId="state.selectedPolygonId = $event"
        @update:selectedSeat="state.selectedSeat = $event"
      />

      <!-- Seat-property pane -->
      <SeatEditor
        v-if="state.selectedSeat"
        :modelValue="state.selectedSeat"
        @update:modelValue="state.selectedSeat = $event"
        style="position:absolute;top:8px;right:8px;width:240px"
      />
    </div>
  `,
};

/* Mount */
createApp(App).mount('#app');
