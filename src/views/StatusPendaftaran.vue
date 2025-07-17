<script setup lang="ts">
import type { PendaftaranSiswaDTO } from '@/interfaces/pendaftaranInterface';
import { getAllPendaftaranBySiswaId } from '@/services/pendaftaranService';
import { useAuthStore } from '@/store/authStore';
import { usePendaftaranStore } from '@/store/pendaftaranStore';
import { isUserSiswa } from '@/utils/userType';
import { useToast } from 'primevue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore()
const pendaftaranStore = usePendaftaranStore()
const toast = useToast()
const router = useRouter()
const siswa_id = isUserSiswa(authStore.user) ? authStore.user.siswa_id : 0
const meta = reactive({
    total: 0,
    limit: 5,
    page: 1
})

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const reloadPage = async () => {
    try {
        const response = await getAllPendaftaranBySiswaId(siswa_id)
        console.log(response)
        pendaftarans.value = response
        meta.total = pendaftarans.value.length
        pendaftaranStore.jalur.forEach((j) => {
            jalurMap.set(j.jalur_id, j.jalur_nama)
        })
    } catch (error) {
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

const pendaftarans = ref<PendaftaranSiswaDTO[]>([])
const jalurMap = new Map<number, string>()
onMounted(async() => {
    try {
        const response = await getAllPendaftaranBySiswaId(siswa_id)
        console.log(response)
        pendaftarans.value = response
        meta.total = pendaftarans.value.length
        pendaftaranStore.jalur.forEach((j) => {
            jalurMap.set(j.jalur_id, j.jalur_nama)
        })
    } catch (error) {
        if (error instanceof Error) {
            toast.add({
                severity: 'error',
                summary: 'Gagal',
                detail: error.message,
                life: 3000
            })
        }
    }
})

const setJalur = (jalurId: number): string => {
    const jalur = jalurMap.has(jalurId) ? jalurMap.get(jalurId)! : 'Not Found'
    return jalur
}

const severityClassOfStatus = (data: string) => {
    if(data === 'BELUM_VERIF') {
        return 'danger'
    }else if(data === 'VERIF_SD') {
        return 'warn'
    }else if(data === 'VERIF_SMP') {
        return 'success'
    }else {
        return 'contrast'
    }
}

const valueOfStatus = (data: string) => {
    if(data === 'BELUM_VERIF') {
        return 'Belum Terverifikasi'
    }else if(data === 'VERIF_SD') {
        return 'Terverifikasi Admin SD'
    }else if(data === 'VERIF_SMP') {
        return 'Terverifikasi Admin SMP'
    }else {
        return 'Tidak Terdefinisi'
    }
}

const severityClassOfStatusKelulusan = (data: string) => {
    if(data === 'PENDAFTARAN') {
        return 'info'
    }else if(data === 'LULUS') {
        return 'success'
    }else if(data === 'TIDAK_LULUS') {
        return 'danger'
    }else {
        return 'contrast'
    }
}

const valueOfStatusKelulusan = (data: string) => {
    if(data === 'PENDAFTARAN') {
        return 'Belum Lulus'
    }else if(data === 'LULUS') {
        return 'Lulus'
    }else if(data === 'TIDAK_LULUS') {
        return 'Tidak Lulus'
    }else {
        return 'contrast'
    }
}

const setTime = (data: string): string => {
    const newDate = new Date(data)
    console.log(newDate)
    const date = newDate.getDate()
    const month = newDate.getMonth() + 1
    const year = newDate.getFullYear()
    const hours = newDate.getHours()
    const minute = newDate.getMinutes()

    return `${date}-${month}-${year} ${hours}:${minute}`
}


</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card flex flex-col gap-6">
                <Button label="Kembali" severity="danger" @click="goBack" icon="pi pi-fw pi-arrow-left" class=" w-[10%] leading-5"></Button>
                <div class="font-bold text-xl">Status Pendaftaran</div>
                <DataTable :value="pendaftarans" paginator :first="(meta.page - 1) * meta.limit" 
                :totalRecords="meta.total" :rows="meta.limit" :lazy="true" :rowsPerPageOptions="[5, 10, 15, 20]" 
                filterDisplay="row"   tableStyle="min-width: 50rem">
                    <template #header>
                        <div class="flex justify-between items-end">
                            <div class="text-lg font-bold">Data Riwayat Pendaftaran Siswa</div>
                            <Button label="Perbaharui Data" icon="pi pi-refresh" severity="warn" @click="reloadPage"></Button>
                        </div>
                    </template>
                    <template #empty> No data found. </template>
                    <template #loading> Loading data. Please wait. </template>
                        <Column header="No" style="width: 8%">
                            <template #body="{ index }">
                                {{ (meta.page - 1) * meta.limit + index + 1 }}
                            </template>
                        </Column>
                        <Column field="nisn" header="NISN" style="width: 10%"></Column>
                        <Column field="nama" header="Nama" style="width: 15%"></Column>
                        <Column header="Jalur" style="width: 10%">
                            <template #body="{ data }">
                                {{ setJalur(data.jalur_id) }}
                            </template>
                        </Column>
                        <Column field="status" header="Status Pendaftaran" style="width: 20%">
                            <template #body="{ data }">
                                <Tag class="w-[75%]" :value="valueOfStatus(data.status)" 
                                :severity="severityClassOfStatus(data.status)" />
                            </template>
                        </Column>
                        <Column field="status_kelulusan" header="Status Kelulusan" style="width: 15%">
                            <template #body="{ data }">
                                <Tag class="w-[65%]" :value="valueOfStatusKelulusan(data.status_kelulusan)" 
                                :severity="severityClassOfStatusKelulusan(data.status_kelulusan)" />
                            </template>
                        </Column>
                        <Column field="create_at" header="Waktu Daftar" style="width: 15%">
                            <template #body="{ data }">
                                {{ setTime(data.create_at) }}
                            </template>
                        </Column>
                        <!-- <Column style="width: 25%">
                            <template #body="{ data }">
                                <div class="flex gap-4">
                                    <Button label="Edit Biodata Siswa" icon="pi pi-pencil" as="router-link" severity="info" :to="{name: 'Biodata-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                                </div>
                            </template>
                        </Column> -->
                </DataTable>
            </div>
        </div>
    </div>
</template>