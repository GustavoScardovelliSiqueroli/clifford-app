<template>
  <div class="form-field">
    <label v-if="label" :for="inputId" class="form-field__label">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>

    <div class="form-field__control" :class="{ 'form-field__control--error': hasError }">
      <textarea
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
        class="form-field__textarea"
      />
    </div>

    <div v-if="hasError" :id="`${inputId}-error`" class="form-field__error" role="alert">
      <q-icon name="error_outline" size="12px" class="form-field__error-icon" />
      <span>{{ errorMessage }}</span>
    </div>

    <div v-else-if="hint" :id="`${inputId}-hint`" class="form-field__hint">
      {{ hint }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  hint?: string;
  rows?: number;
}

interface Emits {
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const inputId = `textarea-${Math.random().toString(36).substr(2, 9)}`;

const hasError = computed(() => props.error === true && !!props.errorMessage);

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}

function onBlur(event: FocusEvent) {
  emit('blur', event);
}

function onFocus(event: FocusEvent) {
  emit('focus', event);
}
</script>

<style scoped lang="scss">
.form-field__textarea {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--border-radius-input);
  font-size: var(--font-size-body);
  font-family: var(--font-family-base);
  color: var(--color-text-primary);
  padding: var(--spacing-3) var(--spacing-4);
  line-height: var(--line-height-normal);
  resize: vertical;
  min-height: 80px;

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
}
</style>
