export default {
  props: {
    activeTool: String,
  },
  emits: ['tool-change', 'save'],
  setup(props, { emit }) {
    const tools = [
      { id: 'draw', label: 'Draw Polygon' },
      { id: 'seats', label: 'Place Seats' },
      { id: 'select', label: 'Select' },
      { id: 'delete', label: 'Delete' },
    ];

    const setTool = (tool) => emit('tool-change', tool);

    return { tools, setTool };
  },
  template: `
    <div class="flex space-x-2 bg-gray-800 text-white p-2">
      <button
        v-for="t in tools"
        :key="t.id"
        class="px-3 py-1 rounded" 
        :class="{'bg-blue-500': t.id === activeTool}" 
        @click="setTool(t.id)"
      >{{ t.label }}</button>
      <button class="ml-auto px-3 py-1 bg-green-600 rounded" @click="$emit('save')">
        Save Map
      </button>
    </div>
  `,
};

