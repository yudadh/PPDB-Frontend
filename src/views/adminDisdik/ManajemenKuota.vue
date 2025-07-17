<script lang="ts" setup>
  import { onMounted, reactive, ref, watchEffect } from 'vue';
  // import Papa from 'papaparse';
  import axios from 'axios';
  import type { FileUploadUploaderEvent } from 'primevue/fileupload';
  import Button from 'primevue/button';
  import DataTable, { type DataTableFilterEvent, type DataTablePageEvent } from 'primevue/datatable';
  import Column from 'primevue/column';
  import { getKuotaSekolahByPeriodeId, getTemplateKuotaSekolah, submitKuotaSekolah, updateKuotaSekolahById, updateKuotaSekolahBySekolahId } from '@/services/sekolahService';
import { useToast } from 'primevue';
import { useRouter } from 'vue-router';
import type { CSVRow, KuotaSekolahDTO, KuotaSekolahEntry } from '@/interfaces/sekolahInterface';
import type { Field, PaginationMeta, SubmitEventForm } from '@/interfaces/layoutInterface';
import { usePendaftaranStore } from '@/store/pendaftaranStore';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { FilterMatchMode } from "@primevue/core/api";
import { debounce } from 'lodash';

  const toast = useToast()
  const router = useRouter()
  const pendaftaranStore = usePendaftaranStore()
  const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
  };
  
  // Refs
  const kuotaSekolahData = ref<KuotaSekolahDTO[]>([])
  const metaData = reactive<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0
  })
  const periodeId = ref<number>(0)
  const expandedRows = ref({})
  const previewData = ref<CSVRow[]>([]);
  const message = ref<string>('');
  const addKuotaDialogVisibility = ref(false)
  const updateKuotaDialogVisibility = ref(false)
  const updateKuotaBySekolahIdDialogVisibility = ref(false)
  const isLoading = ref(false)
  const previewDataVisibility = ref(false)
  const filters = ref()
  const columns = [
    { field: 'Nama Sekolah', header: 'Nama Sekolah' },
    { field: 'Jenis Kuota', header: 'Jenis Kuota' },
    { field: 'Nama Periode', header: 'Nama Periode' },
    { field: 'Kuota', header: 'Kuota' },
    { field: 'Kuota Old', header: 'Kuota Old' },
  ];

  const getKuotaSekolahData = async (page: number, limit: number, filters: any) => {
    try {
      const response = await getKuotaSekolahByPeriodeId(
        periodeId.value, 
        page, 
        limit,
        JSON.stringify(filters)
      )
      kuotaSekolahData.value = response.data
      metaData.limit = response.meta.limit
      metaData.page = response.meta.page
      metaData.total = response.meta.total
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

  const initFilters = () => {
    filters.value = {
      npsn: { value: null, matchMode: FilterMatchMode.CONTAINS },
      nama: { value: null, matchMode: FilterMatchMode.CONTAINS },
    }
  }

  initFilters()
  
  onMounted( async() => {
    
    if (!pendaftaranStore.periode_id) {
      await pendaftaranStore.loadPeriodeAndPeriodeJalur()
    }

    periodeId.value = pendaftaranStore.periode_id ? pendaftaranStore.periode_id : 0
    await getKuotaSekolahData(metaData.page, metaData.limit, filters.value)
    console.log(kuotaSekolahData.value)
    console.log(metaData)
  })

  const onFilters = debounce(async (event: DataTableFilterEvent) => {
   filters.value = {
      ...filters.value,
      ...event.filters,
   };
   await getKuotaSekolahData(metaData.page, metaData.limit, filters.value)
  }, 500);

  async function onPageChange(event: DataTablePageEvent) {
    metaData.page = event.page
    metaData.limit = event.rows
    await getKuotaSekolahData(metaData.page + 1, metaData.limit, filters.value)
  }

  const downloadTemplateFromApi = async () => {
    try {
      const response = await getTemplateKuotaSekolah(1)
      if (response) {
        toast.add({
          severity: 'success',
          summary: 'Berhasil',
          detail: 'Template berhasil di download',
          life: 2000
        })
        const blob = response
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_kuota_sekolah.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.add({
          severity: 'error',
          summary: 'Gagal',
          detail: error.message,
          life: 2000
        })
      }
    }
  }

  const onOpenAddKuotaDialog = () => {
    addKuotaDialogVisibility.value = true
  }

  const successCount = ref<number>(0)
  const failCount = ref<number>(0)
  const failedRows = ref<CSVRow[]>([])
  const responseStatusVisibility = ref(false)
  const handleUpload = async (event: FileUploadUploaderEvent) => {
    const files = Array.isArray(event.files) ? event.files : [event.files]
    console.log(files[0])
    try {
      addKuotaDialogVisibility.value = false
      isLoading.value = true
      const response = await submitKuotaSekolah(files[0])
      isLoading.value = false
      if (response) {
        toast.add({ 
          severity: 'success', 
          summary: 'Sukses', 
          detail: 'File kuota sekolah berhasil diupload', 
          life: 3000 
        })
        responseStatusVisibility.value = true
        successCount.value = response.successCount
        failCount.value = response.failCount
        failedRows.value = response.failedRows
        setTimeout(() => {
          router.replace({ path: router.currentRoute.value.fullPath })
        }, 3000)
      }
      
    } catch (error) {
      console.log(error)
      isLoading.value = false
      if (error instanceof Error) {
          toast.add({ 
            severity: 'error', 
            summary: 'Gagal', 
            detail: error.message, 
            life: 3000 
          })
      } else {
          toast.add({ 
            severity: 'error', 
            summary: 'Gagal', 
            detail: "Terjadi error yang tidak diketahui", 
            life: 3000 
          })
      }
    }
  }

  const jenisKuota = ref<string>('')
  const kuotaSekolahId = ref<number>(0)
  const currentKuota = ref<KuotaSekolahDTO>()
  const currentKuotaSekolah = ref(new Map<string, KuotaSekolahEntry>())

  const updateFormInitialValue = reactive({
    kuota: "0",
  })

  const updateFormResolver = zodResolver(
    z.object({
      kuota: z.string().regex(/^[\d]+$/, 'kuota harus diisi')
      .transform((val: string) => Number(val))
    })
  )

  const updateFormFields = ref<Field[]>([])

  watchEffect(() => {
    updateFormFields.value = [
        { name: 'kuota', label: `${jenisKuota.value.replace(/_/g, ' ')}`, type: 'text', 
        attrs: { type: 'number', placeholder: 'Masukkan Kuota' } }
    ]
  })

  const updateBySekolahIdFormInitialValue = reactive({
    kuota_akumulasi_rapor: "0",
    kuota_prestasi_sains: "0",
    kuota_prestasi_olahraga: "0",
    kuota_prestasi_senibudaya: "0",
    kuota_afirmasi: "0",
    kuota_perpindahan: "0",
    kuota_zonasi: "0",
  })

  const updateBySekolahIdFormResolver = zodResolver(
    z.object({
      kuota_akumulasi_rapor: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val)),
      kuota_prestasi_sains: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val)),
      kuota_prestasi_olahraga: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val)),
      kuota_prestasi_senibudaya: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val)),
      kuota_afirmasi: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val)),
      kuota_perpindahan: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val)),
      kuota_zonasi: z.string().regex(/^[\d]+$/, 'Field kuota hanya menerima angka')
      .transform((val: string) => Number(val))
    })
  )

  const updateBySekolahIdFormFields = ref<Field[]>([])

  watchEffect(() => {
    // console.log(currentKuota.value)
    console.log(currentKuotaSekolah.value.get('kuota_akumulasi_rapor'))
    updateBySekolahIdFormFields.value = [
        { 
          name: 'kuota_akumulasi_rapor', 
          label: `${currentKuotaSekolah.value.get('kuota_akumulasi_rapor')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
        { 
          name: 'kuota_prestasi_sains', 
          label: `${currentKuotaSekolah.value.get('kuota_prestasi_sains')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
        { 
          name: 'kuota_prestasi_olahraga', 
          label: `${currentKuotaSekolah.value.get('kuota_prestasi_olahraga')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
        { 
          name: 'kuota_prestasi_senibudaya', 
          label: `${currentKuotaSekolah.value.get('kuota_prestasi_senibudaya')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
        { 
          name: 'kuota_afirmasi', 
          label: `${currentKuotaSekolah.value.get('kuota_afirmasi')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
        { 
          name: 'kuota_perpindahan', 
          label: `${currentKuotaSekolah.value.get('kuota_perpindahan')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
        { 
          name: 'kuota_zonasi', 
          label: `${currentKuotaSekolah.value.get('kuota_zonasi')?.jenis_kuota.replace(/_/g, ' ')}`,
          type: 'text', 
          attrs: { type: 'number', placeholder: 'Masukkan Kuota' } 
        },
    ]
  })

  const onOpenUpdateDialog = (data: KuotaSekolahEntry) => {
    kuotaSekolahId.value = data.kuota_sekolah_id
    jenisKuota.value = data.jenis_kuota
    updateFormInitialValue.kuota = data.kuota.toString()
    updateKuotaDialogVisibility.value = true
  }

  const onUpdateKuotaSekolahByKuotaSekolahId = async (form: SubmitEventForm) => {
    try {
      if (!form.valid) return
      const response = await updateKuotaSekolahById(kuotaSekolahId.value, form.values.kuota)
      if (response) {
        toast.add({
          severity: 'success',
          summary: 'Berhasil',
          detail: 'Kuota berhasil diupdate',
          life: 3000
        })
        const updatedDataIndex = kuotaSekolahData.value.findIndex((ks) => ks.sekolah_id === response.sekolah_id)
        if (updatedDataIndex !== -1) {
          const kuotaIndex = kuotaSekolahData.value[updatedDataIndex].kuota_sekolah.findIndex(
            (ks) => ks.kuota_sekolah_id === response.kuota_sekolah_id)

          if (kuotaIndex !== -1) {
            kuotaSekolahData.value[updatedDataIndex].kuota_sekolah[kuotaIndex].kuota = response.kuota
          }
        }
        updateKuotaDialogVisibility.value = false
      }
    } catch (error) {
      updateKuotaDialogVisibility.value = false
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

  const setInitialValue = () => {
    updateBySekolahIdFormInitialValue.kuota_akumulasi_rapor = currentKuotaSekolah.value.get('kuota_akumulasi_rapor')!.kuota.toString()
    updateBySekolahIdFormInitialValue.kuota_prestasi_sains = currentKuotaSekolah.value.get('kuota_prestasi_sains')!.kuota.toString()
    updateBySekolahIdFormInitialValue.kuota_prestasi_olahraga = currentKuotaSekolah.value.get('kuota_prestasi_olahraga')!.kuota.toString()
    updateBySekolahIdFormInitialValue.kuota_prestasi_senibudaya = currentKuotaSekolah.value.get('kuota_prestasi_senibudaya')!.kuota.toString()
    updateBySekolahIdFormInitialValue.kuota_afirmasi = currentKuotaSekolah.value.get('kuota_afirmasi')!.kuota.toString()
    updateBySekolahIdFormInitialValue.kuota_perpindahan = currentKuotaSekolah.value.get('kuota_perpindahan')!.kuota.toString()
    updateBySekolahIdFormInitialValue.kuota_zonasi = currentKuotaSekolah.value.get('kuota_zonasi')!.kuota.toString()
  }

  const onOpenUpdateBySekolahIdDialog = (data: KuotaSekolahDTO) => {
    currentKuota.value = data
    for (const ks of data.kuota_sekolah) {
      currentKuotaSekolah.value.set(ks.jenis_kuota, ks)
    }
    // console.log(currentKuotaSekolah.get('kuota_akumulasi_rapor')!.kuota)
    setInitialValue()
    updateKuotaBySekolahIdDialogVisibility.value = true
  }

  const onUpdateKuotaSekolahBySekolahId = async (form: SubmitEventForm) => {
    // console.log(form.values)
    try {
      if (!form.valid) return
      const kuota_sekolah = Object.entries(form.values).map(([jenis_kuota, kuota]) => {
        // console.log(`${jenis_kuota}: ${kuota}`)
        const existing = currentKuotaSekolah.value.get(jenis_kuota)
        if (!existing) throw new Error(`Jenis kuota "${jenis_kuota}" tidak ditemukan di currentKuotaSekolah`);

        return {
          kuota_sekolah_id: existing.kuota_sekolah_id,
          kuota: kuota
        }
      })

      const response = await updateKuotaSekolahBySekolahId(
        currentKuota.value ? currentKuota.value.periode_id : 0,
        currentKuota.value ? currentKuota.value.sekolah_id : 0, 
        kuota_sekolah
      )
      if (response) {
        toast.add({
          severity: 'success',
          summary: 'Berhasil',
          detail: 'Kuota berhasil diupdate',
          life: 3000
        })
        const updatedDataIndex = kuotaSekolahData.value.findIndex((ks) => ks.sekolah_id === response.sekolah_id)
        const updatedKuotaMap = new Map<number, number>()
        for (const ks of response.kuota_sekolah) {
          updatedKuotaMap.set(ks.kuota_sekolah_id, ks.kuota)
        }
        if (updatedDataIndex !== -1) {
          for (const data of kuotaSekolahData.value[updatedDataIndex].kuota_sekolah) {
            const newKuota = updatedKuotaMap.get(data.kuota_sekolah_id)
            if (newKuota !== undefined) data.kuota = newKuota
          }
          // kuotaSekolahData.value[updatedDataIndex].kuota_sekolah.map((ks) => {
          //   return {
          //     ...ks,
          //     kuota: updatedKuotaMap.get(ks.kuota_sekolah_id) ?? ks.kuota
          //   }
          // })
        }
        updateKuotaBySekolahIdDialogVisibility.value = false
      }
    } catch (error) {
      setInitialValue()
      updateKuotaBySekolahIdDialogVisibility.value = false
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
  
  // Submit ke backend
  const submitData = async () => {
    try {
      const formData = new FormData();
      const blob = new Blob(
        [
          [
            'Nama Sekolah,Jenis Kuota,Nama Periode,Kuota,Kuota Old',
            ...previewData.value.map((row) =>
              `${row['Sekolah']},${row['Jenis Kuota']},${row['Periode']},${row['Kuota']} ?? ''}`
            ),
          ].join('\n'),
        ],
        { type: 'text/csv' }
      );
  
      formData.append('file', blob, 'upload.csv');
  
      const response = await axios.post('/api/kuota-sekolah/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      message.value = response.data.message;
      previewData.value = [];
    } catch (error: any) {
      message.value = error.response?.data?.message || 'Upload gagal';
    }
  };

function paginationValue() {
   if (metaData.total < metaData.limit) {
      return metaData.total
   } else if (metaData.page > 1 && (metaData.limit * metaData.page) > metaData.total) {
      return metaData.total
   } else {
      return (metaData.limit * metaData.page)
   }
}

  </script>

<template>
  <div class="flex flex-col md:flex-row gap-8">
    <Toast></Toast>
    <div class="md:w-full">
      <div class="card">
        <div class="flex flex-col gap-6">
          <Button 
              label="Kembali" 
              severity="danger" 
              @click="goBack" 
              icon="pi pi-fw pi-arrow-left" 
              class="w-[10%] leading-5" 
              :fluid="false">
          </Button>
          <div class="text-2xl font-bold">Manajemen Kuota</div>
          <!-- Tombol Download Template -->
          <!-- <div class="flex justify-end">
            <Button label="Tambah Kuota" severity="success" icon="pi pi-plus" class="w-[15%]" @click="onOpenAddKuotaDialog"></Button>
            <Button label="tes" severity="success" icon="pi pi-plus" class="w-[15%]" @click="testingStatus"></Button>
          </div> -->
          <DataTable v-model:expandedRows="expandedRows" :value="kuotaSekolahData" v-model:filters="filters" 
              dataKey="sekolah_id" paginator :first="(metaData.page - 1) * metaData.limit" 
              :totalRecords="metaData.total" :rows="metaData.limit" :lazy="true" :rowsPerPageOptions="[5, 10, 20]" 
              tableStyle="min-width: 50rem" filterDisplay="row" @filter="onFilters" @page="onPageChange">
              
              <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span class="text-xl font-bold">Daftar Kuota Sekolah</span>
                  <Button label="Tambah Kuota" severity="success" icon="pi pi-plus" class="w-[15%]" @click="onOpenAddKuotaDialog"></Button>
                </div>
              </template>

              <Column expander style="width: 5%;"></Column>
              <Column header="No" style="width: 10%">
                <template #body="{ index }">
                  {{ (metaData.page - 1) * metaData.limit + index + 1 }}
                </template>
              </Column>
              <Column field="npsn" header="NPSN" style="width: 15%" :showFilterMenu="false">
                <template #body="{ data }">
                  {{ data.npsn }}
                </template>
                <template #filter="{ filterModel, filterCallback }">
                  <InputText v-model="filterModel.value" style="width: 70%" @input="filterCallback()" type="text" placeholder="Search by npsn" />
                </template>
              </Column>

              <Column field="nama" header="Sekolah" style="width: 15%" :showFilterMenu="false">
                <template #body="{ data }">
                  {{ data.sekolah_nama}}
                </template>
                <template #filter="{ filterModel, filterCallback }">
                  <InputText v-model="filterModel.value" style="width: 70%" @input="filterCallback()"  type="text" placeholder="Search by sekolah" />
                </template>
              </Column>

              <Column style="width: 15%;">
                <template #body="{ data }">
                  <div class="flex justify-center">
                    <Button severity="warn" icon="pi pi-pencil" @click="onOpenUpdateBySekolahIdDialog(data)"></Button>
                  </div>
                </template>
              </Column>

              <template #expansion="{ data }">
                <div class="p-4">
                    <p class="text-lg font-bold">Kuota Sekolah {{ data.sekolah_nama }}</p>
                    <DataTable :value="data.kuota_sekolah">
                        <Column header="No" sortable>
                          <template #body="{ index }">
                            {{ index + 1 }}
                          </template>
                        </Column>
                        <Column field="jenis_kuota" header="Jenis Kuota" sortable>
                          <template #body="{ data }">
                            {{ data.jenis_kuota.replaceAll('_', ' ') }}
                          </template>
                        </Column>
                        <Column field="kuota" header="Jumlah Kuota" sortable></Column>
                        <Column headerStyle="width:4rem">
                            <template #body="{ data }">
                              <div class="flex justify-center">
                                <Button severity="info" icon="pi pi-pencil" @click="onOpenUpdateDialog(data)" />
                              </div>
                            </template>
                        </Column>
                      </DataTable>
                    </div>
                  </template>
                  <template #footer>
                   <div class="flex justify-center">
                        {{ paginationValue() }} of {{ metaData.total }} data
                     </div>
                  </template>

            </DataTable>

            <Dialog v-model:visible="addKuotaDialogVisibility" modal header="Tambah Kuota" :style="{ width: '35rem' }">
              <div class="flex flex-col gap-4">
                <div class="flex justify-end">
                  <Button
                    severity="warn" 
                    label="Download Template" 
                    icon="pi pi-download" 
                    @click="downloadTemplateFromApi"
                    class="w-[38%] leading-5"/>
                </div>
                <!-- Upload CSV -->
                <FileUpload
                  name="file"
                  accept=".xlsx"
                  customUpload
                  @uploader="handleUpload"
                  chooseLabel="Pilih File"
                  mode="advanced"
                  :maxFileSize="5000000">
                    <template #empty>
                      <span>Drag and drop files to here to upload.</span>
                    </template>
                </FileUpload>
              </div>

            </Dialog>
            <Dialog v-model:visible="responseStatusVisibility" modal header="Status Upload" :style="{ width: '50rem' }">
                <div class="flex flex-col gap-4">
                  <Message severity="success"> {{ successCount }} Data Berhasil </Message>
                  <Message severity="error"> {{ failCount }} Data Gagal </Message>
                  <DataTable v-if="failedRows.length > 0" :value="failedRows" class="p-datatable-sm mt-2" scrollable scrollHeight="400px">
                    <template #header>
                      <div class="text-l font-bold">Baris Gagal</div>
                    </template>
                    <Column header="No">
                      <template #body="{ index }">
                          {{ index + 1 }}
                      </template>
                    </Column>
                    <Column field="Sekolah" header="Sekolah"></Column>
                    <Column field="Jenis Kuota" header="Jenis Kuota"></Column>
                    <Column field="Kuota" header="Kuota"></Column>
                    <Column field="Periode" header="Periode"></Column>
                  </DataTable>
                </div>
            </Dialog>
            <Dialog
               v-model:visible="isLoading"
               modal
               header="Pendaftaran Sedang di Proses"
               :style="{ width: '25rem' }">
               <ProgressBar
                  mode="indeterminate"
                  style="height: 6px"></ProgressBar>
            </Dialog>

            
            <FormDialog :visible="updateKuotaDialogVisibility" title="Edit Kuota" @after-hide="updateKuotaDialogVisibility = false"
                :initialValues="updateFormInitialValue" :formResolver="updateFormResolver" :fields="updateFormFields"
                @submit="onUpdateKuotaSekolahByKuotaSekolahId" @close="updateKuotaDialogVisibility = false">
            </FormDialog>
            <FormDialog :visible="updateKuotaBySekolahIdDialogVisibility" :title="`Edit Kuota Sekolah\n ${currentKuota?.sekolah_nama}`" @after-hide="updateKuotaBySekolahIdDialogVisibility = false"
                :initialValues="updateBySekolahIdFormInitialValue" :formResolver="updateBySekolahIdFormResolver" :fields="updateBySekolahIdFormFields"
                @submit="onUpdateKuotaSekolahBySekolahId" @close="updateKuotaBySekolahIdDialogVisibility = false">
            </FormDialog>
            
          
            <!-- Preview Data CSV -->
            <Dialog v-model:visible="previewDataVisibility">
              <div class="overflow-auto">
                <DataTable :value="previewData" class="p-datatable-sm" scrollable scrollHeight="400px">
                  <Column v-for="col in columns" :key="col.field" :field="col.field" :header="col.header" />
                </DataTable>
            
                <Button
                  label="Submit Data"
                  icon="pi pi-upload"
                  class="mt-4"
                  @click="submitData"
                />
              </div>
            
              <!-- Message -->
              <div v-if="message" class="mt-4 text-green-600">
                {{ message }}
              </div>
            </Dialog>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <style scoped>
  .p-4 {
    padding: 1rem;
  }
  .mb-4 {
    margin-bottom: 1rem;
  }
  .mt-4 {
    margin-top: 1rem;
  }
  </style>
  