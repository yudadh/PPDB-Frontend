<script setup lang="ts">
import FormDialog from '@/components/forms/FormDialog.vue';
import type { Field, SubmitEventForm } from '@/interfaces/layoutInterface';
import type { CreateJadwal, JadwalDTO, TahapanDTO } from '@/interfaces/periodeInterface';
import { closeOrOpenJadwal, createJadwal, deleteJadwalById, getAllTahapan, getJadwalByPeriodeJalurId, updateJadwalById } from '@/services/periodeService';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useConfirm, useToast } from 'primevue';
import { onMounted, reactive, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const periodeJalurId = Number(route.params.id)

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const jadwals = ref<JadwalDTO[]>([])
const meta = reactive({
    total: 0,
    limit: 10,
    page: 1
})
const tahapanOptions = ref<TahapanDTO[]>([])
onMounted(async() => {
    await getJadwals()
    await getTahapans()
})

async function getJadwals() {
    try {
        const response = await getJadwalByPeriodeJalurId(periodeJalurId)
        jadwals.value = response
    } catch (error) {
        if(error instanceof Error) {
            toast.add({
                severity: 'error',
                summary: 'Gagal',
                detail: error.message,
                life: 2000
            })
        }
    }
}

async function getTahapans() {
    try {
        const response = await getAllTahapan()
        tahapanOptions.value = response
    } catch (error) {
        if(error instanceof Error) {
            console.log(error)
        }
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

const createModalVisibility = ref(false)
const editModalVisbility = ref(false)

interface FormInitialValues {
    tahapan_id: number
    waktu_mulai: Date | null
    waktu_selesai: Date | null
}

const createFormInitialValues = reactive<FormInitialValues>({
    tahapan_id: 0,
    waktu_mulai: null,
    waktu_selesai: null,
    // testing: '',
})

const editFormInitialValues = reactive<FormInitialValues>({
    tahapan_id: 0,
    waktu_mulai: null,
    waktu_selesai: null
})

const formResolver = zodResolver(
    z.object({
        tahapan_id: z.number().int().positive("pilih tahapan"),
        waktu_mulai: z.date({ message: "waktu mulai harus diisi" }),
        waktu_selesai: z.date({ message: "waktu selesai harus diisi" }),
    })
    .refine((data) => data.waktu_mulai < data.waktu_selesai, {
        message: 'waktu mulai lebih akhir dari waktu selesai',
        path: ['waktu_mulai']
    })
    .refine((data) => data.waktu_mulai < data.waktu_selesai, {
        message: 'waktu selesai lebih awal dari waktu mulai',
        path: ['waktu_selesai']
    })
    .transform((data) => {

        const mulai = new Date(data.waktu_mulai)
        const selesai = new Date(data.waktu_selesai)

        mulai.setSeconds(0, 0)
        selesai.setSeconds(0, 0)
        
        return {
            ...data,
            waktu_mulai: mulai.toISOString(),
            waktu_selesai: selesai.toISOString()
        }
    })
    
)

const createFormFields = ref<Field[]>([])

watchEffect(() => {
    createFormFields.value = [
        { name: 'tahapan_id', label: 'Tahapan', type: 'select', 
        attrs: { options: tahapanOptions.value, optionValue: 'tahapan_id', optionLabel: 'tahapan_nama', placeholder: 'Pilih Tahapan' } },
        { name: 'waktu_mulai', label: 'Waktu Mulai', type: 'date', attrs: { showIcon: true, showTime: true, hourFormat: '24', showButtonBar: true } },
        { name: 'waktu_selesai', label: 'Waktu Selesai', type: 'date', attrs: { showIcon: true, showTime: true, hourFormat: '24', showButtonBar: true } },
        // { name: 'testing', label: 'testing', type: 'text', attrs: { placeholder: 'masukkan angka' }}
    ]
})

const editFormFields = ref<Field[]>([])

watchEffect(() => {
    editFormFields.value = [
        { name: 'tahapan_id', label: 'Tahapan', type: 'select', 
        attrs: { options: tahapanOptions.value, optionValue: 'tahapan_id', optionLabel: 'tahapan_nama', placeholder: 'Pilih Tahapan' } },
        { name: 'waktu_mulai', label: 'Waktu Mulai', type: 'date', attrs: { showIcon: true, showTime: true, hourFormat: '24', showButtonBar: true } },
        { name: 'waktu_selesai', label: 'Waktu Selesai', type: 'date', attrs: { showIcon: true, showTime: true, hourFormat: '24', showButtonBar: true } }
    ]
})

async function onSubmitCreateForm(form: SubmitEventForm) {
    if(form.valid) {
        console.log(form.values.waktu_mulai)
        console.log(form.values.waktu_selesai)
        try {
            const data: CreateJadwal = {
                periode_jalur_id: periodeJalurId,
                tahapan_id: form.values.tahapan_id,
                waktu_mulai: form.values.waktu_mulai,
                waktu_selesai: form.values.waktu_selesai
            }
            const response = await createJadwal(data)
            if(response) {
                toast.add({
                    severity: 'success',
                    summary: 'Berhasil',
                    detail: 'Jadwal berhasil dibuat',
                    life: 2000
                })
                jadwals.value.push(response)
            }
        } catch (error) {
            if(error instanceof Error) {
                toast.add({
                    severity: 'error',
                    summary: 'Gagal',
                    detail: error.message,
                    life: 2000
                })
            }
        } finally {
            createModalVisibility.value = false
        }
    }
}

const currentJadwalId = ref()
async function onSubmitEditForm(form: SubmitEventForm) {
    if(form.valid) {
        try {
            console.log(form.values)
            const data: CreateJadwal = {
                periode_jalur_id: periodeJalurId,
                tahapan_id: form.values.tahapan_id,
                waktu_mulai: form.values.waktu_mulai,
                waktu_selesai: form.values.waktu_selesai
            }
            const response = await updateJadwalById(
                currentJadwalId.value, 
                data
            )
            if(response) {
                toast.add({
                    severity: 'success',
                    summary: 'Berhasil',
                    detail: 'Jadwal berhasil diupdate',
                    life: 2000
                })
                const editedJadwal = jadwals.value.find((j) => j.jadwal_id === response.jadwal_id)
                if(editedJadwal) {
                    Object.assign(editedJadwal, response)
                }
            }
        } catch (error) {
            if(error instanceof Error) {
                toast.add({
                    severity: 'error',
                    summary: 'Gagal',
                    detail: error.message,
                    life: 2000
                })
            }
        } finally {
            editModalVisbility.value = false
        }
    }
}

function onOpenEditModal (data: JadwalDTO) {
    currentJadwalId.value = data.jadwal_id
    editFormInitialValues.tahapan_id = data.tahapan_id
    editFormInitialValues.waktu_mulai = new Date(data.waktu_mulai)
    editFormInitialValues.waktu_selesai = new Date(data.waktu_selesai)
    editModalVisbility.value = true
}

function onDeleteJadwal (data: JadwalDTO) {
    confirm.require({
        message: `Anda yakin ingin menghapus jadwal ${data.tahapan_nama}?`,
        header: 'Konfirmasi',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Batal',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Hapus',
            severity: 'danger'
        },
        accept: async () => {
            try {
                const response = await deleteJadwalById(data.jadwal_id)
                if(response) {
                    toast.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'Jadwal berhasil dihapus',
                        life: 2000
                    })
                    jadwals.value = jadwals.value.filter((j) => j.jadwal_id !== response.jadwal_id)
                }
            } catch (error) {
                if(error instanceof Error) {
                    toast.add({
                        severity: 'error',
                        summary: 'Gagal',
                        detail: error.message,
                        life: 2000
                    })
                }
            }
        },
        reject: () => {
            
        }
    });
}

function confirmCloseOpenJadwal (
    message: string,
    acceptLabel: string,
    acceptSeverity: string,
    jadwal_id: number,
    is_closed: number
) {
    confirm.require({
        message: message,
        header: 'Konfirmasi',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Batal',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: acceptLabel,
            severity: acceptSeverity
        },
        accept: async () => {
            try {
                const data = is_closed === 0 ? 1 : 0
                const response = await closeOrOpenJadwal(jadwal_id, data)
                if(response) {
                    console.log(response)
                    const detailMsg = response.is_closed === 0 ? 'Jadwal berhasil dibuka' : 'Jadwal berhasil ditutup'
                    toast.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: detailMsg,
                        life: 2000
                    })
                    const editedJadwal = jadwals.value.find((j) => j.jadwal_id === response.jadwal_id)
                    if(editedJadwal) {
                        Object.assign(editedJadwal, response)
                    }
                }
            } catch (error) {
                if(error instanceof Error) {
                    toast.add({
                        severity: 'error',
                        summary: 'Gagal',
                        detail: error.message,
                        life: 2000
                    })
                }
            }
        },
        reject: () => {
            
        }
    });
}

function updateIsClosedJadwal (data: JadwalDTO) {
    const message = data.is_closed === 0 ? `Anda yakin ingin menutup jadwal ${data.tahapan_nama}?` : `Anda yakin ingin membuka jadwal ${data.tahapan_nama}?`
    const acceptLabel = data.is_closed === 0 ? 'Tutup' : 'Buka'
    const acceptSeverity = data.is_closed === 0 ? 'danger' : 'success'
    confirmCloseOpenJadwal(message, acceptLabel, acceptSeverity, data.jadwal_id, data.is_closed)
}

</script>


<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <Button 
                        label="Kembali" 
                        severity="danger" 
                        @click="goBack" 
                        icon="pi pi-fw pi-arrow-left" 
                        class="w-[10%] leading-5" 
                        :fluid="false">
                    </Button>
                    <div class="text-xl font-bold">Manajemen Jadwal</div>
                    <DataTable :value="jadwals" paginator :first="(meta.page - 1) * meta.limit" 
                    :totalRecords="meta.total" :rows="meta.limit" :rowsPerPageOptions="[5, 10, 20]" 
                    tableStyle="min-width: 50rem" >
                        <template #header>
                            <div class="flex justify-between">
                                <div class="text-xl">
                                    Daftar Jadwal
                                </div>
                                <Button label="Tambah Jadwal" severity="success" icon="pi pi-plus" @click="createModalVisibility = true"></Button>
                            </div>
                        </template>
                        <Column header="No" style="width: 10%">
                            <template #body="{ index }">
                                {{ (meta.page - 1) * meta.limit + index + 1 }}
                            </template>
                        </Column>
                        <Column field="tahapan_nama" header="Tahapan" style="width: 20%"></Column>
                        <Column header="Waktu Mulai" style="width: 20%">
                            <template #body="{ data }">
                                <Badge size="large" severity="contrast">{{ setTime(data.waktu_mulai) }}</Badge>
                                <!-- <Tag class="text-2xl">{{ setTime(data.waktu_mulai) }}</Tag> -->
                            </template>
                        </Column>
                        <Column header="Waktu Selesai" style="width: 20%">
                            <template #body="{ data }">
                                <Badge size="large" severity="contrast">{{ setTime(data.waktu_selesai) }}</Badge>
                            </template>
                        </Column>
                        <Column style="width: 20%;">
                            <template #body="{ data }">
                                <div class="flex gap-2">
                                    <div class="flex gap-1">
                                        <Button v-tooltip.bottom="{ value: 'Edit Jadwal', showDelay: 500, hideDelay: 300 }"
                                         icon="pi pi-pencil" severity="info" @click="onOpenEditModal(data)"></Button>
                                        <Button v-tooltip.bottom="{ value: 'Hapus Jadwal', showDelay: 500, hideDelay: 300 }"
                                         icon="pi pi-trash" severity="danger" @click="onDeleteJadwal(data)"></Button>
                                    </div>
                                    <Button :severity="data.is_closed === 0 ? 'danger' : 'success'"
                                    :label="data.is_closed === 0 ? 'Tutup Jadwal' : 'Buka Jadwal'"
                                    :icon="data.is_closed === 0 ? 'pi pi-lock' : 'pi pi-lock-open'"
                                    @click="updateIsClosedJadwal(data)">
                                    </Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <FormDialog :visible="createModalVisibility" title="Tambah Jadwal" @after-hide="createModalVisibility = false"
                    :initialValues="createFormInitialValues" :formResolver="formResolver" :fields="createFormFields"
                    @submit="onSubmitCreateForm" @close="createModalVisibility = false"></FormDialog>
                    <FormDialog :visible="editModalVisbility" title="Edit Jadwal" @after-hide="editModalVisbility = false" 
                    :initialValues="editFormInitialValues" :formResolver="formResolver" :fields="editFormFields" 
                    @submit="onSubmitEditForm" @close="editModalVisbility = false"></FormDialog>
                </div>
            </div>
        </div>
    </div>
</template>