<script setup lang="ts">
import type { GetTotalPendaftarPerSekolah } from '@/interfaces/pengumumanInterface'
import type { JadwalDTO, PeriodeJalurDTO } from '@/interfaces/periodeInterface'
import { getLaporanDashboardDinas, getTotalPendaftarPerSekolah } from '@/services/pengumumanService'
import { getJadwalByPeriodeJalurId } from '@/services/periodeService'
import { usePendaftaranStore } from '@/store/pendaftaranStore'
import { findPeriodeJalurBerlangsung } from '@/utils/findPeriodeJalur'
import { useToast } from 'primevue'
import { onMounted, ref } from 'vue'


const toast = useToast()
const pendaftaranStore = usePendaftaranStore()
const periodeId = ref<number>(0)
const periodeNama = ref<string>("")
const periodeJalur = ref<PeriodeJalurDTO | null>(null)
const jadwals = ref<JadwalDTO[]>([])

// dashboard data
const totalSiswa = ref<number>(0)
const totalSekolahSd = ref<number>(0)
const totalSekolahSmp = ref<number>(0)
const totalSiswaTerdaftar = ref<number>(0)
const totalSiswaTerverifikasi = ref<number>(0)
const totalSiswaBelumTerverifikasi = ref<number>(0)
const totalSiswaLulus = ref<number>(0)
const totalSiswaTidakLulus = ref<number>(0)

// chart
const totalPendaftarPerSekolah = ref<GetTotalPendaftarPerSekolah[]>([])
const chartData = ref();
const chartOptions = ref();

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
            const dashboardData = await getLaporanDashboardDinas(periodeJalur.value.periode_jalur_id)
            const totalPendaftarPerSekolah_ =  await getTotalPendaftarPerSekolah(periodeJalur.value.periode_jalur_id)
            totalPendaftarPerSekolah.value = totalPendaftarPerSekolah_
            console.log(dashboardData)
            totalSiswa.value = dashboardData.total_siswa
            totalSekolahSd.value = dashboardData.total_sekolah_sd
            totalSekolahSmp.value = dashboardData.total_sekolah_smp
            totalSiswaTerdaftar.value = dashboardData.total_terdaftar
            totalSiswaTerverifikasi.value = dashboardData.total_terverifikasi
            totalSiswaBelumTerverifikasi.value = dashboardData.total_belum_terverifikasi
            totalSiswaLulus.value = dashboardData.total_lulus
            totalSiswaTidakLulus.value = dashboardData.total_tidak_lulus
            
            chartData.value = setChartData()
            chartOptions.value = setChartOptions()
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


function setChartData() {
    const documentStyle = getComputedStyle(document.documentElement);
    const labels = totalPendaftarPerSekolah.value.map((d) => d.sekolah_nama)
    const total = totalPendaftarPerSekolah.value.map((d) => d.total_pendaftar)

    return {
        labels: labels,
        datasets: [
            {
                label: 'Total Pendaftar',
                backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
                borderColor: documentStyle.getPropertyValue('--p-cyan-500'),
                data: total
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    font: {
                        weight: 200
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 600
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
}

function showPeriodeBerlangsung() {
    if (periodeId.value && periodeJalur.value) {
        return `Periode ${periodeNama.value} Jalur ${periodeJalur.value.jalur_nama} sedang berlangsung!`
    } else if (periodeId.value && !periodeJalur.value) {
        return `Periode ${periodeNama.value} sedang berlangsung!, tetapi tidak ada jalur yang sedang berlangsung!`
    } else {
        return 'Tidak ada periode yang sedang berlangsung'
    }
}

function severityMessagePeriode() {
    if (periodeId.value && periodeJalur.value) {
        return 'success'
    } else if (periodeId.value && !periodeJalur.value) {
        return 'info'
    } else {
        return 'warn'
    }
}


</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <div class="text-xl">Selamat Datang AdminDisdik</div>
                    <div>
                        <Message :severity="severityMessagePeriode()" size="large">{{ showPeriodeBerlangsung() }}</Message>
                    </div>
                    <div class="flex flex-wrap gap-4">
                        <Card class="flex-1 basis-1/5 border border-surface shadow-none">
                            <template #content>
                                <div class="flex justify-between gap-8">
                                    <div class="flex flex-col gap-10">
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
                                    <div class="flex flex-col gap-10">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Sekolah SD</span>
                                        <span class="font-bold text-xl">{{ totalSekolahSd }}</span>
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
                                    <div class="flex flex-col gap-10">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Sekolah SMP</span>
                                        <span class="font-bold text-xl">{{ totalSekolahSmp }}</span>
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
                                    <div class="flex flex-col gap-10">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Terdaftar</span>
                                        <span class="font-bold text-xl">{{ totalSiswaTerdaftar }}</span>
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
                                    <div class="flex flex-col gap-10">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Terverifikasi</span>
                                        <span class="font-bold text-xl">{{ totalSiswaTerverifikasi }}</span>
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
                                    <div class="flex flex-col gap-4 w-[75%]">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Belum Terverifikasi</span>
                                        <span class="font-bold text-xl">{{ totalSiswaBelumTerverifikasi }}</span>
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
                                    <div class="flex flex-col gap-10">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Lulus</span>
                                        <span class="font-bold text-xl">{{ totalSiswaLulus }}</span>
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
                                    <div class="flex flex-col gap-10">
                                        <span class="text-surface-500 dark:text-surface-400 text-lg">Total Siswa Tidak Lulus</span>
                                        <span class="font-bold text-xl">{{ totalSiswaTidakLulus }}</span>
                                    </div>
                                    <span class="w-10 h-10 rounded-full inline-flex justify-center items-center text-center" :style="{ backgroundColor: '#34d399', color: '#ffffff'}">
                                        <i class="pi pi-check-square" />
                                    </span>
                                </div>
                            </template>
                        </Card>
                    </div>
                    <div class="card">
                        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-[30rem]"  />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
