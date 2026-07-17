<template>
  <div class="cl-date-field">
    <!-- Input nativo date (mobile/moderno) -->
    <ClFormField
      v-if="useNative"
      v-bind="nativeFormFieldProps"
      :model-value="nativeValue"
      @update:model-value="onNativeInput"
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

    <!-- Fallback com q-date para Safari/desktop legacy -->
    <ClFormField
      v-else
      v-bind="fallbackFormFieldProps"
      :model-value="displayValue"
      @update:model-value="onFallbackInput"
      @blur="onBlur"
      @focus="onFocus"
    >
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template #append>
        <q-popup-proxy v-model="popupOpen" cover transition-show="scale" transition-hide="scale">
          <q-date
            v-model="fallbackDate"
            :mask="dateMask"
            :min="minDate"
            :max="maxDate"
            :first-day-of-week="firstDayOfWeek"
            :show-week-numbers="showWeekNumbers"
            @input="onFallbackDateSelect"
          >
            <div class="row items-center justify-end q-gutter-sm q-pa-md">
              <q-btn v-close-popup label="Limpar" color="negative" flat @click="clearDate" />
              <q-btn v-close-popup label="Hoje" color="primary" flat @click="selectToday" />
              <q-btn v-close-popup label="OK" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </template>
    </ClFormField>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { date } from 'quasar';
import ClFormField from './ClFormField.vue';
import { QPopupProxy, QDate, QBtn } from 'quasar';

interface Props {
  modelValue: string; // Formato ISO: YYYY-MM-DD
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  clearable?: boolean;
  prepend?: string;
  append?: string;
  min?: string; // ISO YYYY-MM-DD
  max?: string; // ISO YYYY-MM-DD
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1 | 6;
}

interface Emits {
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  clear: [];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
  clearable: true,
  showWeekNumbers: false,
  firstDayOfWeek: 0,
});

const emit = defineEmits<Emits>();

const supportsNativeDate = ref(false);
const popupOpen = ref(false);
const fallbackDate = ref<string | null>(null);

const nativeFormFieldProps = computed(() => ({
  type: 'date' as const,
  autocomplete: 'off',
  label: props.label,
  placeholder: props.placeholder,
  error: props.error,
  hint: props.hint,
  disabled: props.disabled,
  readonly: props.readonly,
  required: props.required,
  prepend: props.prepend,
  append: props.append,
}));

const fallbackFormFieldProps = computed(() => ({
  type: 'text' as const,
  autocomplete: 'off',
  label: props.label,
  placeholder: props.placeholder,
  error: props.error,
  hint: props.hint,
  disabled: props.disabled,
  readonly: props.readonly,
  required: props.required,
  prepend: props.prepend,
  append: props.append,
  clearable: props.clearable && !!props.modelValue,
}));

const dateMask = computed(() => 'DD/MM/YYYY');
const minDate = computed(() => props.min || undefined);
const maxDate = computed(() => props.max || undefined);

const nativeValue = computed({
  get: () => props.modelValue || '',
  set: (val: string | number) => {
    emit('update:modelValue', String(val));
  },
});

const displayValue = computed({
  get: () => {
    if (!props.modelValue) return '';
    return formatToDisplay(props.modelValue);
  },
  set: (val: string | number) => {
    const iso = parseDisplayToISO(String(val));
    emit('update:modelValue', iso || '');
  },
});

const useNative = computed(() => supportsNativeDate.value && !props.readonly);

function formatToDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function parseDisplayToISO(display: string): string {
  if (!display) return '';
  const parts = display.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  if (!day || !month || !year) return '';
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return '';
  return `${year}-${month}-${day}`;
}

function onNativeInput(val: string | number) {
  emit('update:modelValue', String(val));
}

function onFallbackInput(val: string | number) {
  const iso = parseDisplayToISO(String(val));
  emit('update:modelValue', iso || '');
}

function onFallbackDateSelect(val: string) {
  const iso = parseDisplayToISO(val);
  emit('update:modelValue', iso || '');
  fallbackDate.value = val;
  popupOpen.value = false;
}

function onBlur(event: FocusEvent) {
  emit('blur', event);
}

function onFocus(event: FocusEvent) {
  emit('focus', event);
}

function selectToday() {
  const today = date.formatDate(new Date(), 'YYYY-MM-DD');
  emit('update:modelValue', today);
  fallbackDate.value = formatToDisplay(today);
}

function clearDate() {
  emit('update:modelValue', '');
  fallbackDate.value = null;
  popupOpen.value = false;
  emit('clear');
}

// Detectar suporte nativo a <input type="date">
onMounted(() => {
  const testInput = document.createElement('input');
  testInput.setAttribute('type', 'date');
  const notSupported = testInput.type === 'text';
  supportsNativeDate.value = !notSupported;

  if (props.modelValue) {
    fallbackDate.value = formatToDisplay(props.modelValue);
  }
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      fallbackDate.value = formatToDisplay(newVal);
    } else {
      fallbackDate.value = null;
    }
  },
);
</script>

<style scoped lang="scss">
/* Estilos adicionais se necessário - herda do ClFormField */
</style>
