<script setup lang="ts">
import {  nextTick, onMounted, reactive, ref, watch } from 'vue';
import { Form } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import type { SubmitEventForm } from '@/interfaces/layoutInterface';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import type { SiswaDTO, SiswaForm  } from "@/interfaces/siswaInterface";
import { useRouter } from 'vue-router';
import { getAllProvinsi, getBanjarByDesaId, getDesaByKecamatanId, getKabupatenByProvinsiId, getKecamatanByKabupatenId } from '@/services/wilayahService';
import type { GetProvinsi, GetKabupaten, GetKecamatan, GetDesa, GetBanjar } from "@/interfaces/wilayahInterface";
import { getAllAgama, getAllPekerjaan, getAllPenghasilan } from '@/services/sekolahService';
import type { GetAgama, GetPekerjaan, GetPenghasilan } from '@/interfaces/sekolahInterface';
import L from 'leaflet'
import { useAuthStore } from '@/store/authStore';
import { isUserSiswa } from '@/utils/userType';
import { useSiswaDataStore } from '@/store/siswaDataStore';

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const siswaDataStore = useSiswaDataStore()
const router = useRouter()

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/'); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
    }
};

const field = z.object({
    nama: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z\s]+$/, "input hanya menerima huruf"),
    nik: z.string().min(1, "field tidak boleh kosong").max(16).regex(/^[0-9]+$/, "input hanya menerima angka"),
    nisn: z.string().min(1, "field tidak boleh kosong").max(16).regex(/^[0-9]+$/, "input hanya menerima angka"),
    provinsi_id: z.number().int().positive(),
    kabupaten_id: z.number().int().positive(),
    kecamatan_id: z.number().int().positive(),
    desa_id: z.number().int().positive(),
    banjar_id: z.number().int().positive(),
    alamat_kk: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z0-9\s\./]+$/, "input karakter tidak valid"),
    alamat_tinggal: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z0-9\s\./]+$/, "input karakter tidak valid"),
    jenis_kelamin: z.enum(["L", "P"]),
    agama_id: z.number().int().positive(),
    kebutuhan_khusus: z.number().int().nonnegative().max(1),
    tempat_lahir: z.string().regex(/^[A-Za-z\s]+$/, "input hanya menerima huruf"),
    tanggal_lahir: z.date().transform((val) => new Date(val).toISOString()),
    nama_ibu: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z\s]+$/, "input hanya menerima huruf"),
    pekerjaan_ibu_id: z.number().int().positive(),
    penghasilan_ibu_id: z.number().int().positive(),
    nama_ayah: z.string().min(1, "field tidak boleh kosong").regex(/^[A-Za-z\s]+$/, "input hanya menerima huruf"),
    pekerjaan_ayah_id: z.number().int().positive(),
    penghasilan_ayah_id: z.number().int().positive(),
    nama_wali: z.nullable(z.string()).refine(
        (value) => value === undefined || value === null || value === "" || /^[A-Za-z\s]+$/.test(value),
        "Nama wali hanya boleh berisi huruf dan spasi")
        .transform((val) => (val === "" ? null : val)),
    pekerjaan_wali_id: z.nullable(z.number().int().positive()),
    penghasilan_wali_id: z.nullable(z.number().int().positive()),
    lintang: z.string().transform((val) => Number(val)),
    bujur: z.string().transform((val) => Number(val))
    
})

const resolver = ref(zodResolver(field))
const formData = reactive<SiswaForm>({
    siswa_id: null,
    user_id: Number(sessionStorage.getItem('user_id')),
    nama: '',
    nik: '',
    nisn: '',
    provinsi_id: null,
    kabupaten_id: null,
    kecamatan_id: null,
    desa_id: null,
    banjar_id: null,
    sekolah_asal_id: null,
    alamat_kk: '',
    isluartabanan: null,
    alamat_tinggal: '',
    nomor_telepon: null,
    jenis_kelamin: null,
    agama_id: null,
    kebutuhan_khusus: null,
    tempat_lahir: '',
    tanggal_lahir: null,
    nama_ibu: '',
    pekerjaan_ibu_id: null,
    penghasilan_ibu_id: null,
    nama_ayah: '',
    pekerjaan_ayah_id: null,
    penghasilan_ayah_id: null,
    nama_wali: null,
    pekerjaan_wali_id: null,
    penghasilan_wali_id: null,
    lintang: null,
    bujur: null
})


const jenisKelamin = ref([
    {label: 'laki-laki', value: 'L'},
    {label: 'perempuan', value: 'P'}
])

const kebutuhanKhusus = ref([
    {label: 'Ya', value: 1},
    {label: 'Tidak', value: 0}
])


const siswa_id = isUserSiswa(authStore.user) ? authStore.user.siswa_id : 0
if(!siswa_id || isNaN(Number(siswa_id))) {
    console.log('tidak ada siswa_id')
    console.log(authStore.user)   
}

const visible = ref(false)
const map = ref<L.Map>()
const lintang = ref()
const bujur = ref()

const initMap = async () => {
    await nextTick()

    if(map.value) {
        map.value.remove()
    }

    map.value = L.map('map').setView([Number(formData.lintang), Number(formData.bujur)], 16); // Default view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value);

    // Tambahkan marker
    const marker = L.marker([Number(formData.lintang), Number(formData.bujur)], { draggable: true }).addTo(map.value);

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

const saveLocation = () => {
    formData.lintang = lintang.value.toString()
    formData.bujur = bujur.value.toString()
    visible.value = false
}

const isLoading = ref(true)
const tanggal_lahir = ref()
const provinsiDropdown = ref<GetProvinsi[]>([])
const kabupatenDropdown = ref<GetKabupaten[]>([])
const kecamatanDropdown = ref<GetKecamatan[]>([])
const desaDropdown = ref<GetDesa[]>([])
const banjarDropdown = ref<GetBanjar[]>([])
const agamaDropdown = ref<GetAgama[]>([])
const pekerjaanDropdown = ref<GetPekerjaan[]>([])
const penghasilanDropdown = ref<GetPenghasilan[]>([])
onMounted( async() => {
    try {
        
        const siswaData = await siswaDataStore.getSiswaData(siswa_id)
        if (siswaData) {
            // tanggal_lahir.value = new Date(siswaData.tanggal_lahir)
            if(siswaData.tanggal_lahir) {
                siswaData.tanggal_lahir = new Date(siswaData.tanggal_lahir)
            }
        
            Object.assign(formData, siswaData)

            if(formData.lintang && formData.bujur) {
                formData.lintang = formData.lintang.toString()
                formData.bujur = formData.bujur.toString()
            }
        }

        const provinsis = await getAllProvinsi();
        if (provinsis) {
            provinsiDropdown.value = provinsis;
        }

        if (formData?.provinsi_id) {
            const kabupatens = await getKabupatenByProvinsiId(formData.provinsi_id);
            if (kabupatens) {
                kabupatenDropdown.value = kabupatens;
            }
        }

        if (formData?.kabupaten_id) {
            const kecamatans = await getKecamatanByKabupatenId(formData.kabupaten_id);
            if (kecamatans) {
                kecamatanDropdown.value = kecamatans;
            }
        }

        if (formData?.kecamatan_id) {
            const desas = await getDesaByKecamatanId(formData.kecamatan_id);
            if (desas) {
                desaDropdown.value = desas;
            }
        }

        if (formData?.desa_id) {
            const banjars = await getBanjarByDesaId(formData.desa_id);
            if (banjars) {
                banjarDropdown.value = banjars;
            }
        }
        
        const agamas = await getAllAgama()
        if(agamas) {
            agamaDropdown.value = agamas
        }

        const pekerjaans = await getAllPekerjaan()
        if(pekerjaans) {
            pekerjaanDropdown.value = pekerjaans
        }

        const penghasilans = await getAllPenghasilan()
        if(penghasilans) {
            penghasilanDropdown.value = penghasilans
        }

    } catch (error) {
        console.error("Error fetching siswa", error);
    } finally {
        isLoading.value = false
    }
})

watch( () => formData.kabupaten_id, async (newId) => {
    try {
        if(newId) {
            const kecamatans= await getKecamatanByKabupatenId(newId)
            kecamatanDropdown.value = kecamatans
        }
    } catch (error) {
        console.log(error)
    }
})

watch( () => formData.kecamatan_id, async (newId) => {
    try {
        if(newId) {
            const desas= await getDesaByKecamatanId(newId)
            desaDropdown.value = desas
        }
    } catch (error) {
        console.log(error)
    }
})

watch( () => formData.desa_id, async (newId) => {
    try {
        if(newId) {
            const banjars= await getBanjarByDesaId(newId)
            banjarDropdown.value = banjars
        }
    } catch (error) {
        console.log(error)
    }
})

function handleSubmit(form: SubmitEventForm) {
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
                if(form.valid === false) {
                    toast.add({ 
                        severity: 'error', 
                        summary: 'Gagal', 
                        detail: 'Form tidak valid',
                        life: 1500
                    });
                    return
                }
                form.values.siswa_id = formData.siswa_id
                form.values.user_id = formData.user_id
                form.values.sekolah_asal_id = formData.sekolah_asal_id
                form.values.isluartabanan = formData.isluartabanan
                form.values.nomor_telepon = formData.nomor_telepon
                // console.log(form.values)
                const response = await siswaDataStore.updateSiswaData(formData.siswa_id!, form.values as SiswaDTO)
                if(response === 200) {
                    const formValues = {
                        ...form.values,
                        lintang: form.values.lintang.toString(),
                        bujur: form.values.bujur.toString()
                    }
                    // console.log(formValues)
                    Object.assign(formData, formValues)
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
// console.log(formData)

</script>

<template>
    <Fluid>
        <div class="flex flex-col md:flex-row gap-8">
            <Toast />
            <div class="md:w-full">
                <div class="card flex flex-col gap-4">
                    <div class="flex flex-col gap-4">
                        <Button label="Kembali" severity="danger" @click="goBack" icon="pi pi-fw pi-arrow-left" class="w-[10%] leading-5" :fluid="false"></Button>
                        <div class="font-semibold text-xl">Biodata Diri</div>
                    </div>
                    <Form v-slot="$form" :initialValues="formData" :resolver="resolver" @submit="handleSubmit" class="flex flex-wrap gap-4 sm:w-56 md:w-full" v-if="!isLoading">
                        <div class="flex flex-col grow basis-1/3 gap-2">
                            <label for="nama" >Nama</label>
                            <InputText v-model="formData.nama" id="nama" name="nama" type="text" placeholder="Nama" fluid></InputText>
                            <Message v-if="$form.nama?.invalid" severity="error" size="small" variant="simple">{{ $form.nama.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/4 gap-2">
                            <label for="nik" >NIK</label>
                            <InputText v-model="formData.nik" id="nik" name="nik" type="text" placeholder="NIK" fluid disabled ></InputText>
                            <Message v-if="$form.nik?.invalid" severity="error" size="small" variant="simple">{{ $form.nik.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/4 gap-2">
                            <label for="nisn" >NISN</label>
                            <InputText v-model="formData.nisn" id="nisn" name="nisn" type="text" placeholder="NISN" fluid disabled ></InputText>
                            <Message v-if="$form.nisn?.invalid" severity="error" size="small" variant="simple">{{ $form.nisn.error?.message }}</Message>
                        </div>
                        <div class="font-semibold text-lg flex flex-col grow basis-[100%]">Wilayah</div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="provinsi_id" >Provinsi</label>
                            <Select v-model="formData.provinsi_id" id="provinsi_id" name="provinsi_id" :options="provinsiDropdown" optionLabel="provinsi_nama" optionValue="provinsi_id" placeholder="Pilih Provinsi" disabled fluid />
                            <Message v-if="$form.provinsi_id?.invalid" severity="error" size="small" variant="simple">{{ $form.provinsi_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="kabupaten_id" >Kabupaten</label>
                            <Select v-model="formData.kabupaten_id" id="kabupaten_id" name="kabupaten_id" :options="kabupatenDropdown" optionLabel="kabupaten_nama" optionValue="kabupaten_id" placeholder="Pilih Kabupaten" fluid />
                            <Message v-if="$form.kabupaten_id?.invalid" severity="error" size="small" variant="simple">{{ $form.kabupaten_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/5 gap-2">
                            <label for="kecamatan_id" >Kecamatan</label>
                            <Select v-model="formData.kecamatan_id" id="kecamatan_id" name="kecamatan_id" :options="kecamatanDropdown" optionLabel="kecamatan_nama" optionValue="kecamatan_id" placeholder="Pilih Kecamatan" fluid />
                            <Message v-if="$form.kecamatan_id?.invalid" severity="error" size="small" variant="simple">{{ $form.kecamatan_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/5 gap-2">
                            <label for="desa_id" >Desa/Kelurahan</label>
                            <Select v-model="formData.desa_id" id="desa_id" name="desa_id" :options="desaDropdown" optionLabel="desa_nama" optionValue="desa_id" placeholder="Pilih Desa/Kelurahan" fluid />
                            <Message v-if="$form.desa_id?.invalid" severity="error" size="small" variant="simple">{{ $form.desa_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/5 gap-2">
                            <label for="banjar_id" >Banjar</label>
                            <Select v-model="formData.banjar_id" id="banjar_id" name="banjar_id" :options="banjarDropdown" optionLabel="banjar_nama" optionValue="banjar_id" placeholder="Pilih Banjar" fluid />
                            <Message v-if="$form.banjar_id?.invalid" severity="error" size="small" variant="simple">{{ $form.banjar_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-[35%] gap-2">
                            <label for="alamat_kk" >Alamat KK</label>
                            <InputText v-model="formData.alamat_kk" id="alamat_kk" name="alamat_kk" type="text" placeholder="Alamat KK" fluid />
                            <Message v-if="$form.alamat_kk?.invalid" severity="error" size="small" variant="simple">{{ $form.alamat_kk.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-[35%] gap-2">
                            <label for="alamat_tinggal" >Alamat Tinggal</label>
                            <InputText v-model="formData.alamat_tinggal" id="alamat_tinggal" name="alamat_tinggal" type="text" placeholder="Alamat Tinggal" fluid />
                            <Message v-if="$form.alamat_tinggal?.invalid" severity="error" size="small" variant="simple">{{ $form.alamat_tinggal.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-[15%] gap-2">
                            <label for="nomor_telepon" >Nomor Telepon</label>
                            <InputText v-model="formData.nomor_telepon" id="nomor_telepon" name="nomor_telepon" type="text" placeholder="Nomor Telepon" fluid />
                            <Message v-if="$form.nomor_telepon?.invalid" severity="error" size="small" variant="simple">{{ $form.nomor_telepon.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="agama_id" >Agama</label>
                            <Select v-model="formData.agama_id" id="agama_id" name="agama_id" :options="agamaDropdown" optionLabel="nama_agama" optionValue="agama_id" placeholder="Pilih Agama" fluid />
                            <Message v-if="$form.agama_id?.invalid" severity="error" size="small" variant="simple">{{ $form.agama_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="tempat_lahir" >Tempat Lahir</label>
                            <InputText v-model="formData.tempat_lahir" id="tempat_lahir" name="tempat_lahir" placeholder="Tempat Lahir" fluid/>
                            <Message v-if="$form.tempat_lahir?.invalid" severity="error" size="small" variant="simple">{{ $form.tempat_lahir.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="tanggal_lahir" >Tanggal Lahir</label>
                            <DatePicker v-model="tanggal_lahir" id="tanggal_lahir" name="tanggal_lahir" placeholder="Pilih Tanggal Lahir" showButtonBar showIcon fluid />
                            <Message v-if="$form.tanggal_lahir?.invalid" severity="error" size="small" variant="simple">{{ $form.tanggal_lahir.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="jenis_kelamin" >Jenis Kelamin</label>
                            <Select v-model="formData.jenis_kelamin" id="jenis_kelamin" name="jenis_kelamin" :options="jenisKelamin" optionLabel="label" optionValue="value" placeholder="Pilih Jenis Kelamin" showClear fluid />
                            <Message v-if="$form.jenis_kelamin?.invalid" severity="error" size="small" variant="simple">{{ $form.jenis_kelamin.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="kebutuhan_khusus" >Kebutuhan Khusus</label>
                            <Select v-model="formData.kebutuhan_khusus" id="kebutuhan_khusus" name="kebutuhan_khusus" :options="kebutuhanKhusus" optionLabel="label" optionValue="value" placeholder="Pilih" showClear fluid />
                            <Message v-if="$form.kebutuhan_khusus?.invalid" severity="error" size="small" variant="simple">{{ $form.kebutuhan_khusus.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="bujur" >Lokasi Rumah</label>
                            <InputGroup>
                                <Button icon="pi pi-pen-to-square" @click="visible = true" />
                                <InputText v-model="formData.lintang" id="lintang" name="lintang" type="text" placeholder="Lintang" disabled />
                                <InputText v-model="formData.bujur" id="bujur" name="bujur" type="text" placeholder="Bujur" disabled />
                            </InputGroup>
                            <Message v-if="$form.lintang?.invalid" severity="error" size="small" variant="simple">{{ $form.lintang.error?.message }}</Message>
                            <Message v-if="$form.bujur?.invalid" severity="error" size="small" variant="simple">{{ $form.bujur.error?.message }}</Message>
                        </div>
                        <Dialog v-model:visible="visible" @show="initMap" header="Pilih Lokasi Rumah Anda" modal :style="{ width: '50vw' }">
                            <div id="map"></div>
                            <template #footer>
                                <Button label="Batal" outlined severity="danger" @click="visible = false" :fluid="false"/>
                                <Button label="Simpan" outlined severity="success" @click="saveLocation" :fluid="false"/>
                            </template>
                        </Dialog>
                        <div class="font-semibold text-xl flex flex-col grow basis-[100%] mt-2">Biodata Orang Tua/Wali</div>
                        <div class="flex flex-col grow basis-1/3 gap-2">
                            <label for="nama_ibu" >Nama Ibu Kandung</label>
                            <InputText v-model="formData.nama_ibu" id="nama_ibu" name="nama_ibu" type="text" placeholder="Nama Ibu Kandung" fluid ></InputText>
                            <Message v-if="$form.nama_ibu?.invalid" severity="error" size="small" variant="simple">{{ $form.nama_ibu.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="pekerjaan_ibu_id" >Pekerjaan Ibu</label>
                            <Select v-model="formData.pekerjaan_ibu_id" id="pekerjaan_ibu_id" name="pekerjaan_ibu_id" :options="pekerjaanDropdown" optionLabel="nama_pekerjaan" optionValue="pekerjaan_id" placeholder="Pilih Pekerjaan Ibu" showClear fluid />
                            <Message v-if="$form.pekerjaan_ibu_id?.invalid" severity="error" size="small" variant="simple">{{ $form.pekerjaan_ibu_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="penghasilan_ibu_id" >Penghasilan Ibu</label>
                            <Select v-model="formData.penghasilan_ibu_id" id="penghasilan_ibu_id" name="penghasilan_ibu_id" :options="penghasilanDropdown" optionLabel="penghasilan" optionValue="penghasilan_id" placeholder="Pilih Penghasilan Ibu" showClear fluid />
                            <Message v-if="$form.penghasilan_ibu_id?.invalid" severity="error" size="small" variant="simple">{{ $form.penghasilan_ibu_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/3 gap-2">
                            <label for="nama_ayah" >Nama Ayah</label>
                            <InputText v-model="formData.nama_ayah" id="nama_ayah" name="nama_ayah" type="text" placeholder="Nama Ayah" fluid ></InputText>
                            <Message v-if="$form.nama_ayah?.invalid" severity="error" size="small" variant="simple">{{ $form.nama_ayah.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="pekerjaan_ayah_id" >Pekerjaan Ayah</label>
                            <Select v-model="formData.pekerjaan_ayah_id" id="pekerjaan_ayah_id" name="pekerjaan_ayah_id" :options="pekerjaanDropdown" optionLabel="nama_pekerjaan" optionValue="pekerjaan_id" placeholder="Pilih Pekerjaan Ayah" showClear fluid />
                            <Message v-if="$form.pekerjaan_ayah_id?.invalid" severity="error" size="small" variant="simple">{{ $form.pekerjaan_ayah_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="penghasilan_ayah_id" >Penghasilan Ayah</label>
                            <Select v-model="formData.penghasilan_wali_id" id="penghasilan_ayah_id" name="penghasilan_ayah_id" :options="penghasilanDropdown" optionLabel="penghasilan" optionValue="penghasilan_id" placeholder="Pilih Penghasilan Ayah" showClear fluid />
                            <Message v-if="$form.penghasilan_ayah_id?.invalid" severity="error" size="small" variant="simple">{{ $form.penghasilan_ayah_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/3 gap-2">
                            <label for="nama_wali" >Nama Wali</label>
                            <InputText v-model="formData.nama_wali" id="nama_wali" name="nama_wali" type="text" placeholder="Nama Wali" fluid ></InputText>
                            <Message v-if="$form.nama_wali?.invalid" severity="error" size="small" variant="simple">{{ $form.nama_wali.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="pekerjaan_wali_id" >Pekerjaan Wali</label>
                            <Select v-model="formData.pekerjaan_wali_id" id="pekerjaan_wali_id" name="pekerjaan_wali_id" :options="pekerjaanDropdown" optionLabel="nama_pekerjaan" optionValue="pekerjaan_id" placeholder="Pilih Pekerjaan Wali" showClear fluid />
                            <Message v-if="$form.pekerjaan_wali_id?.invalid" severity="error" size="small" variant="simple">{{ $form.pekerjaan_wali_id.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col grow basis-1/6 gap-2">
                            <label for="penghasilan_wali_id" >Penghasilan Wali</label>
                            <Select v-model="formData.penghasilan_wali_id" id="penghasilan_wali_id" name="penghasilan_wali_id" :options="penghasilanDropdown" optionLabel="penghasilan" optionValue="penghasilan_id" placeholder="Pilih Penghasilan Wali" showClear fluid />
                            <Message v-if="$form.penghasilan_wali_id?.invalid" severity="error" size="small" variant="simple">{{ $form.penghasilan_wali_id.error?.message }}</Message>
                        </div>
                        <div class="flex grow basis-[100%] gap-2 justify-end mt-4">
                            <!-- <Button severity="warn" label="Cancel" :fluid="false" class="w-[20%]"></Button> -->
                            <Button type="submit" label="Simpan" :fluid="false" class="w-[20%]"></Button>
                        </div>
                    </Form>
                    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" fill="transparent" 
                    animationDuration=".8s" aria-label="Custom ProgressSpinner" v-else/>
                </div>
            </div>
        </div>
    </Fluid>
</template>

<style scoped>
#map {
    width: 100%;
    height: 400px;
}
</style>
