<script setup lang="ts">
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { reactive, ref, nextTick, onMounted, watch } from 'vue';
import { z } from 'zod';
import type { GetProvinsi, GetKabupaten, GetKecamatan, GetDesa, GetBanjar } from '@/interfaces/wilayahInterface';
import L from 'leaflet'
import { updateSekolahById } from '@/services/sekolahService';
import { getAllProvinsi, getKabupatenByProvinsiId, getKecamatanByKabupatenId, getDesaByKecamatanId, getBanjarByDesaId } from '@/services/wilayahService';
import type { SubmitEventForm } from '@/interfaces/layoutInterface';
import { useConfirm, useToast } from 'primevue';
import type { SekolahDTO } from '@/interfaces/sekolahInterface';

const confirm = useConfirm()
const toast = useToast()
const props = defineProps<{
    isDialog: boolean,
    sekolahData: SekolahDTO[]
}>()
const emit = defineEmits(['close'])
const validationField = z.object({
    sekolah_nama: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z-0-9\s]+$/, "input hanya menerima huruf"),
    npsn: z.string().min(8, "npsn minimal 8 karakter").max(8, "npsn maksimal 8 karakter").regex(/^[0-9]+$/, "input hanya menerima angka"),
    provinsi_id: z.number().int().positive("pilih provinsi"),
    kabupaten_id: z.number().int().positive("pilih kabupaten"),
    kecamatan_id: z.number().int().positive("pilih kecamatan"),
    desa_id: z.number().int().positive("pilih desa"),
    banjar_id: z.number().int().positive("pilih banjar"),
    lintang: z.string().transform((val) => Number(val)).refine((val) => val !== 0, { message: "koordinat harus diisi"}),
    bujur: z.string().transform((val) => Number(val)).refine((val) => val !== 0, { message: "koordinat harus diisi"})
})

const resolver = ref(zodResolver(validationField))

const initialFormValues = reactive({
    sekolah_id: null,
    sekolah_nama: '',
    npsn: '',
    jenjang_sekolah_id: 0,
    banjar_id: 0,
    desa_id: 0,
    kecamatan_id: 0,
    kabupaten_id: 0,
    provinsi_id: 0,
    jumlah_kelas: null, 
    lintang: '',
    bujur: '',
})

const visible = ref(false)
const map = ref<L.Map>()
const lintang = ref()
const bujur = ref()
// map initialization
const initMap = async () => {
    await nextTick()

    if(map.value) {
        map.value.remove()
    }

    map.value = L.map('map').setView([Number(initialFormValues.lintang), Number(initialFormValues.bujur)], 16); // Default view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value);

    // Tambahkan marker
    const marker = L.marker([Number(initialFormValues.lintang), Number(initialFormValues.bujur)], { draggable: true }).addTo(map.value);

    // Update latitude dan longitude saat marker dipindahkan
    marker.on('dragend', (e) => {
        const latlng = e.target.getLatLng();
        lintang.value = latlng.lat;
        bujur.value = latlng.lng;
      });

      // Update marker ketika pengguna klik di peta
      map.value.on('click', (e) => {
        const latlng = e.latlng;
        lintang.value = latlng.lat;
        bujur.value = latlng.lng;
        marker.setLatLng(latlng);
      });

}

watch(() => props.sekolahData, (newValues) => {
    console.log(newValues)
    if(newValues.length === 0) {
        Object.assign(initialFormValues, newValues)
    }
    console.log(initialFormValues)
}, { immediate: true, deep: true })

watch( () => initialFormValues.kabupaten_id, async (newId) => {
    try {
        if(newId) {
            const kecamatans= await getKecamatanByKabupatenId(newId)
            kecamatanDropdown.value = kecamatans
        }
    } catch (error) {
        console.log(error)
    }
})

watch( () => initialFormValues.kecamatan_id, async (newId) => {
    try {
        if(newId) {
            const desas= await getDesaByKecamatanId(newId)
            desaDropdown.value = desas
        }
    } catch (error) {
        console.log(error)
    }
})

watch( () => initialFormValues.desa_id, async (newId) => {
    try {
        if(newId) {
            const banjars= await getBanjarByDesaId(newId)
            banjarDropdown.value = banjars
        }
    } catch (error) {
        console.log(error)
    }
})

// save latlng to initialFormValues
const saveLocation = () => {
    initialFormValues.lintang = lintang.value.toString()
    initialFormValues.bujur = bujur.value.toString()
    visible.value = false
}

// dropdown array
const jenjangSekolahDropdown = ref([
    { jenjang_sekolah_id: 1, jenjang_sekolah_nama: 'SMP'},
    { jenjang_sekolah_id: 2, jenjang_sekolah_nama: 'SD'}
])
const provinsiDropdown = ref<GetProvinsi[]>([])
const kabupatenDropdown = ref<GetKabupaten[]>([])
const kecamatanDropdown = ref<GetKecamatan[]>([])
const desaDropdown = ref<GetDesa[]>([])
const banjarDropdown = ref<GetBanjar[]>([])
const isLoading = ref(true)
const formKey = ref(0)
onMounted( async() => {
    try {
        const provinsis = await getAllProvinsi();
        // console.log(provinsis)
        if (provinsis) {
            provinsiDropdown.value = provinsis;
            // console.log(provinsiDropdown.value)
            if(props.isDialog) {
                const provinsiBali = provinsis.find((p) => p.provinsi_nama.toLowerCase() === 'bali')
                initialFormValues.provinsi_id = provinsiBali ? provinsiBali.provinsi_id : 0
                formKey.value ++
            }
        }

        if (initialFormValues?.provinsi_id) {
            const kabupatens = await getKabupatenByProvinsiId(initialFormValues.provinsi_id);
            if (kabupatens) {
                kabupatenDropdown.value = kabupatens;
            }
        }

        if (initialFormValues?.kabupaten_id) {
            const kecamatans = await getKecamatanByKabupatenId(initialFormValues.kabupaten_id);
            if (kecamatans) {
                kecamatanDropdown.value = kecamatans;
            }
        }

        if (initialFormValues?.kecamatan_id) {
            const desas = await getDesaByKecamatanId(initialFormValues.kecamatan_id);
            if (desas) {
                desaDropdown.value = desas;
            }
        }

        if (initialFormValues?.desa_id) {
            const banjars = await getBanjarByDesaId(initialFormValues.desa_id);
            if (banjars) {
                banjarDropdown.value = banjars;
            }
        }
    } catch (error) {
        console.error("Error fetching siswa", error);
    } finally {
        isLoading.value = false
    }
})

// handle submit form
async function onFormSubmit(form: SubmitEventForm) {
    console.log(form)
    console.log(initialFormValues)
    if(form.valid) {
        confirm.require({
            message: 'Anda yakin untuk menyimpan data?',
            header: 'Konfirmasi',
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
                label: 'Batal',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Simpan'
            },
            accept: async () => {
                try {
                    if(!form.valid) {
                        toast.add({ 
                            severity: 'error', 
                            summary: 'Gagal', 
                            detail: 'Form tidak valid',
                            life: 1500
                        });
                        return
                    }
                    if(initialFormValues.jenjang_sekolah_id === null  
                    || initialFormValues.sekolah_id === null) {
                        throw new Error("semua field harus diisi")
                    }
                    const sekolah = {
                        ...form.values,
                        jenjang_sekolah_id: initialFormValues.jenjang_sekolah_id as number,
                        jumlah_kelas: 0,
                        total_daya_tampung: 0
                    }
                    const response = await updateSekolahById(initialFormValues.sekolah_id, sekolah as SekolahDTO)
                    if(response) {
                        const formValues = {
                            ...form.values,
                            lintang: form.values.lintang.toString(),
                            bujur: form.values.bujur.toString()
                        }
                        // console.log(formValues)
                        Object.assign(initialFormValues, formValues)
                        toast.add({ 
                            severity: 'success', 
                            summary: 'Sukses', 
                            detail: 'Data Berhasil Disimpan',
                            life: 1500
                        });
                    }
                } catch (error) {
                    if(error instanceof Error) {
                        toast.add({ 
                            severity: 'error', 
                            summary: 'Gagal', 
                            detail: error.message,
                            life: 1500
                        });
                    }
                }
            },
            reject: () => {
                // toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
            }
        });
    }
}

</script>

<template>
    <Form v-slot="$form" :initialValues="initialFormValues" :key="formKey" :resolver @submit="onFormSubmit" class="flex flex-wrap gap-4 w-full sm:w-56 md:w-full">
        <div class="flex flex-col basis-1/2 gap-1">
            <label for="sekolah_nama" >Nama Sekolah</label>
            <InputText v-model="initialFormValues.sekolah_nama" disabled name="sekolah_nama" type="text" placeholder="Nama Sekolah"/>
            <Message v-if="$form.sekolah_nama?.invalid" severity="error" size="small" variant="simple">{{ $form.sekolah_nama.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/3 gap-1">
            <label for="npsn" >NPSN</label>
            <InputText v-model="initialFormValues.npsn" disabled id="npsn" name="npsn" type="text" placeholder="NPSN"></InputText>
            <Message v-if="$form.npsn?.invalid" severity="error" size="small" variant="simple">{{ $form.npsn.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/6 gap-2">
            <label for="jenjang_sekolah_id" >Jenjang</label>
            <Select v-model="initialFormValues.jenjang_sekolah_id" id="jenjang_sekolah_id" name="jenjang_sekolah_id" :options="jenjangSekolahDropdown" optionLabel="jenjang_sekolah_nama" optionValue="jenjang_sekolah_id" placeholder="Pilih Jenjang" :disabled="isDialog ? false : true" fluid />
            <Message v-if="$form.jenjang_sekolah_id?.invalid" severity="error" size="small" variant="simple">{{ $form.jenjang_sekolah_id.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/6 gap-2">
            <label for="provinsi_id" >Provinsi</label>
            <Select v-model="initialFormValues.provinsi_id" id="provinsi_id" name="provinsi_id" :options="provinsiDropdown" optionLabel="provinsi_nama" optionValue="provinsi_id" placeholder="Pilih Provinsi" disabled fluid />
            <Message v-if="$form.provinsi_id?.invalid" severity="error" size="small" variant="simple">{{ $form.provinsi_id.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/6 gap-2">
            <label for="kabupaten_id" >Kabupaten</label>
            <Select v-model="initialFormValues.kabupaten_id" id="kabupaten_id" name="kabupaten_id" :options="kabupatenDropdown" optionLabel="kabupaten_nama" optionValue="kabupaten_id" placeholder="Pilih Kabupaten" fluid />
            <Message v-if="$form.kabupaten_id?.invalid" severity="error" size="small" variant="simple">{{ $form.kabupaten_id.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/5 gap-2">
            <label for="kecamatan_id" >Kecamatan</label>
            <Select v-model="initialFormValues.kecamatan_id" id="kecamatan_id" name="kecamatan_id" :options="kecamatanDropdown" optionLabel="kecamatan_nama" optionValue="kecamatan_id" placeholder="Pilih Kecamatan" fluid />
            <Message v-if="$form.kecamatan_id?.invalid" severity="error" size="small" variant="simple">{{ $form.kecamatan_id.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/5 gap-2">
            <label for="desa_id" >Desa/Kelurahan</label>
            <Select v-model="initialFormValues.desa_id" id="desa_id" name="desa_id" :options="desaDropdown" optionLabel="desa_nama" optionValue="desa_id" placeholder="Pilih Desa/Kelurahan" fluid />
            <Message v-if="$form.desa_id?.invalid" severity="error" size="small" variant="simple">{{ $form.desa_id.error?.message }}</Message>
        </div>
        <div class="flex flex-col grow basis-1/5 gap-2">
            <label for="banjar_id" >Banjar</label>
            <Select v-model="initialFormValues.banjar_id" id="banjar_id" name="banjar_id" :options="banjarDropdown" optionLabel="banjar_nama" optionValue="banjar_id" placeholder="Pilih Banjar" fluid />
            <Message v-if="$form.banjar_id?.invalid" severity="error" size="small" variant="simple">{{ $form.banjar_id.error?.message }}</Message>
        </div>
        <div class="flex flex-col gap-2">
            <label for="bujur" >Lokasi Sekolah</label>
            <InputGroup>
                <Button icon="pi pi-pen-to-square" @click="visible = true" />
                <InputText v-model="initialFormValues.lintang" id="lintang" name="lintang" type="text" placeholder="Lintang" disabled />
                <InputText v-model="initialFormValues.bujur" id="bujur" name="bujur" type="text" placeholder="Bujur" disabled />
            </InputGroup>
            <div class="flex gap-32">
                <Message v-if="$form.lintang?.invalid" severity="error" size="small" variant="simple">{{ $form.lintang.error?.message }}</Message>
                <Message v-if="$form.bujur?.invalid" severity="error" size="small" variant="simple">{{ $form.bujur.error?.message }}</Message>
            </div>
        </div>
        <div class="flex grow gap-2 basis-[100%] justify-end mt-2">
            <Button
               v-if="isDialog" 
               type="button"
               label="Batal"
               severity="secondary"
               class="w-[10%]"
               @click="$emit('close')"></Button>
            <Button type="submit" label="Simpan" :fluid="false" class="w-[15%]"/>
        </div>
    </Form>
    <Dialog v-model:visible="visible" @show="initMap" header="Pilih Lokasi Rumah Anda" modal :style="{ width: '50vw' }">
        <div id="map"></div>
        <template #footer>
            <Button label="Batal" outlined severity="danger" @click="visible = false" :fluid="false"/>
            <Button label="Simpan" outlined severity="success" @click="saveLocation" :fluid="false"/>
        </template>
    </Dialog>
</template>

<style scoped>
#map {
    width: 100%;
    height: 400px;
}
</style>