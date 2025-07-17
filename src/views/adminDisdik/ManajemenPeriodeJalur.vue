<script setup lang="ts">
import FormDialog from '@/components/forms/FormDialog.vue';
import type { Field, PaginationMeta, SubmitEventForm } from '@/interfaces/layoutInterface';
import type { CreatePeriodeJalur, JalurDTO, PeriodeJalurDTO, UpdatePeriodeJalur } from '@/interfaces/periodeInterface';
import { createPeriodeJalur, deletePeriodeJalurById, getAllJalur, getAllPeriodeJalurByPeriodeId, updatePeriodeJalurById } from '@/services/periodeService';
import { usePendaftaranStore } from '@/store/pendaftaranStore';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useConfirm, useToast } from 'primevue';
import { onMounted, reactive, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { z } from 'zod';

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const periodeId = Number(route.params.id)
const periodeJalurId = ref<number>(0)
const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const periodeJalurs = ref<PeriodeJalurDTO[]>([])
const meta = reactive<PaginationMeta>({
    total: 0,
    limit: 10,
    page: 1
})
const getPeriodeJalur = async(periodeId_: number) => {
    try {
        const response = await getAllPeriodeJalurByPeriodeId(periodeId_)
        periodeJalurs.value = response
        meta.total = response.length
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

const jalurOptions = ref<JalurDTO[]>([])
onMounted(async() => {
    await getPeriodeJalur(periodeId)
    await getJalurs()
})

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
const pendaftaranStore = usePendaftaranStore()
async function getJalurs() {
    try {
        if(pendaftaranStore.jalur.length === 0) {
            const jalurs = await getAllJalur()
            jalurOptions.value = jalurs
            pendaftaranStore.storeJalurs(jalurs)
        }else {
            jalurOptions.value = pendaftaranStore.jalur
        }
    } catch (error) {
        if(error instanceof Error) {
            console.log(error)
        }
    }
}

interface FormInitialValues {
    jalur_id: number
    waktu_mulai: Date | null
    waktu_selesai: Date | null
    metode_ranking: "JARAK_LURUS" | "JARAK_RUTE" | null
}

const createFormInitialValues = reactive<FormInitialValues>({
    jalur_id: 0,
    waktu_mulai: null,
    waktu_selesai: null,
    metode_ranking: null
})

const editFormInitialValues = reactive<FormInitialValues>({
    jalur_id: 0,
    waktu_mulai: null,
    waktu_selesai: null,
    metode_ranking: null
})

const formResolver = zodResolver(
    z.object({
        jalur_id: z.number().int().positive("pilih jalur"),
        waktu_mulai: z.date({ message: "waktu mulai harus diisi" }),
        waktu_selesai: z.date({ message: "waktu selesai harus diisi" }),
        metode_ranking: z.optional(z.enum(["JARAK_LURUS", "JARAK_RUTE"], { message: "metode ranking harus diisi"}))
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

const metodeRankingOptions = [
    { label: "Jarak Lurus", value: "JARAK_LURUS"},
    { label: "Jarak Rute", value: "JARAK_RUTE"}
]

const createFormFields = ref<Field[]>([])
const isJalurZonasi = (jalurId: number): boolean => {
    const jalur = jalurOptions.value.find(j => j.jalur_id === jalurId)
    if (!jalur) {
        return false
    }

    if (jalur.jalur_nama.toLowerCase() !== "zonasi") {
        return false
    }

    return true
}
watchEffect(() => {
    createFormFields.value = [
        { 
            name: 'jalur_id', 
            label: 'Jalur', 
            type: 'select', 
            attrs: { 
                options: jalurOptions.value, 
                optionValue: 'jalur_id', 
                optionLabel: 'jalur_nama', 
                placeholder: 'Pilih Jalur' 
            } 
        },
        { 
            name: 'waktu_mulai', 
            label: 'Waktu Mulai', 
            type: 'date', 
            attrs: { 
                showIcon: true, 
                showTime: true, 
                hourFormat: '24', 
                showButtonBar: true 
            } 
        },
        { 
            name: 'waktu_selesai', 
            label: 'Waktu Selesai', 
            type: 'date', 
            attrs: { 
                showIcon: true, 
                showTime: true, 
                hourFormat: '24', 
                showButtonBar: true 
            } 
        },
        { 
            name: 'metode_ranking', 
            label: 'Metode Ranking', 
            type: 'select',
            showIf: (form) => isJalurZonasi(form.jalur_id), 
            attrs: { 
                options: metodeRankingOptions, 
                optionValue: 'value', 
                optionLabel: 'label', 
                placeholder: 'Pilih Metode Ranking' 
            } 
        },
    ]
})

const editFormFields = ref<Field[]>([])

watchEffect(() => {
    editFormFields.value = [
        { 
            name: 'jalur_id', 
            label: 'Jalur', 
            type: 'select', 
            attrs: { 
                options: jalurOptions.value, 
                optionValue: 'jalur_id', 
                optionLabel: 'jalur_nama', 
                placeholder: 'Pilih Jalur' 
            } 
        },
        { 
            name: 'waktu_mulai', 
            label: 'Waktu Mulai', 
            type: 'date', 
            attrs: { 
                showIcon: true, 
                showTime: true, 
                hourFormat: '24', 
                showButtonBar: true 
            } 
        },
        { 
            name: 'waktu_selesai', 
            label: 'Waktu Selesai', 
            type: 'date', 
            attrs: { 
                showIcon: true, 
                showTime: true, 
                hourFormat: '24', 
                showButtonBar: true 
            } 
        },
        { 
            name: 'metode_ranking', 
            label: 'Metode Ranking', 
            type: 'select',
            showIf: (form) => isJalurZonasi(form.jalur_id), 
            attrs: { 
                options: metodeRankingOptions, 
                optionValue: 'value', 
                optionLabel: 'label', 
                placeholder: 'Pilih Metode Ranking' 
            } 
        },
    ]
})

const createModalVisibility = ref(false)

const editModalVisbility = ref(false)
function onOpenEditModal(data: PeriodeJalurDTO) {
    periodeJalurId.value = data.periode_jalur_id
    editFormInitialValues.jalur_id = data.jalur_id
    editFormInitialValues.waktu_mulai = new Date(data.waktu_mulai)
    editFormInitialValues.waktu_selesai = new Date(data.waktu_selesai)
    editFormInitialValues.metode_ranking = data.metode_ranking
    editModalVisbility.value = true
}

async function onSubmitCreateForm(form: SubmitEventForm) {
    console.log(form)
    try {
        if (!form.valid) return
        const data: CreatePeriodeJalur = {
            periode_id: periodeId,
            jalur_id: form.values.jalur_id,
            waktu_mulai: form.values.waktu_mulai,
            waktu_selesai: form.values.waktu_selesai,
            metode_ranking: form.values.metode_ranking ?? null
        }
        const response = await createPeriodeJalur(data)
        if(response) {
            toast.add({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Jalur berhasil dibuat',
                life: 2000
            })
            periodeJalurs.value.push(response)
            createModalVisibility.value = false
        }
    } catch (error) {
        createModalVisibility.value = false
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

async function onSubmitEditForm(form: SubmitEventForm) {
    try {
        console.log(form.values)
        const data: UpdatePeriodeJalur = {
            jalur_id: form.values.jalur_id,
            waktu_mulai: form.values.waktu_mulai,
            waktu_selesai: form.values.waktu_selesai,
            metode_ranking: form.values.metode_ranking ?? null
        } 
        const response = await updatePeriodeJalurById(periodeJalurId.value, data)
        if (response) {
            toast.add({
                severity: 'success',
                summary: 'Berhasil',
                detail: 'Jalur berhasil diupdate',
                life: 2000
            })
            const editedPeriodeJalur = periodeJalurs.value.find((periodeJalur) => 
            periodeJalur.periode_jalur_id === response.periode_jalur_id)
            if (editedPeriodeJalur) {
                Object.assign(editedPeriodeJalur, response)
            }
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
    } finally {
        editModalVisbility.value = false
    }
}

async function onDeletePeriodeJalur(data: PeriodeJalurDTO) {
    confirm.require({
        message: `Anda yakin ingin menghapus jalur ${data.jalur_nama}?`,
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
                const response = await deletePeriodeJalurById(data.periode_jalur_id)
                if (response) {
                    toast.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'Jalur berhasil dihapus',
                        life: 2000
                    })
                    periodeJalurs.value = periodeJalurs.value.filter((p) => p.periode_jalur_id !== response.periode_jalur_id)
                    meta.total = periodeJalurs.value.length
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
        },
        reject: () => {
            
        }
    });
}

function showMetodeRanking (metode: "JARAK_LURUS" | "JARAK_RUTE" | null) {
    if (!metode) {
        return ""
    }

    return metode === "JARAK_LURUS" ? "Jarak Lurus" : "Jarak Rute"
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
                    <div class="text-xl font-bold">Manajemen Jalur</div>
                    <DataTable :value="periodeJalurs" paginator :first="(meta.page - 1) * meta.limit" 
                    :totalRecords="meta.total" :rows="meta.limit" :rowsPerPageOptions="[5, 10, 20]" 
                    tableStyle="min-width: 50rem" >
                        <template #header>
                            <div class="flex justify-between">
                                <div class="text-xl">
                                    Daftar Jalur
                                </div>
                                <Button label="Tambah Jalur" severity="success" icon="pi pi-plus" @click="createModalVisibility = true"></Button>
                            </div>
                        </template>
                        <Column header="No" style="width: 10%">
                            <template #body="{ index }">
                                {{ (meta.page - 1) * meta.limit + index + 1 }}
                            </template>
                        </Column>
                        <Column field="jalur_nama" header="Jalur" style="width: 15%"></Column>
                        <Column header="Waktu Mulai" style="width: 18%">
                            <template #body="{ data }">
                                <Badge size="large" severity="contrast">{{ setTime(data.waktu_mulai) }}</Badge>
                            </template>
                        </Column>
                        <Column header="Waktu Selesai" style="width: 18%">
                            <template #body="{ data }">
                                <Badge size="large" severity="contrast">{{ setTime(data.waktu_selesai) }}</Badge>
                            </template>
                        </Column>
                        <Column header="Metode Ranking" field="metode_ranking" style="width: 13%;">
                            <template #body="{ data }">
                                {{ showMetodeRanking(data.metode_ranking) }}
                            </template>
                        </Column>
                        <Column style="width: 20%;">
                            <template #body="{ data }">
                                <div class="flex gap-3">
                                    <div class="flex gap-1">
                                        <Button v-tooltip.bottom="{ value: 'Edit Jalur', showDelay: 500, hideDelay: 300 }"
                                         icon="pi pi-pencil" severity="info" @click="onOpenEditModal(data)"></Button>
                                        <Button v-tooltip.bottom="{ value: 'Hapus Jalur', showDelay: 500, hideDelay: 300 }"
                                         icon="pi pi-trash" severity="danger" @click="onDeletePeriodeJalur(data)"></Button>
                                    </div>
                                    <Button label="Atur Jadwal" class="grow" icon="pi pi-cog" 
                                    severity="warn" as="router-link" :to="{name: 'ManajemenJadwal-AdminDisdik', params: {id: data.periode_jalur_id}}"></Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <FormDialog :visible="createModalVisibility" title="Tambah Jalur" @after-hide="createModalVisibility = false"
                    :initialValues="createFormInitialValues" :formResolver="formResolver" :fields="createFormFields"
                    @submit="onSubmitCreateForm" @close="createModalVisibility = false"></FormDialog>
                    <FormDialog :visible="editModalVisbility" title="Edit Jalur" @after-hide="editModalVisbility = false" 
                    :initialValues="editFormInitialValues" :formResolver="formResolver" :fields="editFormFields" 
                    @submit="onSubmitEditForm" @close="editModalVisbility = false"></FormDialog>
                </div>
            </div>
        </div>
    </div>
</template>