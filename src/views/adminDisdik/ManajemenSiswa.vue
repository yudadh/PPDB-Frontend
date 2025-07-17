<script setup lang="ts">
import type { FailedRows, SiswaDisplayData } from '@/interfaces/siswaInterface'
import { createSiswaWithExcel, deleteSiswaById, getAllSiswaBySekolahId, getTemplateCreateSiswa } from '@/services/siswaService'
import { useConfirm, useToast, type DataTableFilterEvent, type DataTablePageEvent, type FileUploadUploaderEvent } from 'primevue'
import { onMounted, ref } from 'vue'
import { FilterMatchMode } from '@primevue/core/api';
import { debounce } from 'lodash'
import { useRouter } from 'vue-router'
import type { GetAllSekolahResponse } from '@/interfaces/sekolahInterface';
import { useSekolahStore } from '@/store/sekolahDataStore';

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const sekolahStore = useSekolahStore()

const goBack = () => {
   if (window.history.length > 1) {
      router.back();
   } else {
      router.push("/"); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
   }
};

const siswaData = ref<SiswaDisplayData[]>([])
const sekolahOptions = ref<GetAllSekolahResponse[]>([])
const sekolah_id = ref<number>(0)
const createDataWithExcelVisibility = ref(false)
const isLoadingOnCreateData = ref(false)

const page = ref<number>(1)
const limit = ref<number>(10)
const total = ref<number>(0)

const successCount = ref<number>(0)
const failCount = ref<number>(0)
const failedRows = ref<FailedRows[]>([])
const responseStatusVisibility = ref(false)

const filters = ref()

const initFilters = () => {
    filters.value = {
        nisn: {value: null, matchMode: FilterMatchMode.CONTAINS},
        nama: {value: null, matchMode: FilterMatchMode.STARTS_WITH}
    }
}

initFilters()

const fetchSiswaData = async () => {
    try {
        const { siswas, meta } = await getAllSiswaBySekolahId(
            sekolah_id.value, 
            page.value, 
            limit.value, 
            JSON.stringify(filters.value)
        )
        siswaData.value = siswas
        page.value = meta.page,
        limit.value = meta.limit
        total.value = meta.total
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message,
                life: 3000
            });
        }
        console.log(error)
    }
}

async function onPageChange(event: DataTablePageEvent) {
    page.value = event.page + 1
    limit.value = event.rows 
    await fetchSiswaData()
}

onMounted(async () => {
    if (!sekolahStore.sekolahSd.length) {
        await sekolahStore.loadSekolahSd()
    }

    sekolahOptions.value = sekolahStore.sekolahSd
    sekolah_id.value = 1
    await fetchSiswaData()
})

// const loading = ref(false)
const onFiltering = debounce( async(event: DataTableFilterEvent)=> {
    filters.value = {
        ...filters.value,
        ...event.filters
    }
    page.value = 1
    await fetchSiswaData()
}, 500)

const onFilterSekolah = async () => {
    await fetchSiswaData()
}

// const onClearFilters = async () => {
//    // console.log(filters.value)
//    // console.log('clear filter')
//    initFilters();
//    await fetchSiswaData()
// };


const onDownloadTemplate = async () => {
    try {
      const response = await getTemplateCreateSiswa()
      const url = window.URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'template-siswa.xlsx')
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

const handleUpload = async (event: FileUploadUploaderEvent) => {
   const files = Array.isArray(event.files) ? event.files : [event.files]
   console.log(files[0])
   try {
     createDataWithExcelVisibility.value = false
     isLoadingOnCreateData.value = true
     const response = await createSiswaWithExcel(files[0])
     isLoadingOnCreateData.value = false
     if (response) {
       toast.add({ 
         severity: 'success', 
         summary: 'Sukses', 
         detail: 'File data siswa berhasil diupload', 
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
     isLoadingOnCreateData.value = false
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

const onDeleteSiswa = (data: SiswaDisplayData) => {
    confirm.require({
        message: `Anda yakin ingin menghapus siswa ${data.nama}?`,
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
                const response = await deleteSiswaById(data.siswa_id)
                if(response) {
                    toast.add({ 
                        severity: 'success', 
                        summary: 'Sukses', 
                        detail: 'Berhasil menghapus siswa', 
                        life: 2000 
                    });
                    siswaData.value = siswaData.value.filter((data) => data.siswa_id !== response.siswa_id)
                }
            } catch (error) {
                if(error instanceof Error) {
                    toast.add({ 
                        severity: 'error', 
                        summary: 'Gagal', 
                        detail: error.message, 
                        life: 2000  
                    });
                }
            }
        },
        reject: () => {
            
        }
    });
}

const paginationValue = () => {
   if (total.value < limit.value) {
      return total.value
   } else if (page.value > 1 && (limit.value * page.value) > total.value) {
      return total.value
   } else {
      return (limit.value * page.value)
   }
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
                        class="w-[10%] leading-5">
                    </Button>
                    <div class="text-xl font-semibold">Data Siswa</div>
                    <Toolbar
                       style="
                          border-radius: 0.5rem;
                          padding: 1rem 1rem 1rem 1.5rem;
                          margin: 0;
                       ">
                       <template #start>
                          <div class="flex gap-2">
                             <Select
                                filter
                                v-model="sekolah_id"
                                :options="sekolahOptions"
                                optionLabel="sekolah_nama"
                                optionValue="sekolah_id"
                                placeholder="Pilih Sekolah"
                                @change="onFilterSekolah"></Select>
                          </div>
                       </template>
                       <template #end>
                          <!-- <Button
                             label="Reset Filter"
                             icon="pi pi-filter"
                             severity="secondary"
                             @click="onClearFilters" /> -->
                       </template>
                    </Toolbar>
                    <DataTable :value="siswaData" v-model:filters="filters" paginator :first="(page - 1) * limit" 
                    :totalRecords="total" :rows="limit" :lazy="true" :rowsPerPageOptions="[5, 10, 15, 20]" 
                    filterDisplay="row" :globalFilterFields="['nama']" @filter="onFiltering" tableStyle="min-width: 50rem" @page="onPageChange">
                    <template #empty> No siswa found. </template>
                    <template #loading> Loading siswa data. Please wait. </template>
                    <template #header>
                        <div class="flex justify-between gap-2">
                            <div class="text-xl">Daftar Siswa</div>
                            <div class="basis-1/6">
                                <Button 
                                    class="w-full" 
                                    label="Tambah Siswa" 
                                    severity="success" 
                                    icon="pi pi-user-plus"
                                    @click="createDataWithExcelVisibility = true">
                                </Button>
                            </div>
                        </div>
                    </template>
                        <Column header="No" style="width: 20%">
                            <template #body="{ index }">
                                {{ (page - 1) * limit + index + 1 }}
                            </template>
                        </Column>
                        <Column field="nisn" header="NISN" style="width: 20%" :showFilterMenu="false">
                            <template #body="{ data }">
                                {{ data.nisn }}
                             </template>
                             <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" type="text" @input="filterCallback()" 
                                placeholder="Search by nisn" />
                            </template>
                        </Column>
                        <Column field="nama" header="Nama" style="width: 20%" :showFilterMenu="false">
                            <template #body="{ data }">
                                {{ data.nama }}
                             </template>
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" type="text" @input="filterCallback()" 
                                placeholder="Search by name" />
                            </template>
                        </Column>
                        <Column style="width: 30%">
                            <template #body="{ data }">
                                <div class="flex gap-2 justify-center">
                                    <Button label="Edit Biodata" icon="pi pi-pencil" as="router-link" severity="warn" :to="{name: 'Biodata-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                                    <Button label="" icon="pi pi-trash" severity="danger" @click="onDeleteSiswa(data)"></Button>
                                    <!-- <Button label="Edit Dokumen" icon="pi pi-file-edit" as="router-link" severity="info" :to="{name: 'Dokumen-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button> -->
                                </div>
                            </template>
                        </Column>
                        <template #footer>
                         <div class="flex justify-center">
                            {{ paginationValue() }} of {{ total }} data
                         </div>
                      </template>
                    </DataTable>
                    <Dialog v-model:visible="createDataWithExcelVisibility" modal header="Tambah Siswa" :style="{ width: '35rem' }">
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
                            class="w-[40%] leading-5"/>
                        </div>
                        <!-- Upload Excel-->
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
                    <Dialog v-model:visible="responseStatusVisibility" modal header="Status Upload" :style="{ width: '55rem' }">
                        <div class="flex flex-col gap-4">
                          <div class="flex gap-2 mt-1">
                              <Message severity="success" class="w-[50%]"> {{ successCount }} Data Berhasil </Message>
                              <Message severity="error" class="w-[50%]"> {{ failCount }} Data Gagal </Message>
                          </div>
                          <DataTable v-if="failedRows.length > 0" :value="failedRows" class="p-datatable-sm mt-2" scrollable scrollHeight="400px">
                            <template #header>
                              <div class="text-l font-bold">Baris Gagal</div>
                            </template>
                            <Column header="No" style="width: 10%;">
                              <template #body="{ index }">
                                  {{ index + 1 }}
                              </template>
                            </Column>
                            <Column field="row_number" header="Nomor Baris"></Column>
                            <Column field="siswa_nama" header="Siswa"></Column>
                            <Column field="messages" header="Error">
                                <template #body="{ data }">
                                    <li v-for="(msg, i) in data.messages" :key="i">{{ msg }}</li>
                                </template>
                            </Column>
                          </DataTable>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    </div>
</template>
