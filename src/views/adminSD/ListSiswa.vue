<script setup lang="ts">
import type { SiswaDisplayData } from '@/interfaces/siswaInterface'
import { getAllSiswaBySekolahId } from '@/services/siswaService'
import { useAuthStore } from '@/store/authStore'
import { isUserAdminSekolah } from '@/utils/userType'
import { useToast, type DataTableFilterEvent, type DataTablePageEvent } from 'primevue'
import { onMounted, ref } from 'vue'
import { FilterMatchMode } from '@primevue/core/api';
import { debounce } from 'lodash'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
// const users = [
//     {
//         siswa_id: 1,
//         nisn: 2105551056,
//         nama: "Doel Nanda"
//     },
//     {
//         siswa_id: 1,
//         nisn: 2105551057,
//         nama: "Budi Tabuti"
//     }
// ]

const goBack = () => {
   if (window.history.length > 1) {
      router.back();
   } else {
      router.push("/"); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
   }
};

const users = ref<SiswaDisplayData[]>([])
const sekolah_id = isUserAdminSekolah(authStore.user) ? authStore.user.sekolah_id : 0
const sekolah_nama = isUserAdminSekolah(authStore.user) ? authStore.user.sekolah_nama : ""

const page = ref<number>(1)
const limit = ref<number>(10)
const total = ref<number>(0)
async function onPageChange(event: DataTablePageEvent) {
    // console.log('onPageChange jalan')
    page.value = event.page
    limit.value = event.rows
    const filters = JSON.stringify(event.filters)
    // console.log(event.filters) 
    console.log(filters)
    try {
        const { siswas, meta } = await getAllSiswaBySekolahId(sekolah_id, page.value + 1, limit.value, filters)
        users.value = siswas
        page.value = meta.page,
        limit.value = meta.limit
        total.value = meta.total
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message,
                life: 1500
            });
        }
        console.log(error)
    }
}

onMounted(async() => {
    try {
        const { siswas, meta } = await getAllSiswaBySekolahId(sekolah_id, page.value, limit.value)
        users.value = siswas
        page.value = meta.page,
        limit.value = meta.limit
        total.value = meta.total
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message,
                life: 1500
            });
        }
        console.log(error)
    }
})

const filters = ref({
    nisn: {value: null, matchMode: FilterMatchMode.CONTAINS},
    nama: {value: null, matchMode: FilterMatchMode.STARTS_WITH}
})

// const loading = ref(false)
const onFiltering = debounce( async(event: DataTableFilterEvent)=> {
    const filters = JSON.stringify(event.filters)
    console.log(event.filters)
    console.log(filters)
    try {
        const { siswas, meta } = await getAllSiswaBySekolahId(sekolah_id, page.value, limit.value, filters)
        console.log(siswas)
        console.log(meta)
        users.value = siswas
        page.value = meta.page,
        limit.value = meta.limit
        total.value = meta.total
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message,
                life: 1500
            });
        }
        console.log(error)
    }
}, 500)
</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-8">
                    <Button
                        label="Kembali"
                        severity="danger"
                        @click="goBack"
                        icon="pi pi-fw pi-arrow-left"
                        class="w-[10%] leading-5">
                    </Button>
                    <div class="text-xl font-semibold">Daftar Siswa {{ sekolah_nama }}</div>
                    <DataTable :value="users" v-model:filters="filters" paginator :first="(page - 1) * limit" 
                    :totalRecords="total" :rows="limit" :lazy="true" :rowsPerPageOptions="[5, 10, 15, 20]" 
                    filterDisplay="row" :globalFilterFields="['nama']" @filter="onFiltering" tableStyle="min-width: 50rem" @page="onPageChange">
                    <template #empty> No siswa found. </template>
                    <template #loading> Loading siswa data. Please wait. </template>
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
                                <div class="flex gap-2">
                                    <Button label="Edit Biodata" icon="pi pi-pencil" as="router-link" severity="warn" :to="{name: 'Biodata-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                                    <Button label="Edit Dokumen" icon="pi pi-file-edit" as="router-link" severity="info" :to="{name: 'Dokumen-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>
