<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useToast, type FileUploadUploaderEvent } from 'primevue';
import type { Dokumen } from '@/interfaces/dokumenInterface';
import { useAuthStore } from '@/store/authStore';
import { isUserSiswa } from '@/utils/userType';
import { useRouter, useRoute } from 'vue-router';
import { useDokumenStore } from '@/store/dokumenDataStore';
import { updateDocumentSiswaStatus } from '@/services/dokumenService';

const toast = useToast()
const visible = ref<boolean[]>([])
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const dokumenStore = useDokumenStore()

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

// const siswa_id =  isUserSiswa(authStore.user) ? authStore.user.siswa_id : 0
let isAdmin: boolean = false
let siswa_id: number 
const nama_siswa = ref('')
const userRole = authStore.user ? authStore.user.role.toLowerCase() : 'siswa'
const keteranganVisibility = ref<boolean[]>([])
const addKeteranganVisibility = ref(false)
const keterangan = ref<string>('')
const pendingMessage = ref<string>('')
const pendingStatus = ref<"BELUM_VALID" | "VALID_SD" | "VALID_SMP">('BELUM_VALID')
const pendingDokumen = ref<Dokumen | null>(null)
const currentDokumen = ref<Dokumen | null>(null)
const isRoleSiswa = computed(() => userRole === 'siswa')
const isRoleAdminSD = computed(() => userRole === 'adminsd')
const isRoleAdminSMP = computed(() => userRole === 'adminsmp')

if (route.params.id && userRole !== 'siswa') {
    siswa_id = Number(route.params.id)
    isAdmin = true
} else {
    siswa_id = isUserSiswa(authStore.user) ? authStore.user.siswa_id : 0
}

// load data dari backend ketika lifecycle onMounted
const dokumenWajib = ref<Dokumen[]>([]) // penyimpanan global sementara

onMounted(async () => {
    try {
        await dokumenStore.getSiswaDocument(siswa_id)
        dokumenWajib.value = dokumenStore.dokumen_wajib
        nama_siswa.value = dokumenStore.nama
        visible.value = new Array(dokumenWajib.value.length).fill(false)
        keteranganVisibility.value = new Array(dokumenWajib.value.length).fill(false)
        // console.log(dokumenStore.dokumen_siswa)
        console.log(dokumenStore.dokumen_wajib)
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ severity: 'error', summary: 'Gagal Fetch Dokumen', detail: error.message , life: 3000 })
        }else {
            toast.add({ severity: 'error', summary: 'Gagal Fetch Dokumen', detail: 'Terjadi error yang tidak diketahui' , life: 3000 })
        }
    }
})

const showDialog = (index: number) => {
    visible.value[index] = true
}

// const changeSiswaDokumen = (newData: UploadDokumenResponse) => {
//     dokumenWajib.value = dokumenWajib.value.map((dokumen) => 
//         dokumen.dokumen_id === newData.dokumen_id 
//         ? {...dokumen, dokumen_url: newData.dokumen_url, status: newData.status}
//         : dokumen
//     )
// }

const handleUpload = async (event: FileUploadUploaderEvent, item: Dokumen, index: number) => {
    const files = Array.isArray(event.files) ? event.files : [event.files]
    console.log(files[0])
    console.log(item)
    try {
        const response = await dokumenStore.submitDocument(siswa_id, item.dokumen_id, item.dokumen_jenis, files[0])
        console.log(response)
        if (response) {
            // dokumenWajib.value = dokumenStore.dokumen_wajib
            const updatedDokumen = dokumenStore.dokumen_wajib.find((d) => response.dokumen_id === d.dokumen_id)
            if (updatedDokumen) {
                dokumenWajib.value[index] = updatedDokumen
            }
            console.log(dokumenWajib.value[index])
            // console.log(dokumenWajib.value)
            // await nextTick()
            toast.add({ severity: 'success', summary: 'Sukses', detail: 'File berhasil diupload', life: 3000 })
        }
    } catch (error) {
        console.log(error)
        if(error instanceof Error) {
            toast.add({ severity: 'error', summary: 'Gagal', detail: error.message, life: 3000 })
        }else {
            toast.add({ severity: 'error', summary: 'Gagal', detail: "Terjadi error yang tidak diketahui", life: 3000 })
        }
    }
    if(!item.dokumen_siswa_id) {
        console.log("tes")
    }
    visible.value[index] = false
}

const showFile = (url: string | null) => {
    if(url) {
        window.open(url, '_blank')
    }else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'File not found', life: 3000 })
    }
}

const onUpdateDokumen = async (
    data: Dokumen, 
    status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP",
    message: string
) => {
    try {
        const response = await updateDocumentSiswaStatus(data.dokumen_siswa_id!, status, data.keterangan_pesan)
        if(response) {
            toast.add({
                severity: 'success',
                summary: 'Berhasil',
                detail: message,
                life: 2000
            })
            const updatedDokumen = dokumenWajib.value.find((d) => d.dokumen_siswa_id === response.dokumen_siswa_id)
            if(updatedDokumen) {
                updatedDokumen.status = response.status
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
}

const onUpdateDokumenStatus = async (data: Dokumen) => {
    if(!data.dokumen_siswa_id) {
        toast.add({
            severity: 'error',
            summary: 'Gagal',
            detail: 'Dokumen Belum Terupload',
            life: 2000
        })
        return
    }
    let message = ''
    let status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP" = 'BELUM_VALID'
    if (isRoleAdminSD.value) {
        status = data.status === 'BELUM_VALID' ? 'VALID_SD' : 'BELUM_VALID'
        message = data.status === 'BELUM_VALID' ? 'Validasi Berhasil' : 'Validasi Dibatalkan'
    } else {
        status = data.status === 'VALID_SD' ? 'VALID_SMP' : 'VALID_SD'
        message = data.status === 'VALID_SD' ? 'Validasi Berhasil' : 'Validasi Dibatalkan'
    }

    const isCancel =
        (isRoleAdminSD.value && status === 'BELUM_VALID') ||
        (isRoleAdminSMP.value && status === 'VALID_SD');
    
    if (isCancel) {
        pendingMessage.value = message
        pendingStatus.value = status
        pendingDokumen.value = data
        addKeteranganVisibility.value = true
        return
    }

    await onUpdateDokumen(data, status, message)
}

const onShowAddKeteranganDialog = (data: Dokumen) => {
    currentDokumen.value = data
    addKeteranganVisibility.value = true
}

const confirmPembatalan = async () => {
    if (!pendingDokumen.value && !currentDokumen.value) return
    if (pendingDokumen.value) {
        pendingDokumen.value.keterangan_pesan = keterangan.value
        await onUpdateDokumen(pendingDokumen.value, pendingStatus.value, pendingMessage.value)
        addKeteranganVisibility.value = false
        keterangan.value = ''
        return
    }
    
    if (currentDokumen.value) {
        currentDokumen.value.keterangan_pesan = keterangan.value
        await onUpdateDokumen(
            currentDokumen.value, 
            currentDokumen.value.status, 
            "Tambah Keterangan Berhasil"
        )
        addKeteranganVisibility.value = false
        keterangan.value = ''
        return
    }

}

const severityDokumen = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): string => {
    let severity: string = ''
    if(isRoleAdminSMP.value) {
        switch (status) {
            case 'BELUM_VALID':
            case 'VALID_SD':
                severity = 'danger'
                break
            case 'VALID_SMP':
                severity = 'success'
                break
        }
    } else {
        switch (status) {
            case 'BELUM_VALID':
                severity = 'danger'
                break
            case 'VALID_SD':
                severity = 'warn'
                break
            case 'VALID_SMP':
                severity = 'success'
                break
        }
    }
    return severity
}

const valueDokumen = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): string => {
    let value: string = ''
    if (isRoleAdminSMP.value) {
        switch (status) {
            case 'BELUM_VALID':
            case 'VALID_SD':
                value = 'Belum Valid'
                break
            case 'VALID_SMP':
                value = 'Sudah Valid'
                break
        }
    } else if (isRoleAdminSD.value) {
        switch (status) {
            case 'BELUM_VALID':
                value = 'Belum Valid'
                break
            case 'VALID_SD':
                value = 'Valid'
                break
            case 'VALID_SMP':
                value = 'Valid SMP'
                break
        }
    } else {
        switch (status) {
            case 'BELUM_VALID':
                value = 'Belum Valid'
                break
            case 'VALID_SD':
                value = 'Valid SD'
                break
            case 'VALID_SMP':
                value = 'Sudah Valid'
                break
        }
    }

    return value
}

const severityValidationButton = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): string => {
    let severity: string = ''
    if (isRoleAdminSD.value) {
        switch (status) {
            case 'BELUM_VALID':
                severity = 'warn'
                break
            case 'VALID_SD':
            case 'VALID_SMP':
                severity = 'danger'
                break
        }
    } else {
        switch (status) {
            case 'BELUM_VALID':
            case 'VALID_SD':
                severity = 'warn'
                break
            case 'VALID_SMP':
                severity = 'danger'
                break
        }
    }

    return severity
}

const labelValidationButton = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): string => {
    let label: string = ''
    if (isRoleAdminSD.value) {
        switch (status) {
            case 'BELUM_VALID':
                label = 'Validasi Berkas'
                break
            case 'VALID_SD':
            case 'VALID_SMP':
                label = 'Batalkan Validasi'
                break
        }
    } else {
        switch (status) {
            case 'BELUM_VALID':
            case 'VALID_SD':
                label = 'Validasi Berkas'
                break
            case 'VALID_SMP':
                label = 'Batalkan Validasi'
                break
        }
    }

    return label
}

const disableUploadButton = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): boolean => {
    let isDisabled: boolean = false
    if (isRoleSiswa.value) {
        isDisabled = status === 'BELUM_VALID' ? false : true
    } else if (isRoleAdminSD.value) {
        isDisabled = status === 'VALID_SMP' ? true : false
    }

    return isDisabled
}

const disableValidationButton = (dokumen_siswa_id: number | null, status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): boolean => {
    if (!dokumen_siswa_id) return true
    const isTouchedByAdminSmp = dokumenWajib.value.some((d) => d.status === "VALID_SMP")
    if (isRoleAdminSD.value && isTouchedByAdminSmp) return true
    if (isRoleAdminSD.value && status === 'VALID_SMP') return true 
    // console.log(dokumen_siswa_id, isDisabled)
    return false
}

const isShowAddKeteranganButton = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP") => {
    if (isRoleAdminSD.value && status === "BELUM_VALID") return true
    if (isRoleAdminSMP.value && status === "VALID_SD") return true
}

</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4 mb-2">
                    <Button label="Kembali" severity="danger" @click="goBack" icon="pi pi-fw pi-arrow-left" class="w-[10%] leading-5"></Button>
                    <div class="text-xl font-bold">Berkas Wajib</div>
                    <div class="text-lg mb-2">
                        <Chip :label="nama_siswa" />
                    </div>
                </div>
                <Dialog v-model:visible="addKeteranganVisibility" @after-hide="keterangan = ''" maximizable modal header="Keterangan" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                    <div class="flex flex-col gap-4">
                        <p class="text-l">Tambahkan Keterangan Pembatalan</p>
                        <Textarea class="m-0" v-model="keterangan"></Textarea>
                        <div class="flex justify-end gap-2">
                            <Button label="Batal" severity="secondary" @click="addKeteranganVisibility = false"></Button>
                            <Button label="Simpan" severity="success" @click="confirmPembatalan"></Button>
                        </div>
                    </div>
                </Dialog>
                <div class="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                    <Panel v-for="(item, index) in dokumenWajib" :key="index">
                        <template #header>
                            <span class="text-lg">{{ item.dokumen_jenis }}</span>
                        </template>
                        <template #icons>
                            <div class="flex justify-end gap-2">
                                <OverlayBadge
                                   v-if="item.keterangan_pesan"
                                   severity="danger"
                                   size="small"
                                   :value="1">
                                   <Button
                                      v-tooltip.top="{
                                         value: 'Keterangan',
                                         showDelay: 500,
                                         hideDelay: 300,
                                      }"
                                      size="small"
                                      icon="pi pi-envelope"
                                      severity="warn"
                                      @click="keteranganVisibility[index] = true"></Button>
                                </OverlayBadge>
                                <Button 
                                    v-if="isShowAddKeteranganButton(item.status)" 
                                    icon="pi pi-plus" 
                                    severity="secondary" 
                                    class="leading-4"
                                    size="small"
                                    v-tooltip.top="{
                                        value: 'Tambah Keterangan',
                                        showDelay: 300,
                                        hideDelay: 300,
                                    }"
                                    @click="onShowAddKeteranganDialog(item)">
                                </Button>
                            </div>
                        </template>
                        <template #footer>
                            <div class="flex gap-1">
                                <Tag 
                                    :severity="item.dokumen_url ? 'success' : 'danger'" 
                                    :value="item.dokumen_url ? 'Sudah Upload' : 'Belum Upload'">
                                </Tag>
                                <Tag 
                                    :severity="severityDokumen(item.status)" 
                                    :value="valueDokumen(item.status)">
                                </Tag>
                            </div>
                            <Dialog v-model:visible="keteranganVisibility[index]" maximizable modal header="Keterangan" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                                <p class="ml-4 mr-4"> {{ item.keterangan_pesan }} </p>
                            </Dialog>
                        </template>
                        <div class="flex flex-col gap-2">
                            <Button v-if="!isRoleAdminSMP" size="small" label="Upload Berkas" icon="pi pi-upload" :disabled="disableUploadButton(item.status)" @click="showDialog(index)"></Button>
                            <Button size="small" severity="info" label="Lihat Berkas" icon="pi pi-file" :disabled="item.dokumen_url ? false : true" @click="showFile(item.dokumen_url)" ></Button>
                            <Button v-if="isAdmin" size="small" :severity="severityValidationButton(item.status)" 
                            :label="labelValidationButton(item.status)" :disabled="disableValidationButton(item.dokumen_siswa_id, item.status)" 
                            @click="onUpdateDokumenStatus(item)"></Button>
                            <Dialog v-model:visible="visible[index]" modal header="Upload Berkas" :style="{ width: '35rem' }">
                                <FileUpload name="demo[]" customUpload @uploader="handleUpload($event, item, index)" :multiple="false" accept="image/*, application/pdf" :maxFileSize="1000000">
                                    <template #empty>
                                        <span>Drag and drop files to here to upload.</span>
                                    </template>
                                </FileUpload>
                            </Dialog>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    </div>

</template>