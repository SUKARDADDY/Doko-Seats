const { createApp } = Vue;
import Toolbar from './components/Toolbar.js';
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

    const setTool = (tool) => {
      state.activeTool = tool;
      state.selectedSeat = null;
      state.selectedPolygonId = null;
    };

    const saveMap = () => {
      const data = JSON.stringify({ polygons: state.polygons }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seating-map.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    return { state, setTool, saveMap };
  },
  template: `
    <Toolbar :active-tool="state.activeTool" @tool-change="setTool" @save="saveMap" />
    <div class="flex flex-1 overflow-hidden">
      <MapEditor v-model:polygons="state.polygons"
                 :active-tool="state.activeTool"
                 v-model:selected-polygon-id="state.selectedPolygonId"
                 v-model:selected-seat="state.selectedSeat" />
      <SeatEditor v-if="state.selectedSeat" v-model="state.selectedSeat" />
    </div>
  `,
};

createApp(App).mount('#app');

