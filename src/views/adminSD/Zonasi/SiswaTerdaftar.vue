<script setup lang="ts">
import type { PaginationMeta } from "@/interfaces/layoutInterface";
// import type { SiswaWithStatus } from '@/interfaces/siswaInterface';
// import { getAllPeriode, getAllPeriodeJalurByPeriodeId } from '@/services/periodeService';
// import { getAllSiswaWithStatus } from '@/services/siswaService';
import { useAuthStore } from "@/store/authStore";
import { isUserAdminSekolah } from "@/utils/userType";
import {
   useToast,
   type DataTableFilterEvent,
   type DataTablePageEvent,
} from "primevue";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from "lodash";
import { getPendaftaranZonasiSD } from "@/services/pendaftaranService";
import type { PendaftaranSDResponse } from "@/interfaces/pendaftaranInterface";
import PendaftaranTable from "@/components/table/PendaftaranTable.vue";
import { nextTick } from "vue";
import { usePendaftaranStore } from "@/store/pendaftaranStore";
import { findJadwal, findPeriodeJalur } from "@/utils/findPeriodeJalur";
import { getJadwalByPeriodeJalurId } from "@/services/periodeService";
import type { JadwalDTO } from "@/interfaces/periodeInterface";
import L, { type LatLngExpression } from 'leaflet'
import { countJarakLurus, countJarakRute } from '@/utils/countJarak';

const toast = useToast();
const authStore = useAuthStore();
const pendaftaranStore = usePendaftaranStore()
const router = useRouter();

const siswaData = ref<PendaftaranSDResponse[]>([]);
const periodeId = ref<number>(0)
const periodeJalurId = ref<number>(0)
const jadwalVerifikasi = ref<JadwalDTO | null>(null)
const sekolahId = isUserAdminSekolah(authStore.user)
   ? authStore.user.sekolah_id
   : 0;
const sekolahNama = isUserAdminSekolah(authStore.user)
   ? authStore.user.sekolah_nama
   : "";
const sekolahData = reactive({
    sekolah_nama: "",
    lintang: 0,
    bujur: 0
})
const map = ref<L.Map>()
const mapVisibility = ref(false)
const siswaCoordinate = reactive({
   lintang: 0,
   bujur: 0
})
const jarak = ref(0)
const metodeRanking = ref<"JARAK_LURUS" | "JARAK_RUTE" | null>(null)
// const isLoading = ref<boolean>(false)

const metaData = reactive<PaginationMeta>({
   page: 1,
   limit: 10,
   total: 0,
});
const filters = ref();

const goBack = () => {
   if (window.history.length > 1) {
      router.back();
   } else {
      router.push("/"); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
   }
};

const initFilters = () => {
   filters.value = {
      nisn: { value: null, matchMode: FilterMatchMode.CONTAINS },
      nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
      isDokumenFull: { value: null, matchMode: FilterMatchMode.EQUALS },
      isWilayahFull: { value: null, matchMode: FilterMatchMode.EQUALS },
      isAllDokumenValid: { value: null, matchMode: FilterMatchMode.EQUALS },
      totalDokumenValid: { value: null, matchMode: FilterMatchMode.EQUALS },
      statusDaftar: { value: null, matchMode: FilterMatchMode.EQUALS },
      statusPendaftaran: { value: null, matchMode: FilterMatchMode.CONTAINS },
      statusKelulusan: { value: null, matchMode: FilterMatchMode.CONTAINS },
   };
};

initFilters();

async function getSiswaData(page: number, limit: number, filters: any) {
   const response = await getPendaftaranZonasiSD(
      sekolahId,
      periodeJalurId.value,
      page,
      limit,
      filters
   );
   console.log(response.siswas)
   metaData.limit = response.meta.limit;
   metaData.page = response.meta.page;
   metaData.total = response.meta.total;
   siswaData.value = response.siswas;
}

onMounted(async () => {
   try {
      if (!pendaftaranStore.periode_id) {
         await pendaftaranStore.loadPeriodeAndPeriodeJalur()
      }

      const periodeJalur = findPeriodeJalur(pendaftaranStore.periode_jalurs, "zonasi")
      const jadwals = await getJadwalByPeriodeJalurId(periodeJalur.periode_jalur_id)
      const jadwalVerifikasi_ = findJadwal(jadwals, "verifikasi")

      if (!jadwalVerifikasi_.jadwal) {
         toast.add({
            severity: "warn",
            summary: "Peringatan",
            detail: jadwalVerifikasi_.message,
            life: 5000,
         });
      }

      jadwalVerifikasi.value = jadwalVerifikasi_.jadwal

      periodeId.value = pendaftaranStore.periode_id ? pendaftaranStore.periode_id : 0
      periodeJalurId.value = periodeJalur ? periodeJalur.periode_jalur_id : 0
      metodeRanking.value = periodeJalur.metode_ranking

      await getSiswaData(
         metaData.page,
         metaData.limit,
         JSON.stringify(filters.value)
      );
   } catch (error) {
      console.log("error dijalankan")
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Error",
            detail: `${error.message}`,
            life: 5000,
         });
      }
   }
});

const onFilter = debounce(async (event: DataTableFilterEvent) => {
   try {
      filters.value = {
         ...filters.value,
         ...event.filters,
      };
      console.log(event.filters);
      await getSiswaData(
         metaData.page,
         metaData.limit,
         JSON.stringify(filters.value)
      );
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 1500,
         });
      }
   }
}, 500);

const onPageChange = async (event: DataTablePageEvent) => {
   // console.log(event)
   // const filtersParam = JSON.stringify(filters.value)
   // console.log(event.filters)
   // console.log(filtersParam)
   try {
      await getSiswaData(
         event.page + 1,
         event.rows,
         JSON.stringify(filters.value)
      );
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 1500,
         });
      }
      console.log(error);
   }
};

const onStatusChange = async () => {
   try {
      console.log(filters.value);
      await getSiswaData(
         metaData.page,
         metaData.limit,
         JSON.stringify(filters.value)
      );
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 1500,
         });
      }
      console.log(error);
   }
   // console.log(meta)
};

const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await getSiswaData(
      metaData.page,
      metaData.limit,
      JSON.stringify(filters.value)
   );
};

const onOpenMap = (rumah: number[], sekolah: number[]) => {
   sekolahData.lintang = sekolah[0]
   sekolahData.bujur = sekolah[1]
   siswaCoordinate.lintang = rumah[0]
   siswaCoordinate.bujur = rumah[1]
   mapVisibility.value = true
}

const showMap = async () => {
    
    await nextTick()

    if (map.value) {
        map.value.remove()
    }

    map.value = L.map('map').setView([siswaCoordinate.lintang, siswaCoordinate.bujur], 16); // Default view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value);
    
    map.value.invalidateSize()
    if (!metodeRanking.value) return
    const rumahMarker = L.circleMarker([siswaCoordinate.lintang, siswaCoordinate.bujur], {
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
    const rumah = [siswaCoordinate.lintang, siswaCoordinate.bujur]
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

const statusDokumenValid = [
   {
      label: "Semua Dokumen Belum Valid",
      value: "0",
   },
   {
      label: "Sebagian Dokumen Belum Valid",
      value: "1",
   },
   {
      label: "Sebagian Dokumen Valid",
      value: "2",
   },
   {
      label: "Semua Dokumen Valid",
      value: "3",
   },
];

const statusPendaftaran = [
   {
      label: "Belum Terverifikasi SMP",
      value: "VERIF_SD",
   },
   {
      label: "Sudah Terverifikasi SMP",
      value: "VERIF_SMP",
   }
]

const op = ref();
const keteranganVisibility = ref(false);
const activeRowData = ref()
// const activeRowId = ref()
const isPopoverVisible = ref(false);
const showPopover = (event: Event, data: PendaftaranSDResponse) => {
//    op.value.toggle(event);
    // if (!op.value) return;

    op.value.hide()

    if (activeRowData.value?.siswa_id === data.siswa_id) {
        activeRowData.value = null
        isPopoverVisible.value = false
    } else {
        activeRowData.value = data
         nextTick(() => {
            op.value.show(event)
            isPopoverVisible.value = true
        })
    }
};

const valueStatusKelulusan = (status: 'PENDAFTARAN' | 'LULUS' | 'TIDAK_LULUS') => {
    switch (status) {
        case 'PENDAFTARAN':
            return 'Pendaftaran'
        case 'LULUS':
            return 'Lulus'
        case 'TIDAK_LULUS':
            return 'Tidak Lulus'
        default: 
            return 'Belum Daftar'
    }
}

const severityStatusKelulusan = (status: 'PENDAFTARAN' | 'LULUS' | 'TIDAK_LULUS') => {
    switch (status) {
        case 'PENDAFTARAN':
            return 'warn'
        case 'LULUS':
            return 'success'
        case 'TIDAK_LULUS':
            return 'danger'
        default: 
            return 'info'
    }
}

const valueStatusDokumenValid = (total: number) => {
   switch (total) {
      case 0:
         return 'Semua Dokumen Belum Valid'
      case 1:
         return 'Sebagian Dokumen Belum Valid'
      case 2:
      case 3:
         return 'Sebagian Dokumen Valid'
      case 4:
         return 'Semua Dokumen Valid'
      default: 
         return 'Status Tidak Diketahui'
   }
}

const severityStatusDokumenValid = (total: number) => {
   switch (total) {
      case 0:
         return 'danger'
      case 1:
         return 'warn'
      case 2:
      case 3:
         return 'info'
      case 4:
         return 'success'
   }
}

async function onRefresh() {
   try {
      await getSiswaData(
         metaData.page,
         metaData.limit,
         JSON.stringify(filters.value)
      );
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

</script>

<template>
   <div class="md:w-full">
      <div class="card">
         <Toast></Toast>
         <div class="flex flex-col gap-6">
            <Button
               label="Kembali"
               severity="danger"
               @click="goBack"
               icon="pi pi-fw pi-arrow-left"
               class="w-[10%] leading-5"></Button>
         </div>
         <div class="mt-4">
            <div class="flex justify-end">
               <Button label="Perbaharui Data" severity="warn" icon="pi pi-refresh" @click="onRefresh"></Button>
            </div>
            <PendaftaranTable
               :data="siswaData ? siswaData : []"
               showToolbar
               showActionButton
               :header="`Data Siswa Terdaftar ${sekolahNama}`"
               :filters="filters"
               :meta="metaData"
               @onFiltering="onFilter"
               @onPageChange="onPageChange">
               <template #toolbar-start>
                  <div class="flex gap-2">

                     <Select
                        v-model="filters.totalDokumenValid.value"
                        showClear
                        :options="statusDokumenValid"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filter Status Dokumen"
                        class="w-full md:w-56"
                        @change="onStatusChange" />
                     <Select
                        v-model="filters.statusPendaftaran.value"
                        showClear
                        :options="statusPendaftaran"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filter Status Pendaftaran"
                        class="w-full md:w-56"
                        @change="onStatusChange" />
                  </div>
               </template>

               <template #toolbar-end>
                  <Button
                     label="Reset Filter"
                     icon="pi pi-filter"
                     severity="secondary"
                     @click="onClearFilters"></Button>
               </template>

               <template #custom-columns>
                  <Column
                     field="sekolah_nama"
                     header="Sekolah Tujuan"
                     style="width: 15%">
                     <template #body="{ data }">
                        <div class="flex gap-1 items-center">
                           {{ data.sekolah_nama }}
                        <Button 
                           icon="pi pi-map" 
                           class="h-7" 
                           @click="onOpenMap([data.lintang, data.bujur], [data.sekolah_lintang, data.sekolah_bujur])"
                           v-tooltip.top="'Lihat Jarak Peta'">
                        </Button>
                        </div>
                     </template>
                  </Column>
                  <Column header="Status" style="width: 15%">
                     <template #body="{ data }">
                        <div class="flex flex-col gap-2">

                        <Tag
                           :value="
                              data.status === 'VERIF_SD'
                                 ? 'Belum Terverifikasi SMP'
                                 : 'Sudah Terverifikasi SMP'
                           "
                           :severity="
                              data.status === 'VERIF_SD' ? 'danger' : 'success'
                           "
                           />
                           <Tag
                              :value="
                                 valueStatusDokumenValid(data.totalDokumenValid)
                              "
                              :severity="
                                 severityStatusDokumenValid(data.totalDokumenValid)
                              " 
                              class="w-[100%]"/>
                        <Tag
                           :value="
                              valueStatusKelulusan(data.status_kelulusan)
                           "
                           :severity="
                              severityStatusKelulusan(data.status_kelulusan)
                           " 
                           class="w-[70%]"/>
                        </div>
                     </template>
                  </Column>
               </template>

               <template #action-buttons="{ data }">
                  <div class="flex flex-col gap-2">
                     <div class="flex gap-1">
                        <Button
                           v-if="jadwalVerifikasi"
                            severity="info"
                            label="Cek Data Siswa"
                            :icon="activeRowData?.siswa_id === data.siswa_id &&
                               isPopoverVisible
                                  ? 'pi pi-angle-down'
                                  : 'pi pi-angle-right'
                            "
                            @click="showPopover($event, data)"
                            class="grow" />

                        <!-- <Button label="" icon="pi pi-envelope" severity="info" @click="onVerify(data)"></Button> -->
                        <!-- <OverlayBadge
                           v-if="jadwalVerifikasi"
                           severity="danger"
                           :value="data.keterangan ? '1' : '0'">
                           <Button
                              v-tooltip.top="{
                                 value: 'Keterangan',
                                 showDelay: 500,
                                 hideDelay: 300,
                              }"
                              icon="pi pi-envelope"
                              severity="warn"
                              @click="keteranganVisibility = true"></Button>
                        </OverlayBadge> -->
                     </div>
                     <!-- <Button
                        v-if="data.totalDokumenValid === 0"
                        severity="danger"
                        label="Batalkan Pendaftaran"
                        icon="pi pi-check"
                        @click=""></Button> -->
                  </div>
                    <Dialog v-model:visible="keteranganVisibility" maximizable modal header="Keterangan" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                        <p class="m-0">{{ data.keterangan }}</p>
                    </Dialog>
               </template>
            </PendaftaranTable>
            <Popover ref="op">
               <div v-if="activeRowData" class="flex flex-col gap-2">
                  <Button
                     label="Cek Biodata Siswa"
                     class="grow"
                     icon="pi pi-pencil"
                     as="router-link"
                     severity="info"
                     :to="{
                        name: 'Biodata-Siswa-Dinamis',
                        params: { id: activeRowData.siswa_id },
                     }"></Button>
                  <Button
                     label="Cek Dokumen Siswa"
                     class="grow"
                     icon="pi pi-file"
                     as="router-link"
                     severity="info"
                     :to="{
                        name: 'Dokumen-Siswa-Dinamis',
                        params: { id: activeRowData.siswa_id },
                     }"></Button>
               </div>
            </Popover>
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
</template>

<style scoped>
#map {
    width: 100%;
    height: 400px;
    z-index: 1;
}
</style>