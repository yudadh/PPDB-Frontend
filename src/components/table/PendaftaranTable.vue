<script setup lang="ts">
import type { DataTableFilterEvent, DataTablePageEvent } from 'primevue';
import { ref } from 'vue';


const props = defineProps<{
  data: any[],
  filters: any,
  meta: any,
  header: string,
  showToolbar?: boolean,
  showActionButton?: boolean
}>();

const emit = defineEmits(['onFiltering', 'onPageChange']);

function onFiltering (event: DataTableFilterEvent) {
    emit('onFiltering', event)
}

function onPageChange (event: DataTablePageEvent) {
    emit('onPageChange', event)
}

const filters_ = ref(props.filters)
console.log(filters_.value)

</script>

<!-- DataTableSiswa.vue -->
<template>
    <div>
      <div v-if="showToolbar" class="mb-4 mt-4">
        <Toolbar style="border-radius: 0.5rem; padding: 1rem;">
          <template #start>
            <slot name="toolbar-start"></slot>
          </template>
          <template #end>
            <slot name="toolbar-end"></slot>
          </template>
        </Toolbar>
      </div>
  
      <DataTable 
        :value="data"
        v-model:filters="filters_"
        paginator
        :first="(meta.page - 1) * meta.limit"
        :totalRecords="meta.total"
        :rows="meta.limit"
        :lazy="true"
        :rowsPerPageOptions="[5, 10, 15, 20]"
        filterDisplay="row"
        :globalFilterFields="['nama']"
        @filter="onFiltering"
        @page="onPageChange"
        tableStyle="min-width: 50rem"
      >
        <template #empty> No siswa found. </template>
        <template #loading> Loading siswa data. Please wait. </template>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xl font-bold">{{ header }}</span>
          </div>
        </template>
  
        <Column header="No" style="width: 8%">
          <template #body="{ index }">
            {{ (meta.page - 1) * meta.limit + index + 1 }}
          </template>
        </Column>
  
        <Column field="nisn" header="NISN" style="width: 15%" :showFilterMenu="false">
          <template #body="{ data }">
            {{ data.nisn }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" style="width: 100%" type="text" @input="filterCallback()" placeholder="Search by nisn" />
          </template>
        </Column>
  
        <Column field="nama" header="Nama" style="width: 15%" :showFilterMenu="false">
          <template #body="{ data }">
            {{ data.nama }}
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" style="width: 100%" type="text" @input="filterCallback()" placeholder="Search by name" />
          </template>
        </Column>
  
        <!-- Status -->
        <slot name="custom-columns"></slot>
  
        <!-- Action -->
        <Column v-if="showActionButton" style="width: 18%">
          <template #body="{ data }">
            <slot name="action-buttons" :data="data"></slot>
          </template>
        </Column>
      </DataTable>
    </div>
  </template>