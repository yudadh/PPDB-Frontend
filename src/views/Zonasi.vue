<script setup lang="ts">
import type { PendaftaranZonasi } from '@/interfaces/pendaftaranInterface';
import { daftarZonasi, getSekolahByBanjarId } from '@/services/pendaftaranService';
import { getJadwalByPeriodeJalurId } from '@/services/periodeService';
import { getSiswaStatusById } from '@/services/siswaService';
import { useAuthStore } from '@/store/authStore';
import { usePendaftaranStore } from '@/store/pendaftaranStore';
import { findJadwal, findPeriodeJalur } from '@/utils/findPeriodeJalur';
import { isUserSiswa } from '@/utils/userType';
import { useConfirm, useToast } from 'primevue';
import { nextTick, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import L, { type LatLngExpression } from 'leaflet'
import { countJarakLurus, countJarakRute } from '@/utils/countJarak';

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
// const siswaDataStore = useSiswaDataStore()
const pendaftaranStore = usePendaftaranStore()
const sekolahData = reactive({
    sekolah_nama: "",
    lintang: 0,
    bujur: 0
})
const stepValue = ref()
const router = useRouter()
const activePeriodeId = ref<number>()
const jalurId = ref<number>()
const periodeJalurId = ref<number>(0)
const isDokumenLengkap = ref(false)
const isWilayahFull = ref(false)
const isTerdaftar = ref(false)
const isAllDokumenValid = ref(false)
const banjarId = ref(0)
const tglLahir = ref("")
const lintang = ref(0)
const bujur = ref(0)
const map = ref<L.Map>()
const mapVisibility = ref(false)
const jarak = ref(0)
const metodeRanking = ref<"JARAK_LURUS" | "JARAK_RUTE" | null>(null)

const siswa_id = isUserSiswa(authStore.user) ? authStore.user.siswa_id : 0

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const fetchPeriodeJalur = async () => {
   if (!pendaftaranStore.periode_id && !pendaftaranStore.periode_jalur_id) {
      await pendaftaranStore.loadPeriodeAndPeriodeJalur()
   }

   const periodeJalur = findPeriodeJalur(pendaftaranStore.periode_jalurs, "zonasi")
   console.log(periodeJalur)
   const jadwals = await getJadwalByPeriodeJalurId(periodeJalur.periode_jalur_id)
   const jadwalPendaftaran_ = findJadwal(jadwals, "pendaftaran")
   if (!jadwalPendaftaran_.jadwal) {
      toast.add({
         severity: "warn",
         summary: "Peringatan",
         detail: jadwalPendaftaran_.message,
         life: 5000,
      });
   }
   activePeriodeId.value = pendaftaranStore.periode_id ? pendaftaranStore.periode_id : 0
   periodeJalurId.value = periodeJalur.periode_jalur_id ? periodeJalur.periode_jalur_id : 0
   metodeRanking.value = periodeJalur.metode_ranking
}
 
onMounted(async () => {
    // isTerdaftar.value = pendaftaranStore.is_daftar.zonasi
    try {
        await fetchPeriodeJalur()
        const response = await getSiswaStatusById(siswa_id, periodeJalurId.value)
        console.log(response)
        isTerdaftar.value = response.isTerdaftar
        isWilayahFull.value = response.isWilayahFull
        isDokumenLengkap.value = response.isDokumenFull
        isAllDokumenValid.value = response.isDokumenValid
        banjarId.value = response.banjar_id
        tglLahir.value = response.tanggal_lahir
        lintang.value = response.lintang
        bujur.value = response.bujur

        const sekolahTujuan = await getSekolahByBanjarId(banjarId.value)
        sekolahData.sekolah_nama = sekolahTujuan.sekolah_nama
        sekolahData.lintang = sekolahTujuan.lintang
        sekolahData.bujur = sekolahTujuan.bujur
        // if (response.isWilayahFull && response.isDokumenFull && response.isDokumenValid) {
        //     stepValue.value = '3'
        // } else if (!response.isWilayahFull && !response.isDokumenFull && !response.isDokumenValid) {
        //     stepValue.value = '1'
        //     toast.add({ severity: 'warn', summary: 'Warning', detail: 'Biodata Wilayah Siswa Belum Lengkap', life: 5000})
        //     toast.add({ severity: 'warn', summary: 'Warning', detail: 'Dokumen Siswa Belum Lengkap', life: 5000})
        // } else if (response.isWilayahFull && !response.isDokumenFull && !response.isDokumenValid) {
        //     stepValue.value = '2'
        //     toast.add({ severity: 'warn', summary: 'Warning', detail: 'Dokumen Siswa Belum Lengkap', life: 5000})
        // } else if (response.isWilayahFull && response.isDokumenFull && !response.isDokumenValid) {
        //     stepValue.value = '2'
        //     toast.add({ severity: 'warn', summary: 'Warning', detail: 'Dokumen Siswa Belum Semuanya Valid', life: 5000})
        // }
        if (response.isWilayahFull && response.isDokumenFull && response.isDokumenValid) {
            stepValue.value = '3'
            return
        }

        const messages: string[] = []
        if (!response.isWilayahFull) {
            messages.push('Biodata Wilayah Siswa Belum Lengkap')
            messages.push('Dokumen Siswa Belum Lengkap')
        }

        if (!response.isDokumenFull) {
            messages.push('Dokumen Siswa Belum Lengkap')
        }

        if (!response.isDokumenValid) {
            messages.push('Dokumen Siswa Belum Valid')
        }
        
        if (response.isWilayahFull && (!response.isDokumenFull || !response.isDokumenValid)) {
            stepValue.value = '2'
        } else {
            stepValue.value = '1'
        }

        messages.forEach((message) => {
            toast.add({ severity: 'warn', summary: 'Warning', detail: message, life: 5000})
        })
    } catch (error) {
        if (error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message, 
                life: 5000
            })
        }
    }

    
})

const daftarZonasi_ = async () => {
    confirm.require({
        message: 'Anda yakin untuk mendaftar jalur Zonasi?',
        header: 'Konfirmasi',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Batal',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Daftar'
        },
        accept: async () => {
            if (!jalurId.value && !periodeJalurId.value) {
                toast.add({ 
                    severity: 'error', 
                    summary: 'Gagal', 
                    detail: 'Tidak ada jalurId dan periodeJalurId', 
                    life: 3000 
                })
            }
            const data: PendaftaranZonasi = {
                siswa: {
                    siswa_id: siswa_id,
                    banjar_id: banjarId.value,
                    tanggal_lahir: tglLahir.value,
                    lintang: lintang.value,
                    bujur: bujur.value
                },
                periode_jalur_id: periodeJalurId.value
            }
            console.log(data)
            try {
                const response = await daftarZonasi(data)
                if(response) {
                    isTerdaftar.value = true
                    pendaftaranStore.storePendaftaranState('Zonasi', true)
                    toast.add({ 
                        severity: 'success', 
                        summary: 'Sukses', 
                        detail: 'Pendaftaran Zonasi Berhasil', 
                        life: 3000 
                    })
                }
            } catch (error) {
                if(error instanceof Error) {
                    toast.add({ 
                        severity: 'error', 
                        summary: 'Gagal', 
                        detail: error.message, 
                        life: 3000 
                    })
                }else {
                    toast.add({ 
                        severity: 'error', 
                        summary: 'Gagal', 
                        detail: "Terjadi error yang tidak diketahui", 
                        life: 3000 
                    })
                }
            }
        },
        reject: () => {
            // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
}

const showMap = async () => {
    
    await nextTick()

    if (map.value) {
        map.value.remove()
    }

    map.value = L.map('map').setView([-8.5348986, 115.1346373], 16); // Default view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value);
    // const accessToken = 'pk.eyJ1IjoieXVkYWRoIiwiYSI6ImNtNG1iY2hjMTAwNXEybG9yNG52N240eHIifQ.lu67gBuXwPDn__wLzdZCDw'
    // map.value = L.map('map').setView([-8.5348986, 115.1346373], 16)
    // L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${accessToken}`, {
    //   id: 'mapbox/streets-v12', // kamu bisa ganti dengan style lainnya
    //   tileSize: 512,
    //   zoomOffset: -1,
    //   accessToken,
    //   attribution:
    //     '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    // }).addTo(map.value);
    
    map.value.invalidateSize()
    if (!metodeRanking.value) return
    const rumahMarker = L.circleMarker([lintang.value, bujur.value], {
        radius: 10,
        color: '#a6a6a8',        // warna garis
        fillColor: 'blue',    // warna isi
        fillOpacity: 0.8,
        opacity: 1.5,
        weight: 4
    }).addTo(map.value);
    const sekolahMarker = L.marker([sekolahData.lintang, sekolahData.bujur]).addTo(map.value);
    rumahMarker.bindTooltip("Rumah").openTooltip()
    sekolahMarker.bindTooltip("Sekolah").openTooltip()

    let latlngs: LatLngExpression[] = []
    const rumah = [lintang.value, bujur.value]
    const sekolah = [sekolahData.lintang, sekolahData.bujur]
    if (metodeRanking.value.toLowerCase() === "jarak_lurus") {
        const jarakLurus = countJarakLurus(rumah, sekolah)
        jarak.value = jarakLurus.jarak
        latlngs = jarakLurus.latlngs
    } else if (metodeRanking.value.toLowerCase() === "jarak_rute") {
        const jarakRute = await countJarakRute(rumah, sekolah)
        jarak.value = jarakRute.jarak
        latlngs = jarakRute.latlngs
    }
    
    L.polyline(latlngs, {
      color: 'blue',
      weight: 8,
      opacity: 0.7,
    }).addTo(map.value);

    map.value.fitBounds(L.polyline(latlngs).getBounds()); // Zoom to route

    // console.log(map.value)
}

</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <Button label="Kembali" severity="danger" @click="goBack" icon="pi pi-fw pi-arrow-left" class=" w-[10%] leading-5"></Button>
                    <div class="flex justify-between">
                        <div class="text-xl font-bold mb-2">Pendaftaran Zonasi</div>
                        <!-- <div class="flex gap-4 grow-0">
                            <Button label="Cek Biodata" icon="pi pi-fw pi-user-edit" severity="info" as="router-link" to="/siswa/biodata"></Button>
                            <Button label="Cek Dokumen" icon="pi pi-fw pi-file-check" severity="info" as="router-link" to="/siswa/dokumen"></Button>
                        </div> -->
                    </div>
                    <div class="flex flex-col">
                        <Stepper :value="stepValue" linear class="basis-[5rem]">
                            <StepList>
                                <Step value="1">Isi Biodata Diri</Step>
                                <Step value="2">Upload Dokumen Wajib</Step>
                                <Step value="3">Daftar</Step>
                            </StepList>
                        </Stepper>
                        <Panel>
                            <template #header>
                                <div class="flex gap-2">
                                    <Tag :severity="isWilayahFull ? 'success' : 'danger'" :value="isWilayahFull ? 'Biodata Sudah Lengkap' : 'Biodata Belum Lengkap'"></Tag>
                                    <Tag :severity="isDokumenLengkap ? 'success' : 'danger'" :value="isDokumenLengkap ? 'Dokumen Sudah Lengkap' : 'Dokumen Belum Lengkap'"></Tag>
                                    <Tag :severity="isAllDokumenValid ? 'success' : 'danger'" :value="isAllDokumenValid ? 'Dokumen Sudah Valid' : 'Dokumen Belum Valid'"></Tag>
                                    <Tag :severity="isTerdaftar ? 'success' : 'danger'" :value="isTerdaftar ? 'Sudah Terdaftar' : 'Belum Terdaftar'"></Tag>
                                </div>
                            </template>
                            <template #icons>
                                <div class="flex gap-4 grow-0">
                                    <Button label="Cek Biodata" icon="pi pi-fw pi-user-edit" severity="info" as="router-link" to="/siswa/biodata"></Button>
                                    <Button label="Cek Dokumen" icon="pi pi-fw pi-file-check" severity="info" as="router-link" to="/siswa/dokumen"></Button>
                                </div>
                            </template>
                            <div class="flex flex-col gap-8 items-center">
                                <div class="text-lg flex flex-col gap-2 items-center">
                                    Sekolah Tujuan:
                                    <div class="flex gap-2 justify-center items-center">
                                        <span class="bg-cyan-500 rounded-md pl-2 pr-2 text-neutral-50">{{ sekolahData.sekolah_nama }}</span>
                                        <Button
                                            v-if="isTerdaftar" 
                                            icon="pi pi-map" 
                                            class="h-7" 
                                            @click="mapVisibility = true"
                                            v-tooltip.top="'Lihat Jarak Peta'">
                                        </Button>
                                    </div> 
                                </div>
                                <!-- <div class="text-lg">Silahkan Mendaftar</div> -->
                                <Button label="Daftar" class="w-[15%] leading-5" @click="daftarZonasi_" :disabled="!isDokumenLengkap || !isWilayahFull || !isAllDokumenValid || isTerdaftar"></Button>
                                <!-- <ConfirmDialog /> -->
                            </div>
                        </Panel>
                         <Dialog v-model:visible="mapVisibility" @show="showMap" header="Rute Rumah ke Sekolah Tujuan" modal :style="{ width: '50vw' }">
                            <div id="map"></div>
                            <div class= "bg-slate-700 top-[85px] right-10 absolute z-10 rounded-lg p-4 shadow-lg w-[110px] h-[35px] flex justify-center items-center">
                                <div class="text-slate-200 flex gap-2 justify-around items-center">
                                    <span v-if="metodeRanking?.toLowerCase() === 'jarak_rute' ">
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike-icon lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                                        </svg>
                                    </span>
                                    <span v-if="metodeRanking?.toLowerCase() === 'jarak_lurus' ">
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-slash-icon lucide-slash"><path d="M22 2 2 22"/>
                                        </svg>
                                    </span> 
                                    <div class="grow">
                                        {{ (jarak / 1000).toFixed(2) }} km
                                    </div>
                                </div>
                            </div>
                            <template #footer>
                                <Button label="Batal" outlined severity="danger" @click="mapVisibility = false" :fluid="false"/>
                                <Button label="Simpan" outlined severity="success" @click="" :fluid="false"/>
                            </template>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#map {
    width: 100%;
    height: 400px;
    z-index: 1;
}
</style>