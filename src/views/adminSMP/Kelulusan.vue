<script setup lang="ts">
import PendaftaranTable from "@/components/table/PendaftaranTable.vue";
import type { PaginationMeta } from "@/interfaces/layoutInterface";
// import type { SiswaWithStatus } from '@/interfaces/siswaInterface';
// import { getAllPeriode, getAllPeriodeJalurByPeriodeId } from '@/services/periodeService';
// import { getAllSiswaWithStatus } from '@/services/siswaService';
import { useAuthStore } from "@/store/authStore";
import { isUserAdminSekolah } from "@/utils/userType";
import {
   useConfirm,
   useToast,
   type DataTableFilterEvent,
   type DataTablePageEvent,
} from "primevue";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from "lodash";
import { usePendaftaranStore } from "@/store/pendaftaranStore";
import { getLaporanPendaftaran, getPengumumanData, seleksiKelulusan } from "@/services/pengumumanService";
import { findJadwal, findPeriodeJalur } from "@/utils/findPeriodeJalur";
import { getJadwalByPeriodeJalurId } from "@/services/periodeService";
import type { JadwalDTO } from "@/interfaces/periodeInterface";
import type { GetKelulusanSiswa } from "@/interfaces/pengumumanInterface";

const toast = useToast();
const authStore = useAuthStore();
const pendaftaranStore = usePendaftaranStore();
const router = useRouter();
const confirm = useConfirm();
const siswaData = ref<GetKelulusanSiswa[]>([]);
// const periodeId = ref<number>(0)
const periodeJalurId = ref<number>(0)
const metodeRanking = ref<string>("")
const jadwalPengumuman = ref<JadwalDTO | null>(null)
const sekolahId = isUserAdminSekolah(authStore.user)
   ? authStore.user.sekolah_id
   : 0;
const sekolahNama = isUserAdminSekolah(authStore.user)
   ? authStore.user.sekolah_nama
   : "";
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
      statusDaftar: { value: null, matchMode: FilterMatchMode.EQUALS },
      statusPendaftaran: { value: null, matchMode: FilterMatchMode.CONTAINS },
      statusKelulusan: { value: null, matchMode: FilterMatchMode.CONTAINS },
   };
};

initFilters();

const getPendaftaranData = async (page: number, limit: number, filters: any) => {
   try {
      const response = await getPengumumanData(
         sekolahId,
         periodeJalurId.value,
         page,
         limit,
         JSON.stringify(filters.value)
      );
      metaData.limit = response.meta.limit;
      metaData.page = response.meta.page;
      metaData.total = response.meta.total;
      siswaData.value = response.data;
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Error",
            detail: `${error.message}`,
            life: 5000,
         });
      }
   }
}

onMounted(async () => {
   try {
      
      if (!pendaftaranStore.periode_jalur_id) {
         await pendaftaranStore.loadPeriodeAndPeriodeJalur()
      }

      const periodeJalur = findPeriodeJalur(pendaftaranStore.periode_jalurs, "zonasi")
      const jadwals = await getJadwalByPeriodeJalurId(periodeJalur.periode_jalur_id)
      const jadwalPengumuman_ = findJadwal(jadwals, "pengumuman")
      if (!jadwalPengumuman_.jadwal) {
         toast.add({
            severity: "warn",
            summary: "Peringatan",
            detail: jadwalPengumuman_.message,
            life: 5000,
         });
      }
   
      jadwalPengumuman.value = jadwalPengumuman_.jadwal 
      periodeJalurId.value = periodeJalur ? periodeJalur.periode_jalur_id : 0
      metodeRanking.value = periodeJalur.metode_ranking ?? ""
      await getPendaftaranData(metaData.page, metaData.limit, filters)
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
});

const onFilter = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters,
   };
   await getPendaftaranData(metaData.page, metaData.limit, filters)
   
}, 500);

const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await getPendaftaranData(metaData.page, metaData.limit, filters)
};

const onPageChange = async (event: DataTablePageEvent) => {
   // console.log(event)
   metaData.page = event.page;
   metaData.limit = event.rows;
   await getPendaftaranData(metaData.page, metaData.limit, filters)
};

const onStatusChange = async () => {
   await getPendaftaranData(metaData.page, metaData.limit, filters)
};

function showMetodeRanking (metode: string) {
    if (metode === "") {
        return ""
    }

    return metode === "JARAK_LURUS" ? "Jarak Lurus" : "Jarak Rute"
}
const onPassedSelection = () => {
    confirm.require({
      message: `Seleksi kelulusan akan diranking berdasarkan ${showMetodeRanking(metodeRanking.value)} antara rumah dan sekolah, Yakin ingin melanjutkan?`,
      header: "Konfirmasi",
      icon: "pi pi-exclamation-triangle",
      rejectProps: {
         label: "Batal",
         severity: "secondary",
         outlined: true,
      },
      acceptProps: {
         label: 'Lanjut',
      },
      accept: async () => {
         try {
            const response = await seleksiKelulusan(sekolahId, periodeJalurId.value)
            if (response.count > 0) {
               toast.add({ 
                  severity: 'success', 
                  summary: 'Berhasil', 
                  detail: 'Berhasil melakukan seleksi siswa', 
                  life: 3000 
               });
               await getPendaftaranData(metaData.page, metaData.limit, filters)
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
      },
      reject: () => {
         // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
      },
   });
}

const onDownloadLaporan = async () => {
   try {
      const response = await getLaporanPendaftaran(null, periodeJalurId.value, sekolahId, null)
      const url = window.URL.createObjectURL(response)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'laporan-pendaftaran.xlsx')
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

const statusDokumen = [
   {
      label: "Semua Dokumen Valid",
      value: true,
   },
   {
      label: "Dokumen Belum Valid",
      value: false,
   },
];

const metodeRankingOptions = [
   {
      label: "Jarak Lurus",
      value: "jarak_lurus"
   },
   {
      label: "Jarak Rute",
      value: "jarak_rute"
   }
]

// const op = ref();
// const activeRowData = ref()
// // const activeRowId = ref()
// const isPopoverVisible = ref(false);
// const showPopover = (event: Event, data: PendaftaranSDResponse) => {
// //    op.value.toggle(event);
//     // if (!op.value) return;

//     op.value.hide()

//     if (activeRowData.value?.siswa_id === data.siswa_id) {
//         activeRowData.value = null
//         isPopoverVisible.value = false
//     } else {
//         activeRowData.value = data
//          nextTick(() => {
//             op.value.show(event)
//             isPopoverVisible.value = true
//         })
//     }
// };

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

</script>

<template>
   <div class="md:w-full">
      <div class="card">
         <div class="flex flex-col gap-6">
            <Button
               label="Kembali"
               severity="danger"
               @click="goBack"
               icon="pi pi-fw pi-arrow-left"
               class="w-[40%] sm:w-[10%] leading-5">
            </Button>
            <div class="text-2xl font-bold">Kelulusan Zonasi</div>
            <div class="flex justify-end gap-4">
                <Button 
                    label="Seleksi Kelulusan"
                    severity="warn"
                    :disabled="!jadwalPengumuman"
                    icon="pi pi-search-plus"
                    @click="onPassedSelection"
                    class="w-[50%] sm:w-[15%]">
                </Button>
                <Button
                    v-if="jadwalPengumuman" 
                    label="Download Laporan"
                    severity="info"
                    icon="pi pi-download"
                    @click="onDownloadLaporan"
                    class="w-[50%] sm:w-[15%]">
                </Button>
            </div>

            <div>
               <PendaftaranTable
                  :data="siswaData ? siswaData : []"
                  showToolbar
                  :header="`Data Siswa Terdaftar ${sekolahNama}`"
                  :filters="filters"
                  :meta="metaData"
                  @onFiltering="onFilter"
                  @onPageChange="onPageChange">
    
                  <template #toolbar-start>
                     <div class="flex flex-col sm:flex-row gap-2">
                        <Select
                           v-model="filters.isAllDokumenValid.value"
                           showClear
                           :options="metodeRankingOptions"
                           optionLabel="label"
                           optionValue="value"
                           placeholder="Filter Metode Perankingan"
                           class="w-full md:w-56"
                           @change="onStatusChange" />
                        <Select
                           v-model="filters.isAllDokumenValid.value"
                           showClear
                           :options="statusDokumen"
                           optionLabel="label"
                           optionValue="value"
                           placeholder="Filter Status Dokumen"
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
                        field="sekolah_asal_nama"
                        header="Sekolah Asal"
                        style="width: 15%">
                        <template #body="{ data }">{{
                           data.sekolah_asal_nama
                        }}</template>
                     </Column>
                     <Column header="Status" style="width: 15%">
                        <template #body="{ data }">
                           <Tag
                              :value="
                                 valueStatusKelulusan(data.status_kelulusan)
                              "
                              :severity="
                                 severityStatusKelulusan(data.status_kelulusan)
                              " />
                        </template>
                     </Column>
                  </template>
                  
                  <!-- <template #action-buttons="{ data }"> -->
                     <!-- <div class="flex flex-col gap-2">
                        <div class="flex gap-1">
                           <Button
                               severity="info"
                               label="Cek Data Siswa"
                               :icon="activeRowData?.siswa_id === data.siswa_id &&
                                  isPopoverVisible
                                     ? 'pi pi-angle-down'
                                     : 'pi pi-angle-right'
                               "
                               @click="showPopover($event, data)"
                               class="grow" />
    
                           <Button label="" icon="pi pi-envelope" severity="info" @click="onVerify(data)"></Button>
                        </div>
                     </div> -->
                  <!-- </template> -->
               </PendaftaranTable>
               <!-- <Popover ref="op">
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
               </Popover> -->
            </div>
         </div>
         
      </div>
   </div>
</template>
