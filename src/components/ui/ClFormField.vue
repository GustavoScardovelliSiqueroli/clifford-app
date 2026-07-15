<template>
  <div class="form-field" :class="variantClasses">
    <label v-if="label" :for="inputId" class="form-field__label">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>
    
    <div class="form-field__control">
      <div 
        v-if="prepend || append" 
        class="form-field__input-wrapper form-field__input-wrapper--affix"
      >
        <span v-if="prepend" class="form-field__affix form-field__affix--prepend">
          <slot name="prepend">{{ prepend }}</slot>
        </span>
        
        <input
          :id="inputId"
          :type="type"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :aria-invalid="!!error"
          :aria-describedby="error ? errorId : hint ? hintId : undefined"
          :aria-required="required"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
          class="form-field__input"
          ref="inputRef"
        />
        
        <span v-if="append" class="form-field__affix form-field__affix--append">
          <slot name="append">{{ append }}</slot>
        </span>
      </div>
      
      <input
        v-else
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="!!error"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        :aria-required="required"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        class="form-field__input"
        ref="inputRef"
      />
      
      <div v-if="clearable && modelValue && !disabled && !readonly" 
           class="form-field__clear" 
           @click="clear"
           aria-label="Limpar campo">
        <q-icon name="close" size="16px" color="grey-5" />
      </div>
    </div>
    
    <p v-if="error" :id="errorId" class="form-field__error" role="alert">
      <q-icon name="error" size="12px" class="q-mr-xs" />
      {{ error }}
    </p>
    
    <p v-else-if="hint" :id="hintId" class="form-field__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { QIcon } from 'quasar'

interface Props {
  modelValue: string | number
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  prepend?: string
  append?: string
  clearable?: boolean
  name?: string
  autocomplete?: string
  inputmode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'url'
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const inputId = `field-${Math.random().toString(36).substr(2, 9)}`
const errorId = `${inputId}-error`
const hintId = `${inputId}-hint`

const variantClasses = computed(() => {
  const classes = ['form-field']
  if (props.error) classes.push('form-field--error')
  if (focused.value) classes.push('form-field--focused')
  if (props.disabled) classes.push('form-field--disabled')
  if (props.readonly) classes.push('form-field--readonly')
  if (String(props.modelValue).length > 0) classes.push('form-field--filled')
  return classes.join(' ')
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function handleBlur(event: FocusEvent) {
  focused.value = false
  emit('blur', event)
}

function handleFocus(event: FocusEvent) {
  focused.value = true
  emit('focus', event)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

watch(() => props.disabled, (val) => {
  if (val) focused.value = false
})
</script>

<style scoped lang="scss">
.form-field {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.form-field__label {
  display: block;
  font-size: var(--font-size-caption-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2);
  line-height: var(--line-height-normal);
}

.form-field__required {
  color: var(--color-negative);
  margin-left: var(--spacing-1);
}

.form-field__control {
  display: flex;
  align-items: center;
  position: relative;
}

.form-field__input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-input);
  transition: border-color var(--transition-input), box-shadow var(--transition-input);
  
  &:hover:not(.form-field--disabled):not(.form-field--readonly) {
    border-color: var(--color-border-medium);
  }
  
  &.form-field--focused {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.15);
  }
  
  &.form-field--error:not(.form-field--focused) {
    border-color: var(--color-negative);
    box-shadow: 0 0 0 3px rgba(var(--color-negative), 0.15);
  }
}

.form-field__input-wrapper--affix {
  border-radius: var(--border-radius-input);
}

.form-field__affix {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-3);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-input);
  
  &.form-field__affix--prepend {
    border-right: 1px solid var(--color-border-light);
    border-radius: var(--border-radius-input) 0 0 var(--border-radius-input);
  }
  
  &.form-field__affix--append {
    border-left: 1px solid var(--color-border-light);
    border-radius: 0 var(--border-radius-input) var(--border-radius-input) 0;
  }
}

.form-field__input {
  flex: 1;
  width: 100%;
  height: var(--input-height-md);
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-body);
  font-family: var(--font-family-base);
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  outline: none;
  border-radius: var(--border-radius-input);
  box-sizing: border-box;
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
  
  &:disabled {
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }
  
  &:read-only {
    cursor: default;
  }
  
  // Remove number input spinners
  &[type="number"] {
    -moz-appearance: textfield;
  }
  
  &[type="number"]::-webkit-outer-spin-button,
  &[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.form-field__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: var(--spacing-1);
  border-radius: var(--border-radius-full);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
}

.form-field__error {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-normal);
  color: var(--color-negative);
  margin: var(--spacing-1) 0 0;
  line-height: var(--line-height-normal);
}

.form-field__hint {
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
  margin: var(--spacing-1) 0 0;
  line-height: var(--line-height-normal);
}

// Floating label effect when filled
.form-field--filled .form-field__label {
  color: var(--color-text-secondary);
}

.form-field--focused .form-field__label {
  color: var(--color-primary);
}
</style>