<script setup lang="ts">
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type { FailedRows, GetAllSekolahResponse } from "@/interfaces/sekolahInterface";
import { createSekolahWithExcel, deleteSekolahById, getAllSekolah, getTemplateCreateSekolah } from "@/services/sekolahService";
import { useConfirm, useToast, type DataTableFilterEvent, type DataTablePageEvent, type FileUploadUploaderEvent } from "primevue";
import { onMounted, reactive, ref, watch } from "vue";
import FormProfilSekolah from "@/components/forms/FormProfilSekolah.vue";
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from "lodash";
import { useSekolahStore } from "@/store/sekolahDataStore";
import type { GetDesa } from "@/interfaces/wilayahInterface";
import { useRouter } from "vue-router";

const toast = useToast();
const confirm = useConfirm()
const router = useRouter()
const sekolahStore = useSekolahStore()
const sekolahData = ref<GetAllSekolahResponse[]>([]);
const meta = reactive<PaginationMeta>({
   total: 0,
   limit: 10,
   page: 1,
});
const filters = ref()
const sekolahType = ref<"sd" | "smp">("sd");
const sekolahOptions = ref([
   { type: "SD", value: "sd" },
   { type: "SMP", value: "smp" },
]);
const desaOptions = ref<GetDesa[]>([])
const sekolahFilterOptions = ref<GetAllSekolahResponse[]>([])

const goBack = () => {
  if (window.history.length > 1) {
      router.back();
  } else {
      router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
  }
};

async function fetchSekolahData(page: number, limit: number, filters: any) {
   if (sekolahType.value) {
      try {
         const response = await getAllSekolah(
            sekolahType.value,
            page,
            limit,
            JSON.stringify(filters)
         );
         sekolahData.value = response.data;
         Object.assign(meta, response.meta);
         console.log(meta)
      } catch (error) {
         if (error instanceof Error) {
            toast.add({
               severity: "error",
               summary: "Gagal",
               detail: error.message,
               life: 2000,
            });
         }
      }
   }
}

const initFilters = () => {
   filters.value = {
     npsn: { value: null, matchMode: FilterMatchMode.CONTAINS },
     sekolah_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
     desa_id: { value: null, matchMode: FilterMatchMode.CONTAINS },
   }
}

initFilters()

onMounted(async () => {
   if (!sekolahStore.sekolahSd.length) {
      await sekolahStore.loadSekolahSd()
   }
   sekolahFilterOptions.value = sekolahStore.sekolahSd
   if (!sekolahStore.listDesa.length) {
      await sekolahStore.loadDesa()
   }
   // console.log(sekolahStore.listDesa)
   desaOptions.value = sekolahStore.listDesa
   await fetchSekolahData(meta.page, meta.limit, filters.value);
});

async function onFilterTypeSekolah() {
   await fetchSekolahData(1, meta.limit, filters.value);
}

const onFilters = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters
   }
   meta.page = 1
   await fetchSekolahData(meta.page, meta.limit, filters.value)
}, 500)

const onDesaFilters = debounce(async () => {
   meta.page = 1
   await fetchSekolahData(meta.page, meta.limit, filters.value)
}, 500) 

watch(() => sekolahType.value, async (newValues) => {
   if (newValues === "smp") {
      if (!sekolahStore.sekolahSmp.length) {
         await sekolahStore.loadSekolahSmp()
      }
      sekolahFilterOptions.value = sekolahStore.sekolahSmp
   } else {
      sekolahFilterOptions.value = sekolahStore.sekolahSd
   }
})

async function onPageChange(event: DataTablePageEvent) {
   meta.page = event.page
   meta.limit = event.rows
   await fetchSekolahData(meta.page + 1, meta.limit, filters.value);
}

const createDialogVisibility = ref(false);
const createDataWithExcelVisibility = ref(false)
const isLoadingCreateSekolahWithExcel = ref(false)
const isLoadingDialog = ref(false);
function openCreateDialog() {
   isPopOverVisible.value = false
   op.value.hide()
   createDialogVisibility.value = true;
//    isLoadingDialog.value = true;
}

function openCreateWithExcelDialog() {
   isPopOverVisible.value = false
   op.value.hide()
   createDataWithExcelVisibility.value = true;
}

async function onDeleteSekolah(data: GetAllSekolahResponse) {
    confirm.require({
        message: `Yakin ingin menghapus sekolah ${data.sekolah_nama} ?`,
        header: 'Konfirmasi',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Batal',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Hapus',
            severity: 'danger'
        },
        accept: async () => {
            try {
                const response = await deleteSekolahById(data.sekolah_id)
                if(response) {
                    toast.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'Berhasil Hapus Sekolah',
                        life: 2000
                    })
                    sekolahData.value.filter((sekolah) => sekolah.sekolah_id !== response.sekolah_id)
                }
            } catch (error) {
                if(error instanceof Error) {
                    toast.add({
                        severity: 'error',
                        summary: 'Gagal',
                        detail: error.message,
                        life: 2000
                    })
                }
            }
        },
        reject: () => {
            
        }
    });
}

const onDownloadTemplate = async () => {
   try {
      const response = await getTemplateCreateSekolah()
      const url = window.URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'template-sekolah.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 3000
         })
      }
      console.log(error)
   }
}

const successCount = ref<number>(0)
const failCount = ref<number>(0)
const failedRows = ref<FailedRows[]>([])
const responseStatusVisibility = ref(false)

const handleUpload = async (event: FileUploadUploaderEvent) => {
   const files = Array.isArray(event.files) ? event.files : [event.files]
   console.log(files[0])
   try {
     createDataWithExcelVisibility.value = false
     isLoadingCreateSekolahWithExcel.value = true
     const response = await createSekolahWithExcel(files[0])
     isLoadingCreateSekolahWithExcel.value = false
     if (response) {
       toast.add({ 
         severity: 'success', 
         summary: 'Sukses', 
         detail: 'File kuota sekolah berhasil diupload', 
         life: 3000 
       })
       responseStatusVisibility.value = true
       successCount.value = response.successCount
       failCount.value = response.failCount
       failedRows.value = response.failedRows
       setTimeout(() => {
         router.replace({ path: router.currentRoute.value.fullPath })
       }, 3000)
     }

   } catch (error) {
     console.log(error)
     isLoadingCreateSekolahWithExcel.value = false
     if (error instanceof Error) {
         toast.add({ 
           severity: 'error', 
           summary: 'Gagal', 
           detail: error.message, 
           life: 3000
         })
     } else {
         toast.add({ 
           severity: 'error', 
           summary: 'Gagal', 
           detail: "Terjadi error yang tidak diketahui", 
           life: 3000 
         })
     }
   }
}


const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await fetchSekolahData(
      meta.page,
      meta.limit,
      filters.value
   );
};

function paginationValue() {
   if (meta.total < meta.limit) {
      return meta.total
   } else if (meta.page > 1 && (meta.limit * meta.page) > meta.total) {
      return meta.total
   } else {
      return (meta.limit * meta.page)
   }
}

const op = ref()
const isPopOverVisible = ref(false)
const toggle = (event: Event) => {
   if (isPopOverVisible.value) {
      op.value.hide(event)
      isPopOverVisible.value = false
   } else {
      op.value.show(event)
      isPopOverVisible.value = true
   }
   // op.value.toggle(event)
}
</script>

<template>
   <div class="flex flex-col md:flex-row gap-8">
      <Toast />
      <div class="md:w-full">
         <div class="card">
            <div class="flex flex-col gap-4">
               <Button 
                   label="Kembali" 
                   severity="danger" 
                   @click="goBack" 
                   icon="pi pi-fw pi-arrow-left" 
                   class="w-[10%] leading-5" 
                   :fluid="false">
               </Button>
               <div class="text-xl font-bold">Manajemen Sekolah</div>
               <Toolbar
                  style="
                     border-radius: 0.5rem;
                     padding: 1rem 1rem 1rem 1.5rem;
                     margin: 0;
                  ">
                  <template #start>
                     <div class="flex gap-2">
                        <Select
                           v-model="sekolahType"
                           :options="sekolahOptions"
                           optionLabel="type"
                           optionValue="value"
                           placeholder="Pilih Jenjang"
                           @change="onFilterTypeSekolah"></Select>
                        <Select
                           :options="desaOptions"
                           filter
                           optionValue="desa_id"
                           optionLabel="desa_nama"
                           v-model="filters.desa_id.value"
                           @change="onDesaFilters"
                           placeholder="Filter Desa"></Select>
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
                  :value="sekolahData"
                  paginator
                  :first="(meta.page - 1) * meta.limit"
                  :totalRecords="meta.total"
                  :rows="meta.limit"
                  :lazy="true"
                  :rowsPerPageOptions="[5, 10, 20]"
                  tableStyle="min-width: 50rem"
                  filterDisplay="row"
                  :filters="filters"
                  @filter="onFilters"
                  @page="onPageChange">
                  <template #header>
                     <div class="flex justify-between gap-2">
                        <div class="text-xl">Daftar Sekolah</div>
                        <Button
                        severity="success"
                        label="Tambah Sekolah"
                        :icon="isPopOverVisible ? 'pi pi-angle-down' : 'pi pi-plus'"
                        @click="toggle"></Button>
                     </div>
                  </template>
                  <Column header="No" style="width: 25%">
                     <template #body="{ index }">
                        {{ (meta.page - 1) * meta.limit + index + 1 }}
                     </template>
                  </Column>
                  <Column field="npsn" header="NPSN" style="width: 25%">
                     <template #filter="{ filterModel, filterCallback }">
                        <InputText
                           class="leading-4 w-[70%]"
                           v-model="filterModel.value"
                           @change="filterCallback()"
                           placeholder="Cari NPSN"></InputText>
                     </template>
                  </Column>
                  <Column
                     field="sekolah_id"
                     header="Sekolah"
                     style="width: 25%">
                     <template #body="{ data }">
                        {{ data.sekolah_nama }}
                     </template>
                     <template #filter="{ filterModel, filterCallback }">
                        <Select
                           class="leading-5 w-[70%]"
                           :options="sekolahFilterOptions"
                           filter
                           optionValue="sekolah_id"
                           optionLabel="sekolah_nama"
                           v-model="filterModel.value"
                           @change="filterCallback()"
                           placeholder="Cari Sekolah"></Select>
                     </template>
                  </Column>
                  <Column style="width: 25%">
                     <template #body="{ data }">
                        <div class="flex gap-2 justify-center">
                           <Button severity="info" icon="pi pi-pencil" as="router-link" :to="{name: 'ProfilSekolah-AdminDisdik', params: {id: data.sekolah_id}}"></Button>
                           <Button
                              severity="danger"
                              icon="pi pi-trash"
                              @click="onDeleteSekolah(data)"></Button>
                            <!-- <Button severity="warn" class="grow" icon="pi pi-cog" label="Atur Kuota"></Button> -->
                        </div>
                     </template>
                  </Column>
                  <template #footer>
                     <div class="flex justify-center">
                        {{ paginationValue() }} of {{ meta.total }} data
                     </div>
                  </template>
               </DataTable>
               <Dialog
                  v-model:visible="createDialogVisibility"
                  modal
                  header="Tambah Sekolah"
                  :style="{ width: '50rem' }">
                  <div class="flex flex-col gap-4" v-if="!isLoadingDialog">
                     <FormProfilSekolah
                        :sekolah-data="[]"
                        :isDialog="true"
                        v-if="createDialogVisibility"
                        @close="createDialogVisibility = false"></FormProfilSekolah>
                  </div>
                  <ProgressSpinner
                     style="width: 50px; height: 50px"
                     strokeWidth="6"
                     fill="transparent"
                     animationDuration="1s"
                     aria-label="Custom ProgressSpinner"
                     v-else />
               </Dialog>
               <Dialog v-model:visible="createDataWithExcelVisibility" modal header="Tambah Sekolah" :style="{ width: '35rem' }">
                  <div class="flex flex-col gap-4">
                    <div class="mt-1">
                        <Message severity="warn" variant="outlined" icon="pi pi-exclamation-triangle">
                            Pastikan fitur ini digunakan hanya untuk import data awal!
                        </Message>
                    </div>
                    <div class="flex justify-end">
                      <Button
                        severity="warn" 
                        label="Download Template" 
                        icon="pi pi-download" 
                        @click="onDownloadTemplate"
                        class="w-[45%] leading-5"/>
                    </div>
                    <!-- Upload CSV -->
                    <FileUpload
                      name="file"
                      accept=".xlsx"
                      customUpload
                      @uploader="handleUpload"
                      chooseLabel="Pilih File"
                      mode="advanced"
                      :maxFileSize="5000000">
                        <template #empty>
                          <span>Drag and drop files to here to upload.</span>
                        </template>
                    </FileUpload>
                  </div>
               </Dialog>
               <Popover ref="op">
                  <div class="flex flex-col gap-2">
                     <Button
                        severity="success"
                        label="Data Tunggal"
                        icon="pi pi-plus-circle"
                        @click="openCreateDialog"></Button>
                     <Button
                        severity="success"
                        label="Data Excel"
                        icon="pi pi-file-plus"
                        @click="openCreateWithExcelDialog"></Button>
                  </div>
               </Popover>
               <Dialog
                  v-model:visible="isLoadingCreateSekolahWithExcel"
                  modal
                  header="Proses Tambah Sekolah Sedang Berlangsung"
                  :style="{ width: '25rem' }">
                  <ProgressBar
                     mode="indeterminate"
                     style="height: 6px"></ProgressBar>
               </Dialog>
               <Dialog v-model:visible="responseStatusVisibility" modal header="Status Upload" :style="{ width: '50rem' }">
                <div class="flex flex-col gap-4">
                  <div class="flex gap-2 mt-1">
                     <Message severity="success" class="w-[50%]"> {{ successCount }} Data Berhasil </Message>
                     <Message severity="error" class="w-[50%]"> {{ failCount }} Data Gagal </Message>
                  </div>
                  <DataTable v-if="failedRows.length > 0" :value="failedRows" class="p-datatable-sm mt-2" scrollable scrollHeight="400px">
                    <template #header>
                      <div class="text-l font-bold">Baris Gagal</div>
                    </template>
                    <Column header="No">
                      <template #body="{ index }">
                          {{ index + 1 }}
                      </template>
                    </Column>
                    <Column field="row_number" header="Nomor Baris"></Column>
                    <Column field="sekolah_nama" header="Sekolah"></Column>
                    <Column field="message" header="Error"></Column>
                    <!-- <Column field="Periode" header="Periode"></Column> -->
                  </DataTable>
                </div>
            </Dialog>
            </div>
         </div>
      </div>
   </div>
</template>
