<template>
  <ClFormField
    v-bind="formFieldProps"
    :model-value="displayValue"
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
import { ref, computed, watch } from 'vue'
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

// Estado interno para controlar se está focado/digitando
const isFocused = ref(false)
// Valor bruto digitado pelo usuário (sem formatação)
const rawInputValue = ref<string>('')

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

// Valor exibido: raw enquanto focado, formatado quando não focado
const displayValue = computed({
  get() {
    // Se está focado, mostra raw (mesmo se vazio, para não mostrar "R$ 0,00")
    if (isFocused.value) {
      return rawInputValue.value
    }
    // Senão mostra formatado (ou vazio)
    if (props.modelValue === null || props.modelValue === undefined) {
      return ''
    }
    return formatNumber(props.modelValue)
  },
  set() {
    // Não usado diretamente
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
      if (lastPart && lastPart.length === 3 && parts.length > 1) {
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
  const strValue = String(value)
  rawInputValue.value = strValue
  isFocused.value = true
  
  // Parse e emite o número para o parent
  const parsed = parseNumber(strValue)
  emit('update:modelValue', parsed)
}

function onBlur(event: FocusEvent) {
  // Ao perder foco, limpa o raw value e emite blur
  isFocused.value = false
  rawInputValue.value = ''
  emit('blur', event)
}

function onFocus(event: FocusEvent) {
  isFocused.value = true
  
  // Se o valor é 0, null ou undefined, limpa o raw input para facilitar digitação
  if (props.modelValue === 0 || props.modelValue === null || props.modelValue === undefined) {
    rawInputValue.value = ''
  }
  
  emit('focus', event)
}

// Observar mudanças no modelValue vindo de fora (ex: reset do formulário)
watch(() => props.modelValue, (newVal: number | null | undefined) => {
  if (newVal === 0 || newVal === null || newVal === undefined) {
    rawInputValue.value = ''
  }
})
</script>

<style scoped lang="scss">
/* Estilos adicionais se necessário - herda do ClFormField */
</style>