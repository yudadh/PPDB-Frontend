<script setup lang="ts">
import type { ZonasiDTO } from '@/interfaces/sekolahInterface';
import { createZonasi, deleteZonasiById, getAllZonasi, updateZonasiById } from '@/services/sekolahService';
import { useConfirm, useToast, type DataTableFilterEvent, type DataTablePageEvent } from 'primevue';
import { onMounted, reactive, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from 'lodash';
import { useSekolahStore } from '@/store/sekolahDataStore';
import type { GetBanjar, GetDesa } from '@/interfaces/wilayahInterface';
import { getBanjarByDesaId } from '@/services/wilayahService';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import type { Field, SubmitEventForm } from '@/interfaces/layoutInterface';

const router = useRouter()
const sekolahStore = useSekolahStore()
const confirm = useConfirm()
const goBack = () => {
  if (window.history.length > 1) {
      router.back();
  } else {
      router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
  }
};

const toast = useToast()
const zonasiData = ref<ZonasiDTO[]>([])
const metaData = reactive({
   page: 1,
   limit: 10,
   total: 0
})
const filters = ref()
const sekolahOptions = ref<{
    sekolah_id: number,
    sekolah_nama: string
}[]>([])
const desaOptions = ref<GetDesa[]>([])
const banjarOptions = ref<GetBanjar[]>([])
const currentZonasi = ref<ZonasiDTO>()
const createDialogVisibility = ref(false)
const updateDialogVisbility = ref(false)
const getZonasiData = async (page: number, limit: number, filters: any) => {
   try {
      const response = await getAllZonasi(page, limit, JSON.stringify(filters))
      zonasiData.value = response.data
      metaData.page = response.meta.page
      metaData.limit = response.meta.limit
      metaData.total = response.meta.total
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 3000
         })
      }
   }
}

const initFilters = () => {
   filters.value = {
     npsn: { value: null, matchMode: FilterMatchMode.CONTAINS },
     sekolah_nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
     banjar_nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
     desa_nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
     banjar_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
     desa_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
     sekolah_id: { value: null, matchMode: FilterMatchMode.CONTAINS }
   }
}

initFilters()

onMounted( async() => {
   if (!sekolahStore.sekolahSmp.length) {
      await sekolahStore.loadSekolahSmp()
   }
   sekolahOptions.value = sekolahStore.sekolahSmp
   if (!sekolahStore.listDesa.length) {
      await sekolahStore.loadDesa()
   }
   // console.log(sekolahStore.listDesa)
   desaOptions.value = sekolahStore.listDesa
   await getZonasiData(metaData.page, metaData.limit, filters.value)
})

const onPageChange = async (event: DataTablePageEvent) => {
   metaData.page = event.page
   metaData.limit = event.rows
   console.log(`rows ${event.rows}`)
   await getZonasiData(metaData.page + 1, metaData.limit, filters.value)
}

const onFilters = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters,
   };
   metaData.page = 1
   await getZonasiData(metaData.page, metaData.limit, filters.value)
}, 500);

const onStatusChange = debounce(async () => {
   await getZonasiData(metaData.page, metaData.limit, filters.value)
}, 500)

const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await getZonasiData(
      metaData.page,
      metaData.limit,
      filters.value
   );
};

const paginationValue = () => {
   if (metaData.total < metaData.limit) {
      return metaData.total
   } else if (metaData.page > 1 && (metaData.limit * metaData.page) > metaData.total) {
      return metaData.total
   } else {
      return (metaData.limit * metaData.page)
   }
}

const createFormInitialValue = reactive({
   sekolah_id: 0,
   desa_id: 0,
   banjar_id: 0
})

const createFormResolver = zodResolver(
   z.object({
      sekolah_id: z.number().int().positive("pilih sekolah"),
      desa_id: z.number().int().positive("pilih desa"),
      banjar_id: z.number().int().positive("pilih banjar"),
   })
)

const createFormFields = ref<Field[]>([])

watchEffect(() => {
    createFormFields.value = [
        { 
            name: 'sekolah_id', label: 'Sekolah', type: 'select', 
            attrs: { options: sekolahOptions.value, optionValue: 'sekolah_id', optionLabel: 'sekolah_nama', filter: true, placeholder: 'Pilih Sekolah' } 
        },
        { 
            name: 'desa_id', label: 'Desa', type: 'select', 
            attrs: { options: desaOptions.value, optionValue: 'desa_id', optionLabel: 'desa_nama', filter: true, placeholder: 'Pilih Desa' } 
        },
        { 
            name: 'banjar_id', label: 'Banjar', type: 'select', 
            attrs: { options: banjarOptions.value, optionValue: 'banjar_id', optionLabel: 'banjar_nama', filter: true, placeholder: 'Pilih Banjar' } 
        },
        
    ]
})

const onCreateZonasi = async (form: SubmitEventForm) => {
   try {
      if (!form.valid) return
      const response = await createZonasi(form.values.sekolah_id, form.values.banjar_id)
      if (response) {
         toast.add({
            severity: 'success',
            summary: 'Berhasil',
            detail: "Data zonasi berhasil dibuat",
            life: 3000
         })
         zonasiData.value.push(response)
         createDialogVisibility.value = false
      }
   } catch (error) {
      createDialogVisibility.value = false
      if (error instanceof Error) {
         toast.add({
            severity: 'error',
            summary: 'Gagal',
            detail: error.message,
            life: 3000
         })
      }
   }
}

const updateFormInitialValue = reactive({
   sekolah_id: 0,
   desa_id: 0,
   banjar_id: 0
})

const updateFormResolver = zodResolver(
   z.object({
      sekolah_id: z.number().int().positive("field tidak boleh kosong"),
      desa_id: z.number().int().positive("field tidak boleh kosong"),
      banjar_id: z.number().int().positive("field tidak boleh kosong"),
   })
)

const updateFormFields = ref<Field[]>([])
// watch(() => updateDialogVisbility.value, async (newValues) => {
//    if (newValues === true) {
//       if (!sekolahStore.listDesa.length) {
//          sekolahStore.loadDesa()
//       }
//       desaOptions.value = sekolahStore.listDesa
//    }
// })

const onDesaChange = async (newId: string) => {
   try {
      console.log(Number(newId))
      const response = await getBanjarByDesaId(Number(newId))
      console.log(response)
      banjarOptions.value = response
   } catch (error) {
      console.log(error)
   }
}

watchEffect(() => {
    updateFormFields.value = [
        { 
            name: 'sekolah_id', label: 'Sekolah', type: 'select', 
            attrs: { options: sekolahOptions.value, optionValue: 'sekolah_id', optionLabel: 'sekolah_nama', filter: true, placeholder: 'Pilih Sekolah' } 
        },
        { 
            name: 'desa_id', label: 'Desa', type: 'select', 
            attrs: { options: desaOptions.value, optionValue: 'desa_id', optionLabel: 'desa_nama', filter: true, placeholder: 'Pilih Desa' } 
        },
        { 
            name: 'banjar_id', label: 'Banjar', type: 'select', 
            attrs: { options: banjarOptions.value, optionValue: 'banjar_id', optionLabel: 'banjar_nama', filter: true, placeholder: 'Pilih Banjar' } 
        },
        
    ]
})

const onOpenUpdateDialog = (data: ZonasiDTO) => {
   currentZonasi.value = data
   updateFormInitialValue.sekolah_id = data.sekolah_id
   updateFormInitialValue.desa_id = data.desa_id
   updateFormInitialValue.banjar_id = data.banjar_id
   updateDialogVisbility.value = true
}

const onUpdateZonasi = async (form: SubmitEventForm) => {
   try {
      if (!form.valid) return
      if (!currentZonasi.value) return
      const response = await updateZonasiById(
         currentZonasi.value.zonasi_id, 
         form.values.sekolah_id,
         form.values.banjar_id
      )
      if (response) {
         toast.add({
            severity: 'success',
            summary: 'Berhasil',
            detail: "Data zonasi berhasil diupdate",
            life: 3000
         })
         const updatedData = zonasiData.value.findIndex((zonasi) => zonasi.zonasi_id === response.zonasi_id)
         if (updatedData !== -1) {
            zonasiData.value[updatedData] = response
         }
         updateDialogVisbility.value = false
      }
   } catch (error) {
      updateDialogVisbility.value = false
      if (error instanceof Error) {
         toast.add({
            severity: 'error',
            summary: 'Gagal',
            detail: error.message,
            life: 3000
         })
      }
   }
}

const onDeleteZonasi = (data: ZonasiDTO) => {
   confirm.require({
      message: `Yakin akan menghapus zonasi ${data.sekolah_nama} - ${data.banjar_nama}?`,
      header: "Konfirmasi",
      icon: "pi pi-exclamation-triangle",
      rejectProps: {
         label: "Batal",
         severity: "secondary",
         outlined: true,
      },
      acceptProps: {
         label: "Hapus",
         severity: "danger"
      },
      accept: async () => {
         const response = await deleteZonasiById(data.zonasi_id)
         if (response) {
            toast.add({ 
               severity: 'success', 
               summary: 'Berhasil', 
               detail: 'Data zonasi berhasil dihapus', 
               life: 3000 
            });
            zonasiData.value = zonasiData.value.filter((zonasi) => zonasi.zonasi_id !== response.zonasi_id)
         }
      },
      reject: () => {
         // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
      },
   });
}

const afterCloseUpdateDialog = () => {
   updateDialogVisbility.value = false
   console.log(currentZonasi.value)
   if (!currentZonasi.value) return
   updateFormInitialValue.sekolah_id = currentZonasi.value.sekolah_id
   updateFormInitialValue.desa_id = currentZonasi.value.desa_id
   updateFormInitialValue.banjar_id = currentZonasi.value.banjar_id
}


</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-6">
                    <Button 
                        label="Kembali" 
                        severity="danger" 
                        @click="goBack" 
                        icon="pi pi-fw pi-arrow-left" 
                        class="w-[10%] leading-5" 
                        :fluid="false">
                    </Button>
                    <div class="text-2xl font-bold">Manajemen Zonasi</div>
                    <Toolbar style="border-radius: 0.5rem; padding: 1rem;">
                      <template #start>
                        <div class="flex gap-2">
                           <Select
                              v-model="filters.sekolah_id.value"
                              @change="onStatusChange"
                              :options="sekolahOptions"
                              filter
                              show-clear
                              optionLabel="sekolah_nama"
                              optionValue="sekolah_id"
                              placeholder="Filter Sekolah" />
                           <Select
                              v-model="filters.desa_id.value"
                              @change="onStatusChange"
                              :options="desaOptions"
                              filter
                              show-clear
                              optionLabel="desa_nama"
                              optionValue="desa_id"
                              placeholder="Filter Desa" />
                        </div>
                      </template>
                      <template #end>
                        <Button
                           label="Reset Filter"
                           icon="pi pi-filter"
                           severity="secondary"
                           @click="onClearFilters" />
                      </template>
                    </Toolbar>
                    <DataTable
                      :value="zonasiData"
                      v-model:filters="filters"
                      paginator
                      :first="(metaData.page - 1) * metaData.limit"
                      :totalRecords="metaData.total"
                      :rows="metaData.limit"
                      :lazy="true"
                      :rowsPerPageOptions="[5, 10, 20]"
                      tableStyle="min-width: 50rem"
                      filterDisplay="row"
                      @filter="onFilters"
                      @page="onPageChange">
                      <template #header>
                         <div class="flex justify-between gap-2">
                            <div class="text-lg font-bold">Daftar Zonasi Sekolah</div>
                            <Button label="Tambah Zonasi" severity="success" icon="pi pi-plus" class="w-[15%]" @click="createDialogVisibility = true"></Button>
                         </div>
                      </template>
                      <Column header="No" style="width: 10%">
                         <template #body="{ index }">
                            {{ (metaData.page - 1) * metaData.limit + index + 1 }}
                         </template>
                      </Column>
                      <Column 
                         field="npsn" 
                         header="NPSN" 
                         style="width: 20%"
                         :showFilterMenu="false">
                         <template #filter="{ filterModel, filterCallback }">
                            <InputText
                               v-model="filterModel.value"
                               class="leading-4 w-[70%]"
                               placeholder="Cari NPSN"
                               @input="filterCallback()">
                            </InputText>
                         </template>
                      </Column>
                      <Column
                         field="sekolah_nama"
                         header="Sekolah"
                         style="width: 20%"
                         :showFilterMenu="false">
                         <!-- <template #filter="{ filterModel, filterCallback }">
                            <InputText
                               v-model="filterModel.value"
                               class="leading-4 w-[70%]"
                               placeholder="Cari Sekolah"
                               @input="filterCallback()">
                            </InputText>
                         </template> -->
                      </Column>
                      <Column
                         field="desa_nama"
                         header="Desa"
                         style="width: 20%"
                         :showFilterMenu="false">
                         <!-- <template #filter="{ filterModel, filterCallback }">
                            <InputText
                               v-model="filterModel.value"
                               class="leading-4 w-[70%]"
                               placeholder="Cari Desa"
                               @input="filterCallback()">
                            </InputText>
                         </template> -->
                      </Column>
                      <Column
                         field="banjar_nama"
                         header="Banjar"
                         style="width: 20%"
                         :showFilterMenu="false">
                         <template #filter="{ filterModel, filterCallback }">
                            <InputText
                               v-model="filterModel.value"
                               class="leading-4 w-[70%]"
                               placeholder="Cari Banjar"
                               @input="filterCallback()">
                            </InputText>
                         </template>
                      </Column>
                      <Column style="width: 20%">
                         <template #body="{ data }">
                            <div class="flex gap-2">
                               <Button severity="info" icon="pi pi-pencil" @click="onOpenUpdateDialog(data)"></Button>
                               <Button severity="danger" icon="pi pi-trash" @click="onDeleteZonasi(data)"></Button>
                            </div>
                         </template>
                      </Column>
                      <template #footer>
                         <div class="flex justify-center">
                            {{ paginationValue() }} of {{ metaData.total }} data
                         </div>
                      </template>
                    </DataTable>
                    <FormDialog :visible="updateDialogVisbility" title="Edit Zonasi" @after-hide="afterCloseUpdateDialog"
                    :initialValues="updateFormInitialValue" :formResolver="updateFormResolver" :fields="updateFormFields"
                    @submit="onUpdateZonasi" @desa-change="onDesaChange" @close="updateDialogVisbility = false"></FormDialog>
                    <FormDialog :visible="createDialogVisibility" title="Tambah Zonasi" @after-hide="createDialogVisibility = false"
                    :initialValues="createFormInitialValue" :formResolver="createFormResolver" :fields="createFormFields"
                    @submit="onCreateZonasi" @desa-change="onDesaChange" @close="createDialogVisibility = false"></FormDialog>
                </div>
            </div>
        </div>
    </div>
</template>

