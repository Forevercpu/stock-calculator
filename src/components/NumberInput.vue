<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: number; label: string; unit: string; min?: number; step?: number }>(),
  { min: 0, step: 1 },
)
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function update(value: string) {
  const parsed = Number(value)
  emit('update:modelValue', Number.isFinite(parsed) ? Math.max(parsed, props.min) : props.min)
}

function adjust(direction: 1 | -1) {
  const precision = (String(props.step).split('.')[1] ?? '').length
  const next = Math.max(props.min, (Number(props.modelValue) || 0) + props.step * direction)
  emit('update:modelValue', Number(next.toFixed(precision)))
}
</script>

<template>
  <label class="number-field">
    <span>{{ label }}</span>
    <div class="number-control">
      <input :value="modelValue" type="number" :min="min" :step="step" inputmode="decimal" @input="update(($event.target as HTMLInputElement).value)" />
      <div class="stepper">
        <button type="button" :aria-label="`${label}增加`" @click="adjust(1)">▲</button>
        <button type="button" :aria-label="`${label}减少`" @click="adjust(-1)">▼</button>
      </div>
      <b>{{ unit }}</b>
    </div>
  </label>
</template>
