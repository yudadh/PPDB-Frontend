<script setup lang="ts">
import type { SiswaWithStatus } from '@/interfaces/siswaInterface';
import type { PaginationMeta } from '@/interfaces/layoutInterface';
import { type DataTableFilterEvent, type DataTablePageEvent } from 'primevue';
import { ref, computed, watch } from 'vue';
import type { PendaftaranSDResponse } from '@/interfaces/pendaftaranInterface';

const props = defineProps<{
    data: SiswaWithStatus[] | PendaftaranSDResponse[]
    meta: PaginationMeta
    header: string
    filters: any
    // isTerdaftar: boolean 
}>()


const isSiswaTerdaftar = computed(() => {
    return Array.isArray(props.data) && props.data.length > 0 && 'pendaftaran_id' in props.data[0];
});

const filters = ref(props.filters)
const emit = defineEmits(['page', 'filter', 'filterStatus', 'clearFilter', 'verifyRegis'])
const keteranganVisibility = ref(false)

const onPageChange = (event: DataTablePageEvent) => {
    // console.log('page changed')
    emit('page', event)
}

const onFiltering = (event: DataTableFilterEvent) => {
    emit('filter', event)
}

const onStatusChange = () => {
    emit('filterStatus', props.meta)
}

const onClearFilter = () => {
    emit('clearFilter')
}

watch(() => props.filters, (newFilters) => {
  console.log("Filters berubah:", newFilters);
  filters.value = newFilters
}, { deep: true });

const statusDokumen = [
    {value: true, label: 'Dokumen Sudah Lengkap'}, 
    {value: false, label: 'Dokumen Belum Lengkap'}
]

const statusWilayah = [
    {value: true, label: 'Wilayah Sudah Lengkap'}, 
    {value: false, label: 'Wilayah Belum Lengkap'}
]

const statusDaftar = [
    {value: true, label: 'Dibatalkan'}, 
    {value: false, label: 'Belum Terdaftar'}
]

// const statusPendaftaran = [
//     {value: 'BELUM_VERIF', label: 'Belum Diverifikasi'}, 
//     {value: 'VERIF_SD', label: 'Diverifikasi Admin SD'},
//     {value: 'VERIF_SMP', label: 'Diverifikasi Admin SMP'}
// ]

// const statusKelulusan = [
//     {value: 'PENDAFTARAN', label: 'Belum Lulus'}, 
//     {value: 'LULUS', label: 'Lulus'},
//     {value: 'TIDAK_LULUS', label: 'Tidak Lulus'}
// ]

// const severityClassOfStatus = (data: string) => {
//     if(data === 'BELUM_VERIF') {
//         return 'danger'
//     }else if(data === 'VERIF_SD') {
//         return 'warn'
//     }else if(data === 'VERIF_SMP') {
//         return 'success'
//     }else {
//         return 'contrast'
//     }
// }

// const valueOfStatus = (data: string) => {
//     if(data === 'BELUM_VERIF') {
//         return 'Belum Diverifikasi'
//     }else if(data === 'VERIF_SD') {
//         return 'Diverifikasi Admin SD'
//     }else if(data === 'VERIF_SMP') {
//         return 'Diverifikasi Admin SMP'
//     }else {
//         return 'Tidak Terdefinisi'
//     }
// }

// const severityClassOfStatusKelulusan = (data: string) => {
//     if(data === 'PENDAFTARAN') {
//         return 'info'
//     }else if(data === 'LULUS') {
//         return 'success'
//     }else if(data === 'TIDAK_LULUS') {
//         return 'danger'
//     }else {
//         return 'contrast'
//     }
// }

// const valueOfStatusKelulusan = (data: string) => {
//     if(data === 'PENDAFTARAN') {
//         return 'Belum Lulus'
//     }else if(data === 'LULUS') {
//         return 'Lulus'
//     }else if(data === 'TIDAK_LULUS') {
//         return 'Tidak Lulus'
//     }else {
//         return 'contrast'
//     }
// }

const onVerify = (data: PendaftaranSDResponse) => {
    emit('verifyRegis', data)
}

const op = ref()
const isPopoverVisible = ref(false);
const toggle = (event: Event) => {
    op.value.toggle(event);
}

const onShow = () => {
    isPopoverVisible.value = true;
};

const onHide = () => {
    isPopoverVisible.value = false;
};

</script>

<template>
    <div v-if="isSiswaTerdaftar">
        <DataTable :value="data" v-model:filters="filters" paginator :first="(props.meta.page - 1) * props.meta.limit" 
        :totalRecords="props.meta.total" :rows="props.meta.limit" :lazy="true" :rowsPerPageOptions="[5, 10, 15, 20]" 
        filterDisplay="row" :globalFilterFields="['nama']" @filter="onFiltering" tableStyle="min-width: 50rem" @page="onPageChange">
            <template #empty> No siswa found. </template>
            <template #loading> Loading siswa data. Please wait. </template>
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xl font-bold"> {{ header }} </span>
                </div>
            </template>
                <Column header="No" style="width: 10%">
                    <template #body="{ index }">
                        {{ (props.meta.page - 1) * props.meta.limit + index + 1 }}
                    </template>
                </Column>
                <Column field="nisn" header="NISN" style="width: 12%" :showFilterMenu="false">
                    <template #body="{ data }">
                        {{ data.nisn }}
                     </template>
                     <template #filter="{ filterModel, filterCallback }">
                        <InputText v-model="filterModel.value" style="width: 100%" type="text" @input="filterCallback()" 
                        placeholder="Search by nisn" />
                    </template>
                </Column>
                <Column field="nama" header="Nama" style="width: 12%" :showFilterMenu="false">
                    <template #body="{ data }">
                        {{ data.nama }}
                     </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText v-model="filterModel.value" style="width: 100%" type="text" @input="filterCallback()" 
                        placeholder="Search by name" />
                    </template>
                </Column>
                <Column field="sekolah_nama" header="Sekolah Tujuan" style="width: 15%" :showFilterMenu="false">
                    <template #body="{ data }">
                        {{ data.sekolah_nama }}
                    </template>
                    <!-- <template #filter="{ filterModel, filterCallback }">
                        <InputText v-model="filterModel.value" type="text" @input="filterCallback()" 
                        placeholder="Search by name" />
                    </template> -->
                </Column>
                <Column header="Status" style="width: 15%" :showFilterMenu="false">
                    <template #body="{ data }">
                        <div class="flex flex-col gap-1">
                            <Tag class="w-[65%]" :value="data.isAllDokumenValid ? 'Semua Dokumen Valid' : 'Dokumen Belum Valid'" 
                            :severity="data.isAllDokumenValid ? 'success' : 'danger'" />
                        </div>
                    </template>
                </Column>
                <Column style="width: 18%">
                    <template #body="{ data }">
                         <div class="flex flex-col gap-2">
                             <div class="flex gap-1">
                                <Button type="button" severity="info" label="Cek Data" :icon=" isPopoverVisible ? 'pi pi-angle-down' : 'pi pi-angle-right' " @click="toggle" class="grow" />
                                <Popover ref="op" @show="onShow" @hide="onHide">
                                    <div class="flex flex-col gap-2">
                                        <Button label="Cek Biodata Siswa" class="grow" icon="pi pi-pencil" as="router-link" severity="info" :to="{name: 'Biodata-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                                        <Button label="Cek Dokumen Siswa" class="grow" icon="pi pi-file" as="router-link" severity="info" :to="{name: 'Dokumen-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                                    </div>
                                </Popover>
                                <!-- <Button label="" icon="pi pi-envelope" severity="info" @click="onVerify(data)"></Button> -->
                                <OverlayBadge severity="danger" :value="data.keterangan ? '1' : '0'">
                                    <Button label="" v-tooltip.top="{ value: 'Keterangan', showDelay: 500, hideDelay: 300 }" icon="pi pi-envelope" severity="info" @click="keteranganVisibility = true"></Button>
                                </OverlayBadge>
                             </div>
                             <Button label="Verifikasi Pendaftaran" icon="pi pi-check" @click="onVerify(data)"></Button>
                         </div>
                         <Dialog v-model:visible="keteranganVisibility" maximizable modal header="Keterangan" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                             <p class="m-0"> {{ data.keterangan }} </p>
                         </Dialog>
                    </template>
                </Column>
            </DataTable>
    </div>
    <div v-else>
        <div class="mb-4 mt-4">
            <Toolbar style="border-radius: 0.5rem; padding: 1rem 1rem 1rem 1.5rem; margin: 0;">
                <template #start>
                    <div class="flex gap-2">
                        <Select v-model="filters.isDokumenFull.value" showClear :options="statusDokumen" optionLabel="label" optionValue="value" placeholder="Filter Status Dokumen" class="w-full md:w-56" @change="onStatusChange" />
                        <Select v-model="filters.isWilayahFull.value" showClear :options="statusWilayah" optionLabel="label" optionValue="value" placeholder="Filter Status Wilayah" class="w-full md:w-56" @change="onStatusChange" />
                        <Select v-model="filters.statusDaftar.value" showClear :options="statusDaftar" optionLabel="label" optionValue="value" placeholder="Filter Status Daftar" class="w-full md:w-56" @change="onStatusChange" />
                    </div>
                </template>
                <template #end>
                    <Button label="Reset Filter" icon="pi pi-filter" severity="secondary" @click="onClearFilter"></Button>
                </template>
            </Toolbar>
        </div>
        <DataTable :value="data" v-model:filters="filters" paginator :first="(props.meta.page - 1) * props.meta.limit" 
        :totalRecords="props.meta.total" :rows="props.meta.limit" :lazy="true" :rowsPerPageOptions="[5, 10, 15, 20]" 
        filterDisplay="row" :globalFilterFields="['nama']" @filter="onFiltering" tableStyle="min-width: 50rem" @page="onPageChange">
            <template #empty> No siswa found. </template>
            <template #loading> Loading siswa data. Please wait. </template>
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xl font-bold"> {{ header }} </span>
                </div>
            </template>
                <Column header="No" style="width: 10%">
                    <template #body="{ index }">
                        {{ (props.meta.page - 1) * props.meta.limit + index + 1 }}
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
                <Column header="Status" style="width: 20%" :showFilterMenu="false">
                    <template #body="{ data }">
                        <div class="flex flex-col gap-1">
                            <Tag class="w-[85%]" :value="data.isWilayahFull ? 'Data Wilayah Lengkap' : 'Data Wilayah Belum Lengkap'" :severity="data.isWilayahFull ? 'success' : 'danger'" />
                            <Tag class="w-[80%]" :value="data.isDokumenFull ? 'Dokumen Lengkap' : 'Dokumen Belum Lengkap'" :severity="data.isDokumenFull ? 'success' : 'danger'" />
                            <Tag class="w-[65%]" :value="data.statusDaftar === 'DIBATALKAN' ? 'Dibatalkan' : 'Belum Terdaftar'" :severity="data.statusDaftar === 'DIBATALKAN' ? 'warn' : 'danger'" />
                        </div>
                     </template>
                </Column>
                <Column style="width: 20%">
                    <template #body="{ data }">
                        <div class="flex gap-4">
                            <Button label="Edit Biodata Siswa" icon="pi pi-pencil" as="router-link" severity="info" :to="{name: 'Biodata-Siswa-Dinamis', params: {id: data.siswa_id}}"></Button>
                        </div>
                    </template>
                </Column>
        </DataTable>
    </div>
</template>