<script setup>
import { defineProps, defineSlots } from "vue";

const props = defineProps({
  value: Array, // Data untuk tabel
  columns: Array, // Konfigurasi kolom
  showAction: Boolean, // Apakah ada kolom aksi atau tidak
});

</script>

<template>
  <DataTable :value="value" tableStyle="min-width: 50rem">
    <Column>
        <template #body="{ index }">
            {{ (meta.page - 1) * meta.limit + index + 1 }}
        </template>
    </Column>
    <Column
      v-for="col in columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
    />
    
    <!-- Kolom Aksi (Jika showAction = true) -->
    <Column v-if="showAction" header="Actions">
      <template #body="slotProps">
        <slot name="actions" v-bind="slotProps"></slot>
      </template>
    </Column>
  </DataTable>
</template>