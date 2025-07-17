<script setup lang="ts">
import { useToast, type DataTableFilterEvent, type DataTablePageEvent } from 'primevue';
import { onMounted, reactive, ref, watchEffect} from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from 'lodash';
import { useSekolahStore } from '@/store/sekolahDataStore';
import { getAllPendaftaranZonasi, getLaporanPendaftaran } from '@/services/pengumumanService';
import type { PendaftaranZonasiResponse } from '@/interfaces/pengumumanInterface';
import { getAllPeriode } from '@/services/periodeService';
import type { PeriodeDTO } from '@/interfaces/periodeInterface';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import type { Field, SubmitEventForm } from '@/interfaces/layoutInterface';

const router = useRouter()
const sekolahStore = useSekolahStore()
const goBack = () => {
  if (window.history.length > 1) {
      router.back();
  } else {
      router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
  }
};

const toast = useToast()
const periodeId = ref(0)
const pendaftaranData = ref<PendaftaranZonasiResponse[]>([])
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
const periodeOptions = ref<PeriodeDTO[]>([])
const downloadFormVisibility = ref(false)
const getAllPendaftaranZonasiData = async (page: number, limit: number, filters: any) => {
   try {
      const response = await getAllPendaftaranZonasi(periodeId.value, page, limit, JSON.stringify(filters))
      pendaftaranData.value = response.data
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
     nisn: { value: null, matchMode: FilterMatchMode.CONTAINS },
     sekolah_nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
     banjar_nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
     desa_nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
     banjar_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
     sekolah_id: { value: null, matchMode: FilterMatchMode.CONTAINS }
   }
}

initFilters()

onMounted( async() => {
   if (!sekolahStore.sekolahSmp.length) {
      await sekolahStore.loadSekolahSmp()
   }
   sekolahOptions.value = sekolahStore.sekolahSmp
   const periode = await getAllPeriode(1, 100)
   periodeOptions.value = periode.data
   periodeId.value = 1
   // console.log(sekolahStore.listDesa)
   await getAllPendaftaranZonasiData(metaData.page, metaData.limit, filters.value)
})

const onPageChange = async (event: DataTablePageEvent) => {
   metaData.page = event.page
   metaData.limit = event.rows
   console.log(`rows ${event.rows}`)
   await getAllPendaftaranZonasiData(metaData.page + 1, metaData.limit, filters.value)
}

const onFilters = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters,
   };
   metaData.page = 1
   await getAllPendaftaranZonasiData(metaData.page, metaData.limit, filters.value)
}, 500);

const onStatusChange = debounce(async () => {
   await getAllPendaftaranZonasiData(metaData.page, metaData.limit, filters.value)
}, 500)

const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await getAllPendaftaranZonasiData(
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

const statusKelulusanOptions = ref([
   {
      label: "Lulus",
      value: "LULUS"
   },
   {
      label: "Tidak Lulus",
      value: "TIDAK_LULUS"
   }
])

const downloadFormInitialValue = reactive({
   periode_id: 0,
   sekolah_id: 0,
   status_kelulusan: null,
})

const downloadFormResolver = zodResolver(
   z.object({
      periode_id: z.number().int().positive("periode tidak boleh kosong"),
      sekolah_id: z.number().int().nonnegative("field tidak boleh kosong"),
      status_kelulusan: z.enum(["LULUS", "TIDAK_LULUS"]).nullable()
   })
)

const downloadFormFields = ref<Field[]>([])

watchEffect(() => {
    downloadFormFields.value = [
        { 
            name: 'periode_id', 
            label: 'Periode', 
            type: 'select', 
            attrs: { 
               options: periodeOptions.value, 
               optionValue: 'periode_id', 
               optionLabel: 'nama_periode',  
               placeholder: 'Pilih Periode' 
            } 
        },
        { 
            name: 'sekolah_id', 
            label: 'Sekolah', 
            type: 'select', 
            attrs: { 
               options: sekolahOptions.value, 
               optionValue: 'sekolah_id', 
               optionLabel: 'sekolah_nama', 
               filter: true, 
               placeholder: 'Pilih Sekolah' 
            } 
        },
        { 
            name: 'status_kelulusan', 
            label: 'Status Kelulusan', 
            type: 'select', 
            attrs: { 
               options: statusKelulusanOptions.value, 
               optionValue: 'value', 
               optionLabel: 'label', 
               placeholder: 'Pilih Status Kelulusan' 
            } 
        },
        
    ]
})

const onDownloadLaporan = async (form: SubmitEventForm) => {
   try {
      if (!form.valid) return
      const response = await getLaporanPendaftaran(periodeId.value, null, form.values.sekolah_id, form.values.status_kelulusan)
      downloadFormVisibility.value = false
      const url = window.URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'laporan-pendaftaran.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
   } catch (error) {
      downloadFormVisibility.value = false
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
                    <div class="text-2xl font-bold">Pendaftaran Zonasi</div>
                    <Toolbar style="border-radius: 0.5rem; padding: 1rem;">
                      <template #start>
                        <div class="flex gap-2">
                            <Select
                               v-model="periodeId"
                               @change="onStatusChange"
                               :options="periodeOptions"
                               filter
                               optionLabel="nama_periode"
                               optionValue="periode_id"
                               placeholder="Filter Periode" />
                           <Select
                              v-model="filters.sekolah_id.value"
                              @change="onStatusChange"
                              :options="sekolahOptions"
                              filter
                              show-clear
                              optionLabel="sekolah_nama"
                              optionValue="sekolah_id"
                              placeholder="Filter Sekolah Tujuan" />
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
                      :value="pendaftaranData"
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
                            <div class="text-lg font-bold">Daftar Pendaftaran Zonasi</div>
                            <Button label="Download Laporan" severity="warn" icon="pi pi-download" class="w-[15%]" @click="downloadFormVisibility = true"></Button>
                         </div>
                      </template>
                      <Column header="No" style="width: 10%">
                         <template #body="{ index }">
                            {{ (metaData.page - 1) * metaData.limit + index + 1 }}
                         </template>
                      </Column>
                      <Column 
                         field="nisn" 
                         header="NISN" 
                         style="width: 20%"
                         :showFilterMenu="false">
                         <!-- <template #filter="{ filterModel, filterCallback }">
                            <InputText
                               v-model="filterModel.value"
                               class="leading-4 w-[70%]"
                               placeholder="Cari NPSN"
                               @input="filterCallback()">
                            </InputText>
                         </template> -->
                      </Column>
                      <Column
                         field="siswa_nama"
                         header="Nama"
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
                         field="sekolah_nama"
                         header="Sekolah Tujuan"
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
                         field="sekolah_asal_nama"
                         header="Sekolah Asal"
                         style="width: 20%"
                         :showFilterMenu="false">
                         <!-- <template #filter="{ filterModel, filterCallback }">
                            <InputText
                               v-model="filterModel.value"
                               class="leading-4 w-[70%]"
                               placeholder="Cari Banjar"
                               @input="filterCallback()">
                            </InputText>
                         </template> -->
                      </Column>
                      <template #footer>
                         <div class="flex justify-center">
                            {{ paginationValue() }} of {{ metaData.total }} data
                         </div>
                      </template>
                    </DataTable>
                    <FormDialog :visible="downloadFormVisibility" title="Download Laporan" @after-hide="downloadFormVisibility = false"
                    :initialValues="downloadFormInitialValue" :formResolver="downloadFormResolver" :fields="downloadFormFields"
                    @submit="onDownloadLaporan" @close="downloadFormVisibility = false" buttonLabel="Download"></FormDialog>
                </div>
            </div>
        </div>
    </div>
</template>

