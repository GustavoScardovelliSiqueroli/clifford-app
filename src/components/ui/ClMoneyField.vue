<template>
  <ClFormField
    v-bind="formFieldProps"
    :model-value="formattedValue"
    @update:model-value="onInput"
    @blur="onBlur"
    @focus="onFocus"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </ClFormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClFormField from './ClFormField.vue'

interface Props {
  modelValue: number | null | undefined
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  clearable?: boolean
  prepend?: string
  append?: string
  min?: number
  max?: number
  step?: number
  currency?: string
  locale?: string
  autocomplete?: string
}

interface Emits {
  'update:modelValue': [value: number | null]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  clear: []
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  min: 0,
  max: 999999999.99,
  step: 0.01,
  currency: 'BRL',
  locale: 'pt-BR',
  autocomplete: 'off',
})

const emit = defineEmits<Emits>()

const formFieldProps = computed(() => ({
  type: 'text' as const,
  inputmode: 'decimal' as const,
  autocomplete: props.autocomplete,
  label: props.label,
  placeholder: props.placeholder,
  error: props.error,
  hint: props.hint,
  disabled: props.disabled,
  readonly: props.readonly,
  required: props.required,
  clearable: props.clearable,
  prepend: props.prepend,
  append: props.append,
}))

const formattedValue = computed({
  get() {
    if (props.modelValue === null || props.modelValue === undefined) {
      return ''
    }
    return formatNumber(props.modelValue)
  },
  set() {
    // Não usado diretamente, onInput faz o parsing
  },
})

function formatNumber(value: number): string {
  return value.toLocaleString(props.locale, {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseNumber(formatted: string): number | null {
  if (!formatted || !formatted.trim()) return null
  
  let cleaned = formatted.replace(/[^\d.,-]/g, '')
  
  if (!cleaned) return null
  
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')
    
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart.length === 3) {
        cleaned = cleaned.replace(/\./g, '')
      }
    }
  }
  
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed)) return null
  
  if (parsed < props.min) return props.min
  if (parsed > props.max) return props.max
  
  return parsed
}

function onInput(value: string | number) {
  const parsed = parseNumber(String(value))
  emit('update:modelValue', parsed)
}

function onBlur(event: FocusEvent) {
  emit('blur', event)
}

function onFocus(event: FocusEvent) {
  emit('focus', event)
}
</script>

<style scoped lang="scss">
/* Estilos adicionais se necessário - herda do ClFormField */
</style>