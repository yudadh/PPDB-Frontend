<script setup lang="ts">
import type { JadwalDTO, PeriodeJalurDTO } from '@/interfaces/periodeInterface';
import { getLaporanDashboardSd } from '@/services/pengumumanService';
import { getJadwalByPeriodeJalurId } from '@/services/periodeService';
import { useAuthStore } from '@/store/authStore';
import { usePendaftaranStore } from '@/store/pendaftaranStore';
import { findPeriodeJalurBerlangsung } from '@/utils/findPeriodeJalur';
import { isUserAdminSekolah } from '@/utils/userType';
import { useToast } from 'primevue';
import { onMounted, ref } from 'vue';

const toast = useToast()
const pendaftaranStore = usePendaftaranStore()
const authStore = useAuthStore()
const sekolah_id = isUserAdminSekolah(authStore.user) ? authStore.user.sekolah_id : 0
const sekolah_nama = isUserAdminSekolah(authStore.user) ? authStore.user.sekolah_nama : ""
const periodeId = ref<number>(0)
const periodeNama = ref<string>("")
const periodeJalur = ref<PeriodeJalurDTO | null>(null)
const jadwals = ref<JadwalDTO[]>([])

// dashboard data
const totalSiswa = ref<number>(0)
const totalUserSiswa = ref<number>(0)
const totalSiswaTerdaftar = ref<number>(0)
const totalSiswaLulus = ref<number>(0)
const totalSiswaTerverifikasi = ref<number>(0)
const totalSiswaBelumTerverifikasi = ref<number>(0)
const totalSiswaBiodataBelumLengkap = ref<number>(0)
const totalSiswaDokumenBelumLengkap = ref<number>(0)

onMounted( async() => {
    try {
        // const response = await getAllJalur()
        // pendaftaranStore.jalur = response

        if (!pendaftaranStore.periode_id) {
           await pendaftaranStore.loadPeriodeAndPeriodeJalur()
        }

        const periodeJalurBerlangsung = findPeriodeJalurBerlangsung(pendaftaranStore.periode_jalurs)

        if (periodeJalurBerlangsung.periodeJalur) {
            const jadwals_ = await getJadwalByPeriodeJalurId(periodeJalurBerlangsung.periodeJalur.periode_jalur_id)
            jadwals.value = jadwals_
        }

        periodeId.value = pendaftaranStore.periode_id ? pendaftaranStore.periode_id : 0
        periodeNama.value = pendaftaranStore.periode_nama ? pendaftaranStore.periode_nama : ""
        periodeJalur.value = periodeJalurBerlangsung.periodeJalur
        if (periodeJalur.value) {
            const dashboardData = await getLaporanDashboardSd(sekolah_id, periodeJalur.value.periode_jalur_id)
            console.log(dashboardData)
            totalSiswa.value = dashboardData.total_siswa
            totalUserSiswa.value = dashboardData.total_user
            totalSiswaTerdaftar.value = dashboardData.total_terdaftar
            totalSiswaLulus.value = dashboardData.total_lulus
            totalSiswaTerverifikasi.value = dashboardData.total_terverifikasi
            totalSiswaBelumTerverifikasi.value = dashboardData.total_belum_terverifikasi
            totalSiswaBiodataBelumLengkap.value = dashboardData.total_biodata_belum_lengkap
            totalSiswaDokumenBelumLengkap.value = dashboardData.total_dokumen_belum_lengkap
        }
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
    console.log(pendaftaranStore.periode_id)
    console.log(pendaftaranStore.periode_jalur_id)
})

function showPeriodeBerlangsung() {
    if (periodeId.value && periodeJalur.value) {
        return `Periode ${periodeNama.value} Jalur ${periodeJalur.value.jalur_nama} sedang berlangsung!`
    } else {
        return 'Tidak ada periode yang sedang berlangsung'
    }
}

const setTime = (data: string): string => {
    const newDate = new Date(data)
    // console.log(newDate)
    const date = newDate.getDate().toString().padStart(2, "0")
    const month = (newDate.getMonth() + 1).toString().padStart(2, "0")
    const year = newDate.getFullYear()
    const hours = newDate.getHours().toString().padStart(2, "0")
    const minute = newDate.getMinutes().toString().padStart(2, "0")
    
    return `${date}-${month}-${year} ${hours}:${minute}`
}

const setIcon = (waktuMulai: string, waktuSelesai: string) => {
    const now = new Date()
    const waktu_mulai = new Date(waktuMulai)
    const waktu_selesai = new Date(waktuSelesai)

    if (waktu_mulai <= now && waktu_selesai >= now) return 'pi pi-check'

    return 'pi pi-times'
}

const setSeverity = (waktuMulai: string, waktuSelesai: string) => {
    const now = new Date()
    const waktu_mulai = new Date(waktuMulai)
    const waktu_selesai = new Date(waktuSelesai)

    if (waktu_mulai <= now && waktu_selesai >= now) return 'success'

    return 'danger'
}

</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <div class="text-xl font-semibold">Selamat Datang Admin {{ sekolah_nama }}</div>
                    <div>
                        <Message :severity="periodeId ? 'success' : 'warn'" size="large">{{ showPeriodeBerlangsung() }}</Message>
                    </div>
                    <div class="flex flex-wrap gap-4">
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa</span>
                                        <span class="font-bold text-xl">{{ totalSiswa }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#c084fc', color: '#ffffff'}">
                                        <i class="pi pi-user" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total User Siswa</span>
                                        <span class="font-bold text-xl">{{ totalUserSiswa }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#fbbf24', color: '#ffffff'}">
                                        <i class="pi pi-user" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4 w-[75%]">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Biodata Belum Lengkap</span>
                                        <span class="font-bold text-xl">{{ totalSiswaBiodataBelumLengkap }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#60a5fa', color: '#ffffff'}">
                                        <i class="pi pi-clipboard" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4 w-[75%]">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Dokumen Belum Lengkap</span>
                                        <span class="font-bold text-xl">{{ totalSiswaDokumenBelumLengkap }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#c084fc', color: '#ffffff'}">
                                        <i class="pi pi-file" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Terdaftar</span>
                                        <span class="font-bold text-xl">{{ totalSiswaTerdaftar }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#60a5fa', color: '#ffffff'}">
                                        <i class="pi pi-user-plus" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Terverifikasi</span>
                                        <span class="font-bold text-xl">{{ totalSiswaTerverifikasi }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#34d399', color: '#ffffff'}">
                                        <i class="pi pi-verified" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4 w-[75%]">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Belum Terverifikasi</span>
                                        <span class="font-bold text-xl">{{ totalSiswaBelumTerverifikasi }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#FF6461', color: '#ffffff'}">
                                        <i class="pi pi-times-circle" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-4">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Lulus</span>
                                        <span class="font-bold text-xl">{{ totalSiswaLulus }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#34d399', color: '#ffffff'}">
                                        <i class="pi pi-check-square" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                    </div>
                    <div class="flex gap-4">
                        <Card class="w-[50%] border border-surface shadow-none">
                            <template #title>
                                Pengumuman
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-7 ml-1 inline">
                                        <path d="M16.881 4.345A23.112 23.112 0 0 1 8.25 6H7.5a5.25 5.25 0 0 0-.88 10.427 21.593 21.593 0 0 0 1.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 0 1-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0 0 18 11.25c0-2.414-.393-4.735-1.119-6.905ZM18.26 3.74a23.22 23.22 0 0 1 1.24 7.51 23.22 23.22 0 0 1-1.41 7.992.75.75 0 1 0 1.409.516 24.555 24.555 0 0 0 1.415-6.43 2.992 2.992 0 0 0 .836-2.078c0-.807-.319-1.54-.836-2.078a24.65 24.65 0 0 0-1.415-6.43.75.75 0 1 0-1.409.516c.059.16.116.321.17.483Z" />
                                    </svg>
                                </span>
                            </template>
                            <template #content>
                                <p class="m-0">
                                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur error repudiandae numquam deserunt quisquam repellat libero asperiores earum nam nobis, culpa ratione quam perferendis esse, cupiditate neque
                                    quas!
                                </p>
                            </template>
                        </Card>
                        <Card class="w-[60%] border border-surface shadow-none">
                            <template #title>
                                Jadwal Pendaftaran
                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6 ml-1 inline">
                                      <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                                      <path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clip-rule="evenodd" />
                                    </svg>
                                </span>
                            </template>
                            <template #content>
                                <DataTable :value="jadwals">
                                    <template #empty>Tidak ada jadwal</template>
                                    <Column header="No" #body="{ index }">
                                        {{ index + 1 }}
                                    </Column>
                                    <Column header="Tahapan" field="tahapan_nama"></Column>
                                    <Column header="Waktu Mulai" field="waktu_mulai">
                                        <template #body="{ data }">
                                            {{ setTime(data.waktu_mulai) }}
                                        </template>
                                    </Column>
                                    <Column header="Waktu Selesai" field="waktu_selesai">
                                        <template #body="{ data }">
                                            {{ setTime(data.waktu_selesai) }}
                                        </template>
                                    </Column>
                                    <Column header="Berlangsung">
                                        <template #body="{ data }">
                                            <div class="flex justify-center">
                                                <Tag 
                                                    :icon="setIcon(data.waktu_mulai, data.waktu_selesai)" 
                                                    :severity="setSeverity(data.waktu_mulai, data.waktu_selesai)">
                                                </Tag>
                                            </div>
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
