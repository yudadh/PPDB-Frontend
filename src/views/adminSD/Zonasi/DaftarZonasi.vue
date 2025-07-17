<script setup lang="ts">
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type { SiswaWithStatus } from "@/interfaces/siswaInterface";
import { getAllSiswaWithStatus } from "@/services/siswaService";
import { useAuthStore } from "@/store/authStore";
import { isUserAdminSekolah } from "@/utils/userType";
import {
   useConfirm,
   useToast,
   type DataTableFilterEvent,
   type DataTablePageEvent,
} from "primevue";
import { nextTick, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from "lodash";
import { daftarZonasi, daftarZonasiBulk } from "@/services/pendaftaranService";
import type { PendaftaranZonasi, PendaftaranZonasiBulk } from "@/interfaces/pendaftaranInterface";
import PendaftaranTable from "@/components/table/PendaftaranTable.vue";
import { usePendaftaranStore } from "@/store/pendaftaranStore";
import { findJadwal, findPeriodeJalur } from "@/utils/findPeriodeJalur";
import { getJadwalByPeriodeJalurId } from "@/services/periodeService";
import type { JadwalDTO } from "@/interfaces/periodeInterface";

const toast = useToast();
const authStore = useAuthStore();
const pendaftaranStore = usePendaftaranStore()
const router = useRouter();
const confirm = useConfirm();

const siswaData = ref<SiswaWithStatus[]>([]);
const periodeId = ref<number>(0);
const periodeJalurId = ref<number>(0);
const jadwalPendaftaran = ref<JadwalDTO | null>(null)
const jadwalVerifikasi = ref<JadwalDTO | null>(null)
const sekolahId = isUserAdminSekolah(authStore.user)
   ? authStore.user.sekolah_id
   : 0;
const sekolahNama = isUserAdminSekolah(authStore.user)
   ? authStore.user.sekolah_nama
   : "";
const isLoading = ref<boolean>(false);

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
      statusDokumen: { value: null, matchMode: FilterMatchMode.EQUALS },
      statusDaftar: { value: null, matchMode: FilterMatchMode.EQUALS },
      statusPendaftaran: { value: null, matchMode: FilterMatchMode.CONTAINS },
      statusKelulusan: { value: null, matchMode: FilterMatchMode.CONTAINS },
   };
};

initFilters();

const getSiswaData = async (
   sekolah_id: number,
   periode_jalur_id: number,
   page: number,
   limit: number,
   filters?: any
) => {
   try {
      // console.log(filters.value)
      const response = await getAllSiswaWithStatus(
         sekolah_id,
         periode_jalur_id,
         page,
         limit,
         filters
      );
      console.log(response.siswas)
      metaData.limit = response.meta.limit;
      metaData.page = response.meta.page;
      metaData.total = response.meta.total;
      siswaData.value = response.siswas;
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

onMounted(async () => {
   try {

      if (!pendaftaranStore.periode_id) {
         await pendaftaranStore.loadPeriodeAndPeriodeJalur()
      }

      const periodeJalur = findPeriodeJalur(pendaftaranStore.periode_jalurs, "zonasi")
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

      jadwalPendaftaran.value = jadwalPendaftaran_.jadwal
      const jadwalVerifikasi_ = findJadwal(jadwals, "verifikasi")

      if (!jadwalVerifikasi_.jadwal) {
         toast.add({
            severity: "warn",
            summary: "Peringatan",
            detail: jadwalPendaftaran_.message,
            life: 5000,
         });
      }

      jadwalVerifikasi.value = jadwalVerifikasi_.jadwal

      periodeId.value = pendaftaranStore.periode_id ? pendaftaranStore.periode_id : 0
      periodeJalurId.value = periodeJalur ? periodeJalur.periode_jalur_id : 0
      
      await getSiswaData(
        sekolahId,
        periodeJalurId.value,
        metaData.page,
        metaData.limit,
        JSON.stringify(filters.value)
      );

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
});

const onFilters = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters,
   };
   await getSiswaData(
      sekolahId,
      periodeJalurId.value,
      metaData.page,
      metaData.limit,
      JSON.stringify(filters.value)
   );
}, 500);

const onPageChange = async (event: DataTablePageEvent) => {
   // console.log(event)
   metaData.page = event.page;
   metaData.limit = event.rows;
   // const filtersParam = JSON.stringify(filters.value)
   // console.log(event.filters)
   // console.log(filtersParam)
   await getSiswaData(
      sekolahId,
      periodeJalurId.value,
      metaData.page + 1,
      metaData.limit,
      JSON.stringify(filters.value)
   );
};

const onStatusChange = debounce(async () => {
   // console.log(filters.value)
   await getSiswaData(
      sekolahId,
      periodeJalurId.value,
      metaData.page,
      metaData.limit,
      JSON.stringify(filters.value)
   );
}, 500);

const onClearFilters = async () => {
   // console.log(filters.value)
   // console.log('clear filter')
   initFilters();
   await getSiswaData(
      sekolahId,
      periodeJalurId.value,
      metaData.page,
      metaData.limit,
      JSON.stringify(filters.value)
   );
};

const confirmRegisterSiswa = () => {
   confirm.require({
      message: "Yakin akan mendaftarkan siswa yang datanya sudah lengkap?",
      header: "Konfirmasi",
      icon: "pi pi-exclamation-triangle",
      rejectProps: {
         label: "Batal",
         severity: "secondary",
         outlined: true,
      },
      acceptProps: {
         label: "Daftar",
      },
      accept: async () => {
         await registerBulkSiswa();
         // toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
      },
      reject: () => {
         // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
      },
   });
};

const onRegisterSiswa = (data: SiswaWithStatus) => {
   confirm.require({
      message: `Yakin akan mendaftarkan siswa ${data.nama}?`,
      header: "Konfirmasi",
      icon: "pi pi-exclamation-triangle",
      rejectProps: {
         label: "Batal",
         severity: "secondary",
         outlined: true,
      },
      acceptProps: {
         label: "Daftar",
      },
      accept: async () => {
         await registerSiswa(data);
         // if (data.pendaftaran_id && data.statusDaftar === 'DIBATALKAN') {
         //    const response = await verifikasiZonasi([data.pendaftaran_id], 'VERIF_SD')
         //    if (response) {
         //       toast.add({
         //          severity: "success",
         //          summary: "Sukses",
         //          detail: `Berhasil mendaftarkan siswa pada jalur Zonasi`,
         //          life: 2000,
         //       });
         //       const newSiswaData = siswaData.value
         //       .filter((siswa) => siswa.siswa_id !== data.siswa_id)
         //       siswaData.value = newSiswaData
         //    }
         // } else {
         // }
         // toast.add({ severity: 'info', summary: 'Confirmed', detail: 'You have accepted', life: 3000 });
      },
      reject: () => {
         // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
      },
   });
}
 
const registerSiswa = async (data: SiswaWithStatus) => {
   try {
      const dataPendaftaran: PendaftaranZonasi = {
         siswa: {
            siswa_id: data.siswa_id,
            banjar_id: data.banjar_id,
            tanggal_lahir: data.tanggal_lahir,
            lintang: Number(data.lintang),
            bujur: Number(data.bujur)
         },
         periode_jalur_id: periodeJalurId.value
      }
      const response = await daftarZonasi(dataPendaftaran)
      if (response) {
         toast.add({
            severity: "success",
            summary: "Sukses",
            detail: `Berhasil Mendaftarkan Siswa pada Jalur Zonasi`,
            life: 2000,
         });

         siswaData.value = siswaData.value.filter((siswa) => siswa.siswa_id !== data.siswa_id)
      }
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

const registerBulkSiswa = async () => {
   try {
      isLoading.value = true;
      const filtersSiswa = {
         nisn: { value: null, matchMode: FilterMatchMode.CONTAINS },
         nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
         isDokumenFull: { value: true, matchMode: FilterMatchMode.EQUALS },
         isWilayahFull: { value: true, matchMode: FilterMatchMode.EQUALS },
         statusDaftar: { value: null, matchMode: FilterMatchMode.EQUALS },
         statusDokumen: {
            value: true,
            matchMode: FilterMatchMode.EQUALS,
         },
         statusPendaftaran: {
            value: null,
            matchMode: FilterMatchMode.CONTAINS,
         },
         statusKelulusan: { value: null, matchMode: FilterMatchMode.CONTAINS },
      };

      const siswas = await getAllSiswaWithStatus(
         sekolahId,
         periodeJalurId.value,
         metaData.page,
         metaData.total,
         JSON.stringify(filtersSiswa)
      );

      console.log(siswas);
      if (siswas.siswas.length === 0) {
         toast.add({
            severity: "warn",
            summary: "Gagal",
            detail: "Tidak ada data siswa yang memenuhi syarat",
            life: 4000,
         });
         return;
      }

      const data: PendaftaranZonasiBulk = {
         siswas: siswas.siswas.map((siswa) => {
            return {
               siswa_id: siswa.siswa_id,
               banjar_id: siswa.banjar_id,
               tanggal_lahir: siswa.tanggal_lahir,
               lintang: Number(siswa.lintang),
               bujur: Number(siswa.bujur),
            };
         }),
         periode_jalur_id: periodeJalurId.value,
      };

      const response = await daftarZonasiBulk(data);
      if (response) {
         toast.add({
            severity: "success",
            summary: "Sukses",
            detail: `Berhasil Mendaftarkan ${response.count} Siswa pada Jalur Zonasi`,
            life: 2000,
         });
         const siswaTerdaftar = new Set(siswas.siswas.map((siswa) => siswa.siswa_id))
         siswaData.value = siswaData.value.filter((siswa) => !siswaTerdaftar.has(siswa.siswa_id))
      }
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 2000,
         });
      }
      console.log(error);
   } finally {
      isLoading.value = false;
   }
};

const valueStatusDokumenValid = (total: number) => {
   // console.log(total)
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

const statusDokumen = [
   { value: true, label: "Dokumen Sudah Lengkap" },
   { value: false, label: "Dokumen Belum Lengkap" },
];

const statusWilayah = [
   { value: true, label: "Wilayah Sudah Lengkap" },
   { value: false, label: "Wilayah Belum Lengkap" },
];

const statusDaftar = [
   { value: true, label: "Dibatalkan" },
   { value: false, label: "Belum Terdaftar" },
];

const dokumenValidationStatus = [
   { value: true, label: "Dokumen Sudah Valid" },
   { value: false, label: "Dokumen Belum Valid" },
];

const op = ref();
const activeRowData = ref()
// const activeRowId = ref()
const isPopoverVisible = ref(false);
const showPopover = (event: Event, data: SiswaWithStatus) => {
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

// const onShow = () => {
//    isPopoverVisible.value = true;
// };

// const onHide = () => {
   
// };

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
            <Dialog
               v-model:visible="isLoading"
               modal
               header="Pendaftaran Sedang di Proses"
               :style="{ width: '25rem' }">
               <ProgressBar
                  mode="indeterminate"
                  style="height: 6px"></ProgressBar>
            </Dialog>
            <div class="flex justify-end">
               <Button
                  class="w-[18%]"
                  label="Daftarkan Siswa Valid"
                  :disabled="!jadwalPendaftaran"
                  severity="success"
                  icon="pi pi-plus-circle"
                  @click="confirmRegisterSiswa"></Button>
            </div>
            <PendaftaranTable
               :data="siswaData ? siswaData : []"
               :filters="filters"
               :meta="metaData"
               :header="`Daftar Siswa Belum Terdaftar ${sekolahNama}`"
               :showToolbar="true"
               showActionButton
               @onFiltering="onFilters"
               @onPageChange="onPageChange">
               <template #toolbar-start>
                  <div class="flex gap-2">
                     <Select
                        v-model="filters.isDokumenFull.value"
                        @change="onStatusChange"
                        :options="statusDokumen"
                        show-clear
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Status Dokumen" />
                     <Select
                        v-model="filters.isWilayahFull.value"
                        @change="onStatusChange"
                        :options="statusWilayah"
                        show-clear
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Status Wilayah" />
                     <Select
                        v-model="filters.statusDaftar.value"
                        @change="onStatusChange"
                        :options="statusDaftar"
                        show-clear
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Status Daftar" />
                     <Select
                        v-model="filters.statusDokumen.value"
                        @change="onStatusChange"
                        :options="dokumenValidationStatus"
                        show-clear
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Status Validasi Dokumen" />
                  </div>
               </template>

               <template #toolbar-end>
                  <Button
                     label="Reset Filter"
                     icon="pi pi-filter"
                     severity="secondary"
                     @click="onClearFilters" />
               </template>

               <template #custom-columns>
                  <Column header="Status" style="width: 20%">
                     <template #body="{ data }">
                        <div class="flex flex-col gap-1">
                           <Tag
                              class="w-[85%]"
                              :value="
                                 data.isWilayahFull
                                    ? 'Data Wilayah Lengkap'
                                    : 'Data Wilayah Belum Lengkap'
                              "
                              :severity="
                                 data.isWilayahFull ? 'success' : 'danger'
                              " />
                           <Tag
                              class="w-[80%]"
                              :value="
                                 data.isDokumenFull
                                    ? 'Dokumen Lengkap'
                                    : 'Dokumen Belum Lengkap'
                              "
                              :severity="
                                 data.isDokumenFull ? 'success' : 'danger'
                              " />
                           <Tag
                              class="w-[80%]"
                              :value="valueStatusDokumenValid(data.totalDokumenValid)"
                              :severity="
                                 severityStatusDokumenValid(data.totalDokumenValid)
                              " />
                           <Tag
                              class="w-[65%]"
                              :value="
                                 data.statusDaftar === 'DIBATALKAN'
                                    ? 'Dibatalkan'
                                    : 'Belum Terdaftar'
                              "
                              :severity="
                                 data.statusDaftar === 'DIBATALKAN'
                                    ? 'warn'
                                    : 'danger'
                              " />
                        </div>
                     </template>
                  </Column>
               </template>

               <template #action-buttons="{ data }">
                  <div class="flex flex-col gap-2 min-w-[200px] min-h-[100px]">
                     <Button
                        v-if="jadwalVerifikasi"
                        type="button"
                        severity="info"
                        label="Cek Data Siswa"
                        :icon="activeRowData?.siswa_id === data.siswa_id &&
                           isPopoverVisible
                              ? 'pi pi-angle-down'
                              : 'pi pi-angle-right'
                        "
                        @click="showPopover($event, data)"
                        class="w-[70%]" />
                     <Button 
                        v-if="data.isWilayahFull 
                        && data.isDokumenFull
                        && data.isAllDokumenValid
                        && jadwalPendaftaran" 
                        type="button" 
                        severity="success" 
                        label="Daftarkan Siswa"
                        icon="pi pi-plus-circle" 
                        @click="onRegisterSiswa(data)"
                        class="w-[70%]" />
                    </div>
                </template>
            </PendaftaranTable>
            <Popover ref="op">
               <div class="flex flex-col gap-2" v-if="activeRowData">
                  <Button
                     label="Edit Biodata Siswa"
                     icon="pi pi-pencil"
                     severity="info"
                     as="router-link"
                     :to="{
                        name: 'Biodata-Siswa-Dinamis',
                        params: { id: activeRowData.siswa_id }
                     }" />
                  <Button
                     label="Cek Dokumen Siswa"
                     class="grow"
                     icon="pi pi-file"
                     as="router-link"
                     severity="info"
                     :to="{
                        name: 'Dokumen-Siswa-Dinamis',
                        params: { id: activeRowData.siswa_id },
                     }" />
               </div>
            </Popover>
         </div>
      </div>
   </div>
</template>
