<script setup lang="ts">
import { useToast, type DataTableFilterEvent, type DataTablePageEvent } from 'primevue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from 'lodash';
import { useSekolahStore } from '@/store/sekolahDataStore';
import type { GetTotalPendaftaranBySekolah } from '@/interfaces/pengumumanInterface';
import { getKuotaPendaftar } from '@/services/pengumumanService';
import type { JalurDTO } from '@/interfaces/periodeInterface';
import { usePendaftaranStore } from '@/store/pendaftaranStore';

const router = useRouter()
const sekolahStore = useSekolahStore()
const pendaftaranStore = usePendaftaranStore()
const goBack = () => {
  if (window.history.length > 1) {
      router.back();
  } else {
      router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
  }
};

const toast = useToast()
const kuotaPendaftarData = ref<GetTotalPendaftaranBySekolah[]>([])
const metaData = reactive({
   page: 1,
   limit: 10,
   total: 0
})
const periodeId = ref<number>(0)
const periodeJalurId = ref<number>(0)
const jalurId = ref<number>(0)
const filters = ref()
const periodeJalurMap = ref(new Map<number, number>())
const jalurOptions = ref<JalurDTO[]>([])
const sekolahOptions = ref<{
    sekolah_id: number,
    sekolah_nama: string
}[]>([])
// const jalurNama = ref<string>("")

const getKuotaPendaftarData = async (page: number, limit: number, filters: any) => {
   try {
      const response = await getKuotaPendaftar(
        periodeId.value, 
        periodeJalurId.value, 
        page, 
        limit, 
        JSON.stringify(filters)
      )

      kuotaPendaftarData.value = response.data
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
     sekolah_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
     npsn: { value: null, matchMode: FilterMatchMode.CONTAINS }
   }
}

initFilters()

onMounted( async() => {
   if (!sekolahStore.sekolahSmp.length) {
      await sekolahStore.loadSekolahSmp()
   }

   if (!pendaftaranStore.periode_id && !pendaftaranStore.periode_jalurs.length) {
      await pendaftaranStore.loadPeriodeAndPeriodeJalur()
   }

   for (const pj of pendaftaranStore.periode_jalurs) {
      periodeJalurMap.value.set(pj.jalur_id, pj.periode_jalur_id)
   }

   jalurOptions.value = pendaftaranStore.periode_jalurs.map((pj) => {
    return {
        jalur_id: pj.jalur_id,
        jalur_nama: pj.jalur_nama
    }
   })
   const zonasiJalur = jalurOptions.value.find((j) => j.jalur_nama.toLowerCase() === "zonasi")?.jalur_id ?? 0 
   jalurId.value = zonasiJalur
   const periodeJalurId_ = periodeJalurMap.value.get(zonasiJalur) ?? 0
   sekolahOptions.value = sekolahStore.sekolahSmp
   periodeJalurId.value = periodeJalurId_
   periodeId.value = pendaftaranStore.periode_id ?? 0

   await getKuotaPendaftarData(metaData.page, metaData.limit, filters.value)
})

const onPageChange = async (event: DataTablePageEvent) => {
   metaData.page = event.page
   metaData.limit = event.rows
   console.log(`rows ${event.rows}`)
   await getKuotaPendaftarData(metaData.page + 1, metaData.limit, filters.value)
}

const onFilters = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters,
   };
   metaData.page = 1
   await getKuotaPendaftarData(metaData.page, metaData.limit, filters.value)
}, 500);

const onStatusChange = debounce(async () => {
   await getKuotaPendaftarData(metaData.page, metaData.limit, filters.value)
}, 500)

const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await getKuotaPendaftarData(
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
                    <div class="text-2xl font-bold">Kuota Pendaftaran Sekolah</div>
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
                      :value="kuotaPendaftarData"
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
                            <div class="text-lg font-bold">Daftar Kuota Pendaftaran</div>
                            <div class="flex items-center gap-2">
                                <p class="text-base">Pilih Jalur</p>
                                <Select
                                    class="leading-5"
                                    v-model="jalurId"
                                    @change="onStatusChange"
                                    :options="jalurOptions"
                                    optionLabel="jalur_nama"
                                    optionValue="jalur_id"
                                    placeholder="Filter Jalur" />
                            </div>
                         </div>
                      </template>
                      <Column header="No" style="width: 15%">
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
                         style="width: 25%"
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
                         field="kuota"
                         header="Kuota"
                         style="width: 15%;"
                         :showFilterMenu="false"
                         :pt="{
                            columnHeaderContent: {
                                class: ['flex justify-center']
                            }
                         }">
                         <template #body="{ data }">
                            <div class="flex justify-center">
                                {{ data.kuota }}
                            </div>
                         </template>
                      </Column>
                      <Column
                         field="totalPendaftar"
                         header="Jumlah Pendaftar"
                         style="width: 15%"
                         :showFilterMenu="false"
                         :pt="{
                            columnHeaderContent: {
                                class: ['flex justify-center']
                            }
                         }">
                         <template #body="{ data }">
                            <div class="flex justify-center">
                                {{ data.totalPendaftar }}
                            </div>
                         </template>
                      </Column>
                      <template #footer>
                         <div class="flex justify-center">
                            {{ paginationValue() }} of {{ metaData.total }} data
                         </div>
                      </template>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>

