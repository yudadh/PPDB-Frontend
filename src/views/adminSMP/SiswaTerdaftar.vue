<script setup lang="ts">
import PendaftaranTable from "@/components/table/PendaftaranTable.vue";
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
import { nextTick, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from "lodash";
import {
   getPendaftaranZonasiSMP,
} from "@/services/pendaftaranService";
import type { PendaftaranSDResponse } from "@/interfaces/pendaftaranInterface";
// import { verifikasiZonasi } from "@/services/verifikasiService";
import { usePendaftaranStore } from "@/store/pendaftaranStore";
import { findJadwal, findPeriodeJalur } from "@/utils/findPeriodeJalur";
import { getJadwalByPeriodeJalurId } from "@/services/periodeService";
import type { JadwalDTO } from "@/interfaces/periodeInterface";

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
      console.log(periodeJalurId.value)
      const response = await getPendaftaranZonasiSMP(
         sekolahId,
         periodeJalurId.value,
         page,
         limit,
         JSON.stringify(filters.value),
      );
      metaData.limit = response.meta.limit;
      metaData.page = response.meta.page;
      metaData.total = response.meta.total;
      siswaData.value = response.siswas;
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
   if (!pendaftaranStore.periode_id && !pendaftaranStore.periode_jalur_id) {
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

   console.log(periodeJalurId.value)
   // console.log(filters.value)
   await getPendaftaranData(metaData.page, metaData.limit, filters)
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

// const updateStatusPendaftaran = async (data: PendaftaranSDResponse, status: StatusPendaftaran) => {
//    try {
//       const msg = status === 'DIBATALKAN' ? 'membatalkan' : 'memverifikasi'
//       const ids = [data.pendaftaran_id];
//       const response = await verifikasiZonasi(ids, status);
//       if (response.count !== 0) {
//          toast.add({
//             severity: "success",
//             summary: "Berhasil",
//             detail: `Berhasil ${msg} pendaftaran ${response.count} siswa`,
//             life: 2000,
//          });
//          siswaData.value = siswaData.value.filter((siswa) => !ids.includes(siswa.pendaftaran_id))
//       }
//    } catch (error) {
//       if (error instanceof Error) {
//          toast.add({
//             severity: "error",
//             summary: "Gagal",
//             detail: error.message,
//             life: 2000,
//          });
//       }
//    }
// }

// const onVerifyZonasi = async (data: PendaftaranSDResponse, status: StatusPendaftaran) => {
//    const message = status === 'VERIF_SMP' 
//    ? `Yakin akan memverifikasi pendaftaran ${data.nama}?`
//    : `Yakin akan membatalkan pendaftaran ${data.nama}?`
//    const label = status === 'VERIF_SMP' ? 'Daftar' : 'Yakin'
//    confirm.require({
//       message: message,
//       header: "Konfirmasi",
//       icon: "pi pi-exclamation-triangle",
//       rejectProps: {
//          label: "Batal",
//          severity: "secondary",
//          outlined: true,
//       },
//       acceptProps: {
//          label: label,
//       },
//       accept: async () => {
//         await updateStatusPendaftaran(data, status)
//          // toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
//       },
//       reject: () => {
//          // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
//       },
//    });
// };

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
               class="w-[10%] leading-5"></Button>
         </div>
         <div class="mt-4">
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
                  <Select
                     v-model="filters.isAllDokumenValid.value"
                     showClear
                     :options="statusDokumenValid"
                     optionLabel="label"
                     optionValue="value"
                     placeholder="Filter Status Dokumen"
                     class="w-full md:w-56"
                     @change="onStatusChange" />
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
                           :value="valueStatusDokumenValid(data.totalDokumenValid)"
                           :severity="severityStatusDokumenValid(data.totalDokumenValid)" />
                     </template>
                  </Column>
               </template>
               
               <template #action-buttons="{ data }">
                  <div class="flex flex-col gap-2">
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

                        <!-- <Button label="" icon="pi pi-envelope" severity="info" @click="onVerify(data)"></Button> -->
                        <!-- <OverlayBadge
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
                        v-if="data.isAllDokumenValid"
                        severity="success"
                        label="Verifikasi Pendaftaran"
                        icon="pi pi-check"
                        @click="onVerifyZonasi(data, 'VERIF_SMP')"></Button>
                     <Button
                        v-if="!data.isAllDokumenValid"
                        severity="danger"
                        label="Batalkan Pendaftaran"
                        icon="pi pi-times"
                        @click="onVerifyZonasi(data, 'DIBATALKAN')"></Button> -->
                  </div>
                    <Dialog v-model:visible="keteranganVisibility" maximizable modal header="Keterangan" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                        <p class="m-0"> {{ data.keterangan }} </p>
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
         </div>
      </div>
   </div>
</template>
