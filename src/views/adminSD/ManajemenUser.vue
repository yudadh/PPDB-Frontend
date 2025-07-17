<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useConfirm, useToast, type DataTablePageEvent } from 'primevue';
import { onMounted, reactive, ref } from 'vue';
import { isUserAdminSekolah } from '@/utils/userType';
import { useAuthStore } from '@/store/authStore';
import { deleteUser, getAllRoles, getALlUserBySekolahId, submitUserSiswa, updateUser } from '@/services/authService';
import type { CreateUserResponse, SubmitUserSiswa, UserSiswaDTO, UserSiswaWithIndex } from '@/interfaces/userInterface';
import { getAllSiswaBySekolahId } from '@/services/siswaService';
import type { SiswaDisplayData } from '@/interfaces/siswaInterface';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import type { FormSubmitEvent } from '@primevue/forms';
import { useSiswaDataStore } from '@/store/siswaDataStore';
import { useRouter } from 'vue-router';

const router = useRouter()
const authStore = useAuthStore()
const siswaStore = useSiswaDataStore()
const toast = useToast()
const confirm = useConfirm()
const page = ref<number>(0)
const limit = ref<number>(10)
const visible = ref(false)
// const changePassVisibility = ref(false)
const editModalVisibility = ref(false)
const siswaDatas = ref<SiswaDisplayData[]>()
const roleId = ref<number>(0)
const user_id = ref<number>(0)
const isLoading = ref<boolean>(false);

const goBack = () => {
   if (window.history.length > 1) {
      router.back();
   } else {
      router.push("/"); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
   }
};

const newUserInitialValues = reactive({
    username: '',
    siswa_id: 0
    // password: '',
    // is_otp: 0
})

const newUserResolver = zodResolver(
    z.object({
        username: z.string().min(1, "Email tidak boleh kosong").refine((val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
            message: 'Email tidak valid'
        }),
        siswa_id: z.number().int().nonnegative(),
    })
)

const editFormInitialValues = reactive({
    user_id: 0,
    username: ''
})

const editFormResolver = zodResolver(
    z.object({
        username: z.string().min(5, 'Username minimal 5 karakter')
        .regex(/^[A-Za-z0-9\@\.com]+$/, 'Username hanya menerima karakter alphanumeric dan @'),
        is_otp: z.boolean().transform((val: boolean) => val ? 1 : 0)
    })
)

function onPageChange(event: DataTablePageEvent) {
    page.value = event.page
    limit.value = event.rows
}

async function findRole() {
    const roles = await getAllRoles()
    const role = roles.find((role) => role.role_nama.toLowerCase() === 'siswa')
    if(role) {
        roleId.value = role.role_id
    }
}

const sekolah_id = isUserAdminSekolah(authStore.user) ? authStore.user.sekolah_id : 0

const users = ref<UserSiswaDTO[]>([])
onMounted( async () => {
    await findRole()
    const userAccounts = await getALlUserBySekolahId(sekolah_id, page.value + 1, limit.value)
    console.log(userAccounts)
    if (userAccounts.length !== 0) {
        users.value = userAccounts
    }
})

async function loadSiswa() {
    let siswaDisplayData = siswaStore.siswas
    if(siswaDisplayData.length === 0) {
        const { siswas } = await getAllSiswaBySekolahId(sekolah_id, 1, 50)
        siswaStore.storeSiswas(siswas)
    }
    const siswaIdUsers = users.value.map(user => user.siswa_id)
    siswaDatas.value = siswaDisplayData.filter((siswa) => !siswaIdUsers.includes(siswa.siswa_id))
    .map((siswa) => ({
        ...siswa,
        nama: `${siswa.nisn} - ${siswa.nama}`
    }))
}

async function openModal() {
    await loadSiswa()
    visible.value = true
}

async function onSubmitUser(form: FormSubmitEvent) {
    if (!form.valid) return
    try {
        isLoading.value = true
        if (roleId.value === 0) {
            console.log('Role id should not be 0')
        }

        const user: SubmitUserSiswa = {
            siswa_id: form.values.siswa_id,
            username: form.values.username,
            role_id: roleId.value
        }

        const response: CreateUserResponse = await submitUserSiswa(user)
        if(response && siswaDatas.value) {
            isLoading.value = false
            toast.add({ 
                severity: 'success', 
                summary: 'Sukses', 
                detail: 'Berhasil menambah user, link reset password telah dikirim ke email user',
                life: 2000
            });
            users.value.push(response)
            // const newUser = siswaDatas.value.find((data) => data.siswa_id === form.values.siswa_id)
            // if(newUser) {
            //     const new_user: UserSiswaDTO = {
            //         user_id: response.user_id,
            //         username: response.username,
            //         siswa_id: response.siswa_id,
            //         nama: response.nama
            //     }
            // }
            visible.value = false
        }
    } catch (error) {
        isLoading.value = false
        visible.value = false
        if (error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message,
                life: 3000
            });
        }
        visible.value = false
    }
}

function openEditModal(data: UserSiswaDTO) {
    user_id.value = data.user_id
    editFormInitialValues.username = data.username
    // const user = users.value.find((user) => user.user_id === data.user_id)
    // console.log(user)
    // if(user) {
    //     editFormInitialValues.username = user.username
    //     // editFormInitialValues.is_otp = user.is_otp === 1 ? true : false
    // }
    editModalVisibility.value = true
}

async function onUpdateUser(form: FormSubmitEvent) {
    try {
        console.log(form)
        const response = await updateUser(user_id.value, form.values.username, null)
        if(response) {
            toast.add({ 
                severity: 'success', 
                summary: 'Sukses', 
                detail: 'Berhasil update user, link reset password telah dikirim ke email user',
                life: 1500
            });
            const editedUser = users.value.find((user) => user.user_id === user_id.value)
            if(editedUser) {
                editedUser.username = form.values.username
                // editedUser.is_otp = form.values.is_otp
            }
        }
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message,
                life: 3000
            });
        }
    } finally {
        editModalVisibility.value = false
    }
}

// function onOpenUpdatePasswordModal(data: UserSiswaDTO) {
//     user_id.value = data.user_id
//     changePassVisibility.value = true
// }

// async function onUpdateUserPassword(form: FormSubmitEvent) {
//     try {
//         const response = await updateUserPassword(user_id.value, form.values.new_password)
//         if(response) {
//             toast.add({ 
//                 severity: 'success', 
//                 summary: 'Sukses', 
//                 detail: 'Berhasil mengganti password',
//                 life: 1500
//             });
//         }
//         // changePassInitialValues.new_password = ''
//     } catch (error) {
//         if(error instanceof Error) {
//             toast.add({ 
//                 severity: 'error', 
//                 summary: 'Gagal', 
//                 detail: error.message,
//                 life: 1500
//             });
//         }
        
//     } finally {
//         changePassVisibility.value = false
//     }
// }

async function onDeleteUser(data: UserSiswaWithIndex) {
    console.log(data)
    confirm.require({
        message: 'Anda yakin ingin menghapus akun siswa?',
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
                const response = await deleteUser(data.user_id)
                if(response) {
                    toast.add({ 
                        severity: 'success', 
                        summary: 'Sukses', 
                        detail: 'Berhasil menghapus user', 
                        life: 1500 
                    });
                    users.value = users.value.filter((data) => data.user_id !== response.user_id)
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
            
        }
    });
}

// const op = ref()
// const toggle = (event: Event) => {
//     op.value.toggle(event);
// }



</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <!-- <ConfirmDialog></ConfirmDialog> -->
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-6">
                    <Button
                        label="Kembali"
                        severity="danger"
                        @click="goBack"
                        icon="pi pi-fw pi-arrow-left"
                        class="w-[10%] leading-5">
                    </Button>
                    <div class="text-xl font-bold">Manajemen User Siswa</div>
                    <!-- <Toolbar style="border-radius: 0.5rem; padding: 1rem 1rem 1rem 1.5rem; margin: 0;">
                        <template #end>
                            <Button label="Tambah User" icon="pi pi-plus" @click="openModal"></Button>
                        </template>
                    </Toolbar> -->
                    <DataTable :value="users" paginator :rows="10" :rowsPerPageOptions="[10, 15, 20]" tableStyle="min-width: 50rem" @page="onPageChange">
                        <template #header>
                            <div class="flex justify-between">
                                <div class="text-lg font-bold">Daftar User Siswa</div>
                                <Button label="Tambah User" icon="pi pi-plus" @click="openModal"></Button>
                            </div>
                        </template>
                        <template #empty> No users found. </template>
                        <Column header="No" style="width: 25%">
                            <template #body="{ index }">
                                {{ index + 1 }}
                            </template>
                        </Column>
                        <Column field="nama" header="Nama" style="width: 25%"></Column>
                        <Column field="username" header="Username" style="width: 25%"></Column>
                        <!-- <Column header="OTP" style="width: 10%">
                            <template #body="{ data }">
                                <Tag :icon="data.is_otp === 1 ? 'pi pi-check' : 'pi pi-times'" :severity="data.is_otp === 1 ? 'success' : 'danger'"></Tag>
                            </template>
                        </Column> -->
                        <Column  style="width: 25%">
                            <template #body="{ data }">
                                <div class="flex gap-4">
                                    <Button label="Edit" icon="pi pi-pencil" @click="openEditModal(data)"></Button>
                                    <!-- <Popover ref="op">
                                        <div class="flex flex-col gap-2">
                                            <Button label="Ganti Password" class="grow" icon="pi pi-pencil" severity="info" @click="onOpenUpdatePasswordModal(data)"></Button>
                                            <Button label="Edit Data User" class="grow" icon="pi pi-file" severity="info" @click="openEditModal(data)"></Button>
                                        </div>
                                    </Popover> -->
                                    <Button label="Hapus" severity="danger" icon="pi pi-trash" @click="onDeleteUser(data)"></Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <Dialog v-model:visible="visible" modal header="Tambah User" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="newUserResolver" :initialValues="newUserInitialValues" @submit="onSubmitUser" class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <div class="flex flex-col gap-2">
                                    <label for="siswa_id" class="font-semibold w-24">Siswa</label>
                                    <Select v-model="newUserInitialValues.siswa_id" name="siswa_id" id="siswa_id" filter :options="siswaDatas" optionLabel="nama" optionValue="siswa_id" placeholder="Pilih Siswa"></Select>
                                    <Message v-if="$form.siswa_id?.invalid" severity="error" size="small" variant="simple">{{ $form.siswa_id.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <label for="username" class="font-semibold w-24">Email</label>
                                    <InputText v-model="newUserInitialValues.username" name="username" id="username" class="flex-auto" autocomplete="off" placeholder="Username"/>
                                    <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{ $form.username.error.message }}</Message>
                                </div>
                                <!-- <div class="flex flex-col gap-2">
                                    <label for="password1" class="font-semibold w-24">Password</label>
                                    <Password id="password1" v-model="newUserInitialValues.password" name="password" placeholder="Password" :toggleMask="true" fluid :feedback="false"></Password>
                                    <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-8">
                                    <label for="is_otp" class="font-semibold w-24">OTP</label>
                                    <ToggleSwitch :v-model="newUserInitialValues.is_otp === 1 ? true : false" name="is_otp" />
                                    <Message v-if="$form.is_otp?.invalid" severity="error" size="small" variant="simple">{{ $form.is_otp.error.message }}</Message>
                                </div> -->
                            </div>
                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Batal" severity="secondary" @click="visible = false"></Button>
                                <Button type="submit" label="Simpan"></Button>
                            </div>
                        </Form>
                    </Dialog>
                    <!-- <Dialog v-model:visible="changePassVisibility" modal header="Ganti Password" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="changePassResolver" :initialValues="changePassInitialValues" @submit="" class="flex flex-col gap-4">
                            <div class="flex flex-col">
                                <div class="flex flex-col gap-2 mb-8">
                                    <label for="password" class="font-semibold w-24">Password</label>
                                    <Password id="password" name="new_password" v-model="changePassInitialValues.new_password" placeholder="Password" :toggleMask="true" fluid :feedback="false"></Password>
                                    <Message v-if="$form.new_password?.invalid" severity="error" size="small" variant="simple">{{ $form.new_password.error.message }}</Message>
                                </div>
                            </div>
                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Batal" severity="secondary" @click="visible = false"></Button>
                                <Button type="submit" label="Simpan"></Button>
                            </div>
                        </Form>
                    </Dialog> -->
                    <Dialog v-model:visible="editModalVisibility" modal header="Edit User" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="editFormResolver" :initialValues="editFormInitialValues" @submit="onUpdateUser" class="flex flex-col gap-4">
                            <div class="flex flex-col gap-2">
                                <div class="flex flex-col gap-2">
                                    <label for="username" class="font-semibold w-24">Username</label>
                                    <InputText v-model="editFormInitialValues.username" name="username" id="username" class="flex-auto" autocomplete="off" placeholder="Username"/>
                                    <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{ $form.username.error.message }}</Message>
                                </div>
                                <!-- <div class="flex flex-col gap-2 mb-8">
                                    <label for="is_otp" class="font-semibold w-24">OTP</label>
                                    <ToggleSwitch :v-model="editFormInitialValues.is_otp" name="is_otp" />
                                    <Message v-if="$form.is_otp?.invalid" severity="error" size="small" variant="simple">{{ $form.is_otp.error.message }}</Message>
                                </div> -->
                            </div>
                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Batal" severity="secondary" @click="editModalVisibility = false"></Button>
                                <Button type="submit" label="Simpan"></Button>
                            </div>
                        </Form>
                    </Dialog>
                    <Dialog
                       v-model:visible="isLoading"
                       modal
                       header="Pembuatan User Sedang di Proses"
                       :style="{ width: '25rem' }">
                       <ProgressBar
                          mode="indeterminate"
                          style="height: 6px"></ProgressBar>
                    </Dialog>
                </div>
            </div>
        </div>
    </div>
</template>