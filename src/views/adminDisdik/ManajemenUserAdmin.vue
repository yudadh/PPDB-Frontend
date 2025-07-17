<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useConfirm, useToast, type DataTablePageEvent } from 'primevue';
import type { Roles, SubmitUserAdmin, UserAdminSekolah } from '@/interfaces/userInterface';
import { deleteUser, getAllRoles, getAllUserAdminSekolah, registerAdmin, updateUser } from '@/services/authService';
// import { isUserAdminSekolah } from '@/utils/userType';
import { FilterMatchMode } from '@primevue/core/api'
import type { PaginationMeta, SubmitEventForm } from '@/interfaces/layoutInterface';
import { z } from 'zod';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { debounce } from 'lodash';
import { useAuthStore } from '@/store/authStore';
import { useSekolahStore } from '@/store/sekolahDataStore';
import type { GetAllSekolahResponse } from '@/interfaces/sekolahInterface';

const confirm = useConfirm()
const toast = useToast()
const authStore = useAuthStore()
const sekolahStore = useSekolahStore()

const editModalVisibility = ref(false)
const user_id = ref<number>(0)
const addNewUserVisibility = ref(false)
const isLoading = ref(false)

const users = ref<UserAdminSekolah[]>([])
// editFormOptions
const roleOptions = ref<Roles[]>([])
const sekolahOptions = ref<{
    sekolah_id: number,
    sekolah_nama: string
}[]>([])

const meta = reactive<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0
})

const addFormInitialValues = reactive({
    username: '',
    // password: '',
    // is_otp: 0,
    sekolah_id: 0,
    role_id: 0
})

const addResolver = zodResolver(
    z.object({
        username: z.string().min(1, "Email tidak boleh kosong").refine((val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
            message: 'Email tidak valid'
        }),
        // password: z
        //     .string()
        //     .min(3, { message: 'Password minimal 3 karakter.' })
        //     .refine((value) => /[a-z]/.test(value), {
        //         message: 'Password harus berisi huruf kecil.'
        //     })
        //     .refine((value) => /[A-Z]/.test(value), {
        //         message: 'Password harus berisi huruf kapital.'
        //     })
        //     .refine((value) => /\d/.test(value), {
        //         message: 'Password harus berisi angka.'
        //     }),
        // is_otp: z.boolean().transform((val: boolean) => val === true ? 1 : 0),
        sekolah_id: z.number().int().positive("pilih sekolah"),
        role_id: z.number().int().positive("pilih role")
    })
)

const editFormInitialValues = reactive({
    username: '',
    sekolah_id: 0,
    role_id: 0
})

const editResolver = zodResolver(
    z.object({
        username: z.string().min(1, "Email tidak boleh kosong").refine((val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), {
            message: 'Email tidak valid'
        }),
        sekolah_id: z.number().int().nonnegative(),
        role_id: z.number().int().nonnegative()
    })
)

const filters = reactive({
    username: {value: null, matchMode: FilterMatchMode.CONTAINS},
    role: {value: null, matchMode: FilterMatchMode.EQUALS},
})

function onPageChange(event: DataTablePageEvent) {
    meta.page = event.page
    meta.limit = event.rows
}

// const sekolah_id = isUserAdminSekolah(authStore.user) ? authStore.user.sekolah_id : 0
onMounted( async () => {
    const response = await getAllUserAdminSekolah(meta.page, meta.limit, JSON.stringify(filters))
    console.log(response.users)
    if(response.users.length !== 0) {
        users.value = response.users
        meta.page = response.meta.page
        meta.limit = response.meta.limit
        meta.total = response.meta.total
    }
})

// async function submitUser() {
//     try {
//         if(roleId.value === 0) {
//             console.log('Role id should not be 0')
//         }

//         const user: SubmitUserSiswa = {
//             siswa_id: selectedSiswa.value,
//             username: username.value,
//             password: password.value,
//             role_id: roleId.value
//         }

//         const response: CreateUserResponse = await submitUserSiswa(user)
//         if(response && siswaDatas.value) {
//             toast.add({ 
//                 severity: 'success', 
//                 summary: 'Sukses', 
//                 detail: 'Berhasil mengganti password',
//                 life: 1500
//             });
//             const newUser = siswaDatas.value.find((data) => data.siswa_id === selectedSiswa.value)
//             if(newUser) {
//                 const new_user: UserSiswaDTO = {
//                     user_id: response.user_id,
//                     username: response.username,
//                     siswa_id: newUser.siswa_id,
//                     nama: newUser.nama
//                 }
//                 users.value.push(new_user)
//             }
//             visible.value = false
//         }
//     } catch (error) {
//         if(error instanceof Error) {
//             toast.add({ 
//                 severity: 'error', 
//                 summary: 'Gagal', 
//                 detail: error.message,
//                 life: 1500
//             });
//         }
//         visible.value = false
//     }
// }

const filteredRoles = new Set(['adminsd', 'adminsmp'])

async function openEditModal(data: UserAdminSekolah) {
    try {
        editModalVisibility.value = true
        user_id.value = data.user_id
        editFormInitialValues.username = data.username
        // editFormInitialValues.is_otp = data.is_otp === 1 ? true : false
        editFormInitialValues.sekolah_id = data.sekolah_id
        editFormInitialValues.role_id = data.role_id
        const rolesData = (await getAllRoles())
        .filter((role) => filteredRoles.has(role.role_nama.toLowerCase()))
        roleOptions.value = rolesData
        // await getSekolahDatas(data.role_id)
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
}

async function openAddModal() {
    try {
        const rolesData = ( authStore.roles.length == 0 ? await getAllRoles() : authStore.roles )
        .filter((role) => filteredRoles.has(role.role_nama.toLowerCase()))
        roleOptions.value = rolesData
        addNewUserVisibility.value = true
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
}

watch(() => addFormInitialValues.role_id, async (newRoleId) => {
    if (!newRoleId) return;
    // await nextTick()
    await getSekolahDatas(newRoleId)
}, {immediate: true})


const getSekolahDatas = debounce( async (newRoleId: number) => {
    const adminSD = roleOptions.value.find((role) => role.role_nama.toLowerCase() === "adminsd");
    const adminSMP = roleOptions.value.find((role) => role.role_nama.toLowerCase() === "adminsmp");

    let cacheData: GetAllSekolahResponse[] = [] 
    if (adminSD && newRoleId === adminSD.role_id) {
        if (!sekolahStore.sekolahSd.length) {
            await sekolahStore.loadSekolahSd()
        }
        
        cacheData = sekolahStore.sekolahSd
    } else if (adminSMP && newRoleId === adminSMP.role_id) {
        if (!sekolahStore.sekolahSmp.length) {
            await sekolahStore.loadSekolahSmp()
        }
        cacheData = sekolahStore.sekolahSmp
    }
    console.log(cacheData)
    sekolahOptions.value = cacheData
}, 300)

watch(() => editFormInitialValues.role_id, async (newRoleId) => {
    if (!newRoleId) return;
    // await nextTick()
    await getSekolahDatas(newRoleId)
}, {immediate: true});


async function onDeleteUser(data: UserAdminSekolah) {
    console.log(data)
    confirm.require({
        message: `Anda yakin ingin menghapus akun admin ${data.sekolah_nama}?`,
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
                        life: 2000 
                    });
                    users.value = users.value.filter((data) => data.user_id !== response.user_id)
                }
            } catch (error) {
                if(error instanceof Error) {
                    toast.add({ 
                        severity: 'error', 
                        summary: 'Gagal', 
                        detail: error.message, 
                        life: 2000  
                    });
                }
            }
        },
        reject: () => {
            
        }
    });
}


async function onAddUserFormSubmit(form: SubmitEventForm) {
    if (!form.valid) return
    try {
        isLoading.value = true
        const user: SubmitUserAdmin = {
            username: form.values.username,
            role_id: form.values.role_id,
            sekolah_id: form.values.sekolah_id
        }
        const response = await registerAdmin(user)
        if(response) {
            isLoading.value = false
            toast.add({ 
                severity: 'success', 
                summary: 'Sukses', 
                detail: 'User berhasil dibuat',
                life: 2000
            });
            const newRole = roleOptions.value.find((role) => role.role_id === response.role_id)
            if (newRole) {
                users.value.push({
                    user_id: response.user_id,
                    username: response.username,
                    role_id: response.role_id,
                    role: newRole.role_nama,
                    sekolah_id: response.sekolah_id,
                    sekolah_nama: response.sekolah_nama,
                })
            }
            addNewUserVisibility.value = false
        }
    } catch (error) {
        isLoading.value = false
        addNewUserVisibility.value = false
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message, 
                life: 2000 
            });
        }
    } finally {
        addNewUserVisibility.value = false
    }
}

function afterHideAddUser () {
    addFormInitialValues.username = ''
    addFormInitialValues.role_id = 0
    addFormInitialValues.sekolah_id = 0
}

async function onEditFormSubmit(form: SubmitEventForm) {
    try {
        const response = await updateUser(
            user_id.value, 
            form.values.username, 
            form.values.sekolah_id
        )
        if(response) {
            if(response) {
                toast.add({ 
                    severity: 'success', 
                    summary: 'Sukses', 
                    detail: 'User berhasil diupdate',
                    life: 2000
                });
            }
            const editedUser = users.value.find((user) => user.user_id === response.user_id)
            const newSekolah = sekolahOptions.value.find(
                (sekolah) => sekolah.sekolah_id === form.values.sekolah_id
            )
            if(editedUser && newSekolah) {
                editedUser.sekolah_id = newSekolah.sekolah_id
                editedUser.sekolah_nama = newSekolah.sekolah_nama
            }
        }
    } catch (error) {
        if(error instanceof Error) {
            toast.add({ 
                severity: 'error', 
                summary: 'Gagal', 
                detail: error.message, 
                life: 2000 
            });
        }
    } finally {
        editModalVisibility.value = false
    }
}

// const op = ref()
// const toggle = (event: Event) => {
//     op.value.toggle(event);
// }

</script>

<template>
    <div class="flex flex-col md:flex-row gap-8">
        <Toast />
        <div class="md:w-full">
            <div class="card">
                <div class="flex flex-col gap-4">
                    <div class="text-xl">Manajemen User Admin</div>
                    <DataTable :value="users" paginator :first="(meta.page - 1) * meta.limit" 
                    :totalRecords="meta.total" :rows="meta.limit" :lazy="true" :rowsPerPageOptions="[5, 10, 20]" 
                    tableStyle="min-width: 50rem" @page="onPageChange">
                        <template #header>
                            <div class="flex justify-between">
                                <div class="text-xl">
                                    Daftar User Admin Sekolah
                                </div>
                                <Button label="Tambah User" icon="pi pi-plus" @click="openAddModal"></Button>
                            </div>
                        </template>
                        <Column header="No" style="width: 10%">
                            <template #body="{ index }">
                                {{ (meta.page - 1) * meta.limit + index + 1 }}
                            </template>
                        </Column>
                        <Column field="username" header="Username" style="width: 25%"></Column>
                        <Column field="sekolah_nama" header="Sekolah" style="width: 25%"></Column>
                        <Column header="Role" style="width: 15%">
                            <template #body="{ data }">
                                {{ data.role === 'adminSD' ? 'Admin SD' : 'Admin SMP' }}
                            </template>
                        </Column>
                        <!-- <Column header="OTP" style="width: 10%">
                            <template #body="{ data }">
                                <Tag :icon="data.is_otp === 1 ? 'pi pi-check' : 'pi pi-times'" :severity="data.is_otp === 1 ? 'success' : 'danger'"></Tag>
                            </template>
                        </Column> -->
                        <Column  style="width: 25%">
                            <template #body="{ data }">
                                <div class="flex gap-2">
                                    <Button icon="pi pi-pencil" @click="openEditModal(data)"></Button>
                                    <!-- <Popover ref="op">
                                        <div class="flex flex-col gap-2">
                                            <Button label="Ganti Password" class="grow" icon="pi pi-pencil" severity="info" @click="openChangePasswordModal(data)"></Button>
                                            <Button label="Edit Data User" class="grow" icon="pi pi-file" severity="info" @click="openEditModal(data)"></Button>
                                        </div>
                                    </Popover> -->
                                    <Button severity="danger" icon="pi pi-trash" @click="onDeleteUser(data)"></Button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    <Dialog v-model:visible="addNewUserVisibility" modal header="Tambah User" @after-hide="afterHideAddUser" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="addResolver" :initialValues="addFormInitialValues" @submit="onAddUserFormSubmit" class="flex flex-col gap-4">
                            <div class="flex flex-col">
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="username" class="font-semibold w-24">Username</label>
                                    <InputText v-model="addFormInitialValues.username" id="username" name="username" class="flex-auto" autocomplete="off" placeholder="Username"/>
                                    <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{ $form.username.error.message }}</Message>
                                </div>
                                <!-- <div class="flex flex-col gap-2 mb-4">
                                    <label for="password" class="font-semibold w-24">Password</label>
                                    <Password v-model="addFormInitialValues.password" id="password" name="password" :toggleMask="true" fluid :feedback="false" autocomplete="off" placeholder="Password"/>
                                    <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error.message }}</Message>
                                </div> -->
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="role_id" class="font-semibold w-24">Role</label>
                                    <Select v-model="addFormInitialValues.role_id" name="role_id" :options="roleOptions" optionLabel="role_nama" optionValue="role_id" placeholder="Pilih Role"></Select>
                                    <Message v-if="$form.role_id?.invalid" severity="error" size="small" variant="simple">{{ $form.role_id.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="sekolah_id" class="font-semibold w-24">Sekolah</label>
                                    <Select v-model="addFormInitialValues.sekolah_id" name="sekolah_id" filter :options="sekolahOptions" optionLabel="sekolah_nama" optionValue="sekolah_id" placeholder="Pilih Sekolah"></Select>
                                    <Message v-if="$form.sekolah_id?.invalid" severity="error" size="small" variant="simple">{{ $form.sekolah_id.error.message }}</Message>
                                </div>
                                <!-- <div class="flex flex-col gap-2 mb-8">
                                    <label for="is_otp" class="font-semibold w-24">OTP</label>
                                    <ToggleSwitch :v-model="addFormInitialValues.is_otp === 1 ? true : false" name="is_otp" />
                                    <Message v-if="$form.is_otp?.invalid" severity="error" size="small" variant="simple">{{ $form.is_otp.error.message }}</Message>
                                </div> -->
                            </div>
                            <div class="flex justify-end gap-2">
                                <Button type="button" label="Batal" severity="secondary" @click="editModalVisibility = false"></Button>
                                <Button type="submit" label="Simpan"></Button>
                            </div>
                        </Form>
                    </Dialog> 
                    <Dialog v-model:visible="editModalVisibility" modal header="Edit User" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="editResolver" :initialValues="editFormInitialValues" @submit="onEditFormSubmit" class="flex flex-col gap-4">
                            <div class="flex flex-col">
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="username" class="font-semibold w-24">Username</label>
                                    <InputText v-model="editFormInitialValues.username" id="username" name="username" class="flex-auto" autocomplete="off" placeholder="Username"/>
                                    <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{ $form.username.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="role_id" class="font-semibold w-24">Role</label>
                                    <Select v-model="editFormInitialValues.role_id" name="role_id" :options="roleOptions" optionLabel="role_nama" optionValue="role_id" placeholder="Pilih Role"></Select>
                                    <Message v-if="$form.role_id?.invalid" severity="error" size="small" variant="simple">{{ $form.role_id.error.message }}</Message>
                                </div>
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="sekolah_id" class="font-semibold w-24">Sekolah</label>
                                    <Select v-model="editFormInitialValues.sekolah_id" name="sekolah_id" filter :options="sekolahOptions" optionLabel="sekolah_nama" optionValue="sekolah_id" placeholder="Pilih Sekolah"></Select>
                                    <Message v-if="$form.sekolah_id?.invalid" severity="error" size="small" variant="simple">{{ $form.sekolah_id.error.message }}</Message>
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
                    <!-- <Dialog v-model:visible="changePasswordVisibility" modal header="Ganti Password" :style="{ width: '25rem' }">
                        <Form v-slot="$form" :resolver="changePasswordResolver" :initialValues="changePasswordInitialValues" @submit="onChangePassword" class="flex flex-col gap-4">
                            <div class="flex flex-col">
                                <div class="flex flex-col gap-2 mb-4">
                                    <label for="password" class="font-semibold w-24">Password</label>
                                    <Password v-model="changePasswordInitialValues.password" id="password" name="password" :toggleMask="true" fluid :feedback="false" autocomplete="off" placeholder="Password"/>
                                    <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error.message }}</Message>
                                </div>
                                <div class="flex justify-end gap-2">
                                    <Button type="button" label="Batal" severity="secondary" @click="changePasswordVisibility = false"></Button>
                                    <Button type="submit" label="Simpan"></Button>
                                </div>
                            </div>
                        </Form>
                    </Dialog> -->
                </div>
            </div>
        </div>
    </div>
</template>