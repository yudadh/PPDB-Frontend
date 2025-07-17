<script setup lang="ts">
import type { Field } from '@/interfaces/layoutInterface';
import { DatePicker, InputText, Select } from 'primevue';
import { defineProps, defineEmits, reactive, watch, ref } from 'vue';

interface Props {
  visible: boolean;
  title?: string;
  initialValues: Record<string, any>;
  formResolver: (values: Record<string, any>) => any;
  fields: Field[];
  buttonLabel?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'submit', 'close', 'afterHide', 'desa-change']);
const formData = reactive<Record<string, any>>({ ...props.initialValues });
const dialogVisibility = ref(props.visible)

watch(() => props.initialValues, (newValues) => {
    Object.assign(formData, newValues);
}, { deep: true });

watch(() => props.visible, (newValues) => {
  dialogVisibility.value = newValues
})

watch(() => formData.desa_id, (newValues) => {
  emit('desa-change', newValues)
})

watch(() => props.visible, (newVisible) => {
  if (!newVisible) return;
  // Saat dialog terbuka, reset formData
  Object.assign(formData, props.initialValues);
});

const getComponent = (type: 'select' | 'date' | 'text') => {
    const components = {
        select: Select,
        date: DatePicker,
        text: InputText
    };
    return components[type] || 'Select';
};

const onSubmit = (values: Record<string, any>) => {
    emit('submit', values);
};

const onAfterHide = () => {
  emit('afterHide')
}
</script>
  
<template>
  <Dialog v-model:visible="dialogVisibility" modal :header="title" :style="{ width: '25rem' }" @after-hide="onAfterHide">
    <Form v-slot="$form" :resolver="formResolver" :initialValues="initialValues" @submit="onSubmit" class="flex flex-col gap-4">
      <div class="flex flex-col">
        <template v-for="field in fields" :key="field.name">
          <div class="flex flex-col gap-2 mb-4" v-if="!field.showIf || field.showIf(formData)">
            <label :for="field.name" class="font-semibold w-auto">{{ field.label }}<span v-if="field.is_required ?? false" class="text-red-600">*</span></label>
            <component
              :is="getComponent(field.type)"
              v-model="formData[field.name]"
              :id="field.name"
              :name="field.name"
              v-bind="field.attrs"
            />
            <Message v-if="$form[field.name]?.invalid" severity="error" size="small" variant="simple">{{ $form[field.name].error.message }}</Message>
          </div>
        </template>
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Batal" severity="secondary" @click="$emit('close')"></Button>
        <Button type="submit" :label="buttonLabel ?? 'Simpan'"></Button>
      </div>
    </Form>
  </Dialog>
</template>