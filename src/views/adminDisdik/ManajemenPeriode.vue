<script setup lang="ts">
import type { SubmitEventForm } from '@/interfaces/layoutInterface';
import type { CreatePeriode, PeriodeDTO } from '@/interfaces/periodeInterface';
import { createPeriode, deletePeriodeById, getAllPeriode, updatePeriodeById } from '@/services/periodeService';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useConfirm, useToast } from 'primevue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { z } from 'zod';

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const periodeData = ref<PeriodeDTO[]>([])
const meta = reactive({
    page: 1,
    limit: 10,
    total: 0
})
const currentPeriodeId = ref<number>(0)

async function fetchPeriode(page: number, limit: number) {
    try {
        const response = await getAllPeriode(page, limit)
        if(response) {
            periodeData.value = response.data
            meta.page = response.meta.page,
            meta.limit = response.meta.limit,
            meta.total = response.meta.total
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
}

onMounted(async() => {
    await fetchPeriode(meta.page, meta.limit)
})

async function onPageChange() {
    await fetchPeriode(meta.page + 1, meta.limit)
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

const addFormVisibility = ref(false)
const editFormVisibility = ref(false)
const addFormInitialValues = reactive({
    nama_periode: '',
    waktu_mulai: null,
    waktu_selesai: null
})

const editFormInitialValues = reactive({
    nama_periode: '',
    waktu_mulai: new Date(),
    waktu_selesai: new Date()
})

const formResolver = zodResolver(
    z.object({
        nama_periode: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z0-9\s]+$/, "field hanya menerima karakter alphanumeric"),
        waktu_mulai: z.date({message: "waktu mulai harus diisi"}),
        waktu_selesai: z.date({message: "waktu selesai harus diisi"}),
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


async function onAddPeriode(form: SubmitEventForm) {
    try {
        if (!form.valid) return
        console.log(form)
        const response = await createPeriode(form.values as CreatePeriode)
        if(response) {
            toast.add({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Periode berhasil dibuat',
                life: 2000
            })
            periodeData.value.push(response)
            addFormVisibility.value = false
        }
    } catch (error) {
        addFormVisibility.value = false
        // console.log(error)
        if(error instanceof Error) {
            toast.add({
                severity: 'error',
                summary: 'Gagal',
                detail: error.message,
                life: 5000
            })
        }
    } 
}

function onOpenEditModal(data: PeriodeDTO) {
    currentPeriodeId.value = data.periode_id
    editFormInitialValues.nama_periode = data.nama_periode
    editFormInitialValues.waktu_mulai = new Date(data.waktu_mulai)
    editFormInitialValues.waktu_selesai = new Date(data.waktu_selesai)
    editFormVisibility.value = true
}

async function onUpdatePeriode(form: SubmitEventForm) {
    // console.log(form.values)
    try {
        if (!form.valid) return
        const response = await updatePeriodeById(form.values as CreatePeriode, currentPeriodeId.value)
        if(response) {
            toast.add({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Periode berhasil diupdate',
                life: 2000
            })
            const periodeEdited = periodeData.value.find(
                (p) => p.periode_id === response.periode_id
            )
            if(periodeEdited) {
                Object.assign(periodeEdited, response)
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
        editFormVisibility.value = false
    }
}

async function onDeletePeriode(data: PeriodeDTO) {
    confirm.require({
        message: `Anda yakin ingin menghapus periode ${data.nama_periode}?`,
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
                const response = await deletePeriodeById(data.periode_id)
                if(response) {
                    toast.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'Periode berhasil dihapus',
                        life: 2000
                    })
                    periodeData.value = periodeData.value.filter((p) => p.periode_id !== response.periode_id)
                }
                periodeData.value.filter((p) => p.periode_id !== response.periode_id)
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

</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <Button label="Kembali" severity="danger" @click="goBack" icon="pi pi-fw pi-arrow-left" 
                    class="w-[10%] leading-5" :fluid="false"></Button>
                    <div class="text-xl font-bold">Manajemen Periode</div>
                    <DataTable :value="periodeData" paginator :first="(meta.page - 1) * meta.limit" 
                    :totalRecords="meta.total" :rows="meta.limit" :lazy="true" :rowsPerPageOptions="[5, 10, 20]" 
                    tableStyle="min-width: 50rem" @page="onPageChange">
                        <template #header>
                            <div class="flex justify-between">
                                <div class="text-xl">
                                    Daftar Periode
                                </div>
                                <Button label="Tambah Periode" severity="success" icon="pi pi-plus" @click="addFormVisibility = true"></Button>
                            </div>
                        </template>
                        <Column header="No" style="width: 10%">
                            <template #body="{ index }">
                                {{ (meta.page - 1) * meta.limit + index + 1 }}
                            </template>
                        </Column>
                        <Column field="nama_periode" header="Periode" style="width: 25%"></Column>
                        <Column header="Waktu Mulai" style="width: 20%">
                            <template #body="{ data }">
                                <Badge size="large" severity="contrast">{{ setTime(data.waktu_mulai) }}</Badge>
                            </template>
                        </Column>
                        <Column header="Waktu Selesai" style="width: 20%">
                            <template #body="{ data }">
                                <Badge size="large" severity="contrast">{{ setTime(data.waktu_selesai) }}</Badge>
                            </template>
                        </Column>
                        <Column style="width: 20%;">
                            <template #body="{ data }">
                                <div class="flex gap-3">
                                    <div class="flex gap-1">
                                        <Button v-tooltip.bottom="{ value: 'Edit Periode', showDelay: 500, hideDelay: 300 }"
                                         icon="pi pi-pencil" severity="info" @click="onOpenEditModal(data)"></Button>
                                        <Button v-tooltip.bottom="{ value: 'Hapus Periode', showDelay: 500, hideDelay: 300 }"
                                         icon="pi pi-trash" severity="danger" @click="onDeletePeriode(data)"></Button>
                                    </div>
                                    <Button label="Atur Jalur" class="grow" icon="pi pi-cog" 
                                    severity="warn" as="router-link" :to="{name: 'ManajemenPeriodeJalur-AdminDisdik', params: {id: data.periode_id}}"></Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <Dialog v-model:visible="editFormVisibility" modal header="Edit Periode" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="formResolver" :initialValues="editFormInitialValues" @submit="onUpdatePeriode" class="flex flex-col gap-4">
                            <div class="flex flex-col">
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="nama_periode" class="font-semibold w-auto">Nama Periode</label>
                                    <InputText v-model="editFormInitialValues.nama_periode" id="nama_periode" name="nama_periode" class="flex-auto" autocomplete="off" placeholder="Nama Periode"/>
                                    <Message v-if="$form.nama_periode?.invalid" severity="error" size="small" variant="simple">{{ $form.nama_periode.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="waktu_mulai" class="font-semibold w-auto">Waktu Mulai Periode</label>
                                    <DatePicker v-model="editFormInitialValues.waktu_mulai" name="waktu_mulai" showButtonBar show-icon show-time hour-format="24"></DatePicker>
                                    <Message v-if="$form.waktu_mulai?.invalid" severity="error" size="small" variant="simple">{{ $form.waktu_mulai.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-8">
                                    <label for="waktu_selesai" class="font-semibold w-auto">Waktu Selesai Periode</label>
                                    <DatePicker v-model="editFormInitialValues.waktu_selesai" name="waktu_selesai" showButtonBar show-icon show-time hour-format="24"></DatePicker>
                                    <Message v-if="$form.waktu_selesai?.invalid" severity="error" size="small" variant="simple">{{ $form.waktu_selesai.error.message }}</Message>
                                </div>
                            </div>
                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Batal" severity="secondary" @click="editFormVisibility = false"></Button>
                                <Button type="submit" label="Simpan"></Button>
                            </div>
                        </Form>
                    </Dialog>
                    <Dialog v-model:visible="addFormVisibility" modal header="Tambah Periode" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="formResolver" :initialValues="addFormInitialValues" @submit="onAddPeriode" class="flex flex-col gap-4">
                            <div class="flex flex-col">
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="nama_periode" class="font-semibold w-auto">Nama Periode</label>
                                    <InputText v-model="addFormInitialValues.nama_periode" id="nama_periode" name="nama_periode" class="flex-auto" autocomplete="off" placeholder="Nama Periode"/>
                                    <Message v-if="$form.nama_periode?.invalid" severity="error" size="small" variant="simple">{{ $form.nama_periode.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="waktu_mulai" class="font-semibold w-auto">Waktu Mulai Periode</label>
                                    <DatePicker v-model="addFormInitialValues.waktu_mulai" name="waktu_mulai" show-icon showButtonBar show-time hour-format="24"></DatePicker>
                                    <Message v-if="$form.waktu_mulai?.invalid" severity="error" size="small" variant="simple">{{ $form.waktu_mulai.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-8">
                                    <label for="waktu_selesai" class="font-semibold w-auto">Waktu Selesai Periode</label>
                                    <DatePicker v-model="addFormInitialValues.waktu_selesai" name="waktu_selesai" showButtonBar show-icon show-time hour-format="24"></DatePicker>
                                    <Message v-if="$form.waktu_selesai?.invalid" severity="error" size="small" variant="simple">{{ $form.waktu_selesai.error.message }}</Message>
                                </div>
                            </div>
                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Batal" severity="secondary" @click="addFormVisibility = false"></Button>
                                <Button type="submit" label="Simpan"></Button>
                            </div>
                        </Form>
                    </Dialog>
                </div>
            </div>
        </div>
    </div>
</template>