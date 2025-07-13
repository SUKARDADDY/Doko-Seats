export default {
  props: {
    modelValue: Object,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const seat = Vue.reactive({ ...props.modelValue });
    Vue.watch(() => props.modelValue, (v) => {
      Object.assign(seat, v);
    });
    const update = () => emit('update:modelValue', { ...seat });
    const deleteSeat = () => emit('update:modelValue', null);
    return { seat, update, deleteSeat };
  },
  template: `
    <div class="w-64 p-2 border-l bg-white">
      <h3 class="font-bold mb-2">Seat Properties</h3>
      <div class="mb-2">
        <label class="block text-sm">Number</label>
        <input type="text" v-model="seat.number" class="w-full border p-1" />
      </div>
      <div class="mb-2">
        <label class="block text-sm">Price Level</label>
        <input type="text" v-model="seat.price" class="w-full border p-1" />
      </div>
      <div class="flex space-x-2">
        <button class="px-2 py-1 bg-blue-500 text-white rounded" @click="update">
          Save
        </button>
        <button class="px-2 py-1 bg-red-500 text-white rounded" @click="deleteSeat">
          Delete
        </button>
      </div>
    </div>
  `,
};

