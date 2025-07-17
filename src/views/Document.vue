<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useToast, type FileUploadUploaderEvent } from 'primevue';
import type { Dokumen } from '@/interfaces/dokumenInterface';
import { useAuthStore } from '@/store/authStore';
import { isUserSiswa } from '@/utils/userType';
import { useRouter } from 'vue-router';
import { useDokumenStore } from '@/store/dokumenDataStore';

const toast = useToast()
const visible = ref()
const authStore = useAuthStore()
const router = useRouter()
const dokumenStore = useDokumenStore()
const keteranganVisibility = ref(false)

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const siswa_id =  isUserSiswa(authStore.user) ? authStore.user.siswa_id : 0

// load data dari backend ketika lifecycle onMounted
const dokumenWajib = ref<Dokumen[]>([]) // penyimpanan global sementara

onMounted(async () => {
    try {
        await dokumenStore.getSiswaDocument(siswa_id)
        dokumenWajib.value = dokumenStore.dokumen_wajib
        visible.value = new Array(dokumenWajib.value.length).fill(false)
        console.log(dokumenStore.dokumen_siswa)
        console.log(dokumenStore.dokumen_wajib)
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ severity: 'error', summary: 'Gagal Fetch Dokumen', detail: error.message , life: 3000 })
        }else {
            toast.add({ severity: 'error', summary: 'Gagal Fetch Dokumen', detail: 'Terjadi error yang tidak diketahui' , life: 3000 })
        }
    }
    // console.log(dokumenWajib.value)
    // console.log(visible.value)
})

// console.log(dokumenWajib.value)

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

const handleUpload = async (event: FileUploadUploaderEvent, item: Dokumen) => {
    const files = Array.isArray(event.files) ? event.files : [event.files]
    console.log(files[0])
    console.log(item)
    if(!item.siswa_id) {
        try {
            const response = await dokumenStore.submitDocument(siswa_id, item.dokumen_id, item.dokumen_jenis, files[0])
            console.log(response)
            if(response) {
                dokumenWajib.value = dokumenStore.dokumen_wajib
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
    }
    visible.value = false
}

const showFile = (url: string | null) => {
    if(url) {
        window.open(url, '_blank')
    }else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'File not found', life: 3000 })
    }
}

const severityDokumen = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): string => {
    switch (status) {
        case 'BELUM_VALID':
            return 'danger'
        case 'VALID_SD':
            return 'warn'
        case 'VALID_SMP':
            return 'success'
    }
}

const valueDokumen = (status: "BELUM_VALID" | "VALID_SD" | "VALID_SMP"): string => {
    if(status === 'BELUM_VALID') {
        return 'Belum Valid'
    } else {
        return 'Sudah Valid'
    }
}

</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <Button label="Kembali" severity="danger" @click="goBack" icon="pi pi-fw pi-arrow-left" class="w-[10%] leading-5"></Button>
                    <div class="text-xl font-bold mb-2">Berkas Wajib</div>
                </div>
                <div class="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
                    <Panel v-for="(item, index) in dokumenWajib" :key="index">
                        <template #header>
                            <span class="text-lg">{{ item.dokumen_jenis }}</span>
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
                                <div class="flex justify-end">
                                    <OverlayBadge
                                       v-if="item.keterangan"
                                       severity="danger"
                                       :value="1">
                                       <Button
                                          v-tooltip.top="{
                                             value: 'Keterangan',
                                             showDelay: 500,
                                             hideDelay: 300,
                                          }"
                                          icon="pi pi-envelope"
                                          severity="warn"
                                          @click="keteranganVisibility = true"></Button>
                                    </OverlayBadge>
                                </div>
                            </div>
                            <Dialog v-model:visible="keteranganVisibility" maximizable modal header="Keterangan" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                                <p class="m-0"> {{ item.keterangan }} </p>
                            </Dialog>
                        </template>
                        <div class="flex flex-col gap-2">
                            <Button size="small" label="Upload Berkas" icon="pi pi-upload" @click="showDialog(index)"></Button>
                            <Button size="small" severity="info" label="Lihat Berkas" icon="pi pi-file" :disabled="item.dokumen_url ? false : true" @click="showFile(item.dokumen_url)" ></Button>
                            <Dialog v-model:visible="visible[index]" modal header="Upload Berkas" :style="{ width: '35rem' }">
                                <FileUpload name="demo[]" customUpload @uploader="handleUpload($event, item)" :multiple="false" accept="image/*, application/pdf" :maxFileSize="1000000">
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