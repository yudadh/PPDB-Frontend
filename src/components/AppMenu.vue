<script setup lang="ts">
import { computed } from 'vue';

import AppMenuItem from './AppMenuItem.vue';
import { useAuthStore } from '@/store/authStore';

interface SideBarMenu {
    label: string
    icon?: string
    to?: string
    separator?: boolean
    items?: SideBarMenu[]
}

const authStore = useAuthStore()

const userRole = computed(() => authStore.user ? authStore.user.role : sessionStorage.getItem('user_role'))
const menusByRole: Record<string, SideBarMenu[]> = {
    siswa: [
        {
            label: 'Menu Siswa',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/siswa/dashboard',},
                { label: 'Biodata', icon: 'pi pi-fw pi-user-edit', to: '/siswa/biodata'},
                { label: 'Dokumen', icon: 'pi pi-fw pi-file', to: '/siswa/dokumen'},
                {
                    label: 'Pendaftaran',
                    icon: 'pi pi-fw pi-clipboard',
                    items: [
                        {
                            label: 'Zonasi',
                            icon: 'pi pi-fw pi-map-marker',
                            to: '/siswa/pendaftaran-zonasi'
                        }
                    ]
                },
                { label: 'Status Pendaftaran', icon: 'pi pi-fw pi-check-square', to: '/siswa/status-pendaftaran'},
                { label: 'Kuota Pendaftaran', icon: 'pi pi-fw pi-warehouse', to: '/siswa/kuota-pendaftar'}

            ]
        }
    ],
    adminSD: [
        {
            label: 'Menu Admin SD',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/admin-sd/dashboard' },
                { label: 'Profil Sekolah', icon: 'pi pi-fw pi-warehouse', to: '/admin-sd/profil' },
                { label: 'Manajemen User Siswa', icon: 'pi pi-fw pi-users', to: '/admin-sd/manajemen-user' },
                { label: 'Data Siswa', icon: 'pi pi-fw pi-users', to: '/admin-sd/biodata-siswa' },
                { 
                    label: 'Pendaftaran Zonasi', 
                    icon: 'pi pi-fw pi-map-marker', 
                    to: '/admin-sd/manajemen-user',
                    items: [
                        { label: 'Siswa Belum Terdaftar', icon: 'pi pi-fw pi-user-plus', to: '/admin-sd/pendaftaran-zonasi/belum-terdaftar'},
                        { label: 'Siswa Terdaftar', icon: 'pi pi-fw pi-user-plus', to: '/admin-sd/pendaftaran-zonasi/sudah-terdaftar'},
                        // { label: 'Siswa Terverifikasi', icon: 'pi pi-fw pi-user-plus', to: '/admin-sd/pendaftaran-zonasi/sudah-terverifikasi'}
                    ] 
                }
            ]
        }
    ],
    adminSMP: [
        {
            label: 'Menu Admin SMP',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/admin-smp/dashboard' },
                { label: 'Profil Sekolah', icon: 'pi pi-fw pi-warehouse', to: '/admin-smp/profil' },
                { 
                    label: 'Pendaftaran Zonasi', 
                    icon: 'pi pi-fw pi-map-marker', 
                    items: [
                        { label: 'Siswa Terdaftar', icon: 'pi pi-fw pi-user-plus', to: '/admin-smp/siswa-terdaftar'},
                        { label: 'Kelulusan', icon: 'pi pi-fw pi-verified', to: '/admin-smp/kelulusan' }
                    ] 
                },
            ]
        }
    ],
    adminDisdik: [
        {
            label: 'Menu Admin Disdik',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/admin-disdik/dashboard' },
                { label: 'Manajemen User Admin', icon: 'pi pi-fw pi-users', to: '/admin-disdik/manajemen-user-admin' },
                { label: 'Manajemen Siswa', icon: 'pi pi-fw pi-user-edit', to: '/admin-disdik/manajemen-siswa' },
                { label: 'Manajemen Sekolah', icon: 'pi pi-fw pi-warehouse', to: '/admin-disdik/manajemen-sekolah' },
                { label: 'Manajemen Periode', icon: 'pi pi-fw pi-hourglass', to: '/admin-disdik/manajemen-periode' },
                { label: 'Manajemen Zonasi', icon: 'pi pi-fw pi-map', to: '/admin-disdik/manajemen-zonasi' },
                { label: 'Manajemen Kuota', icon: 'pi pi-fw pi-map', to: '/admin-disdik/manajemen-kuota' },
                {
                    label: 'Pendaftaran',
                    icon: 'pi pi-fw pi-clipboard',
                    items: [
                        {
                            label: 'Zonasi',
                            icon: 'pi pi-fw pi-map-marker',
                            to: '/admin-disdik/pendaftaran-zonasi'
                        }
                    ]
                },
            ]
        }
    ]
};

// const model = ref<SideBarMenu[]>([
//     {
//         label: 'Menu',
//         items: [
//             { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard-siswa',},
//             { label: 'Biodata', icon: 'pi pi-fw pi-user-edit', to: '/biodata-siswa'},
//             { label: 'Dokumen', icon: 'pi pi-fw pi-user-edit', to: '/dokumen-siswa'},
//             {
//                 label: 'Pendaftaran',
//                 icon: 'pi pi-fw pi-bookmark',
//                 items: [
//                     {
//                         label: 'Zonasi',
//                         icon: 'pi pi-fw pi-bookmark',
//                         to: '/pendaftaran-zonasi'
//                     },
//                     {
//                         label: 'Submenu 1.2',
//                         icon: 'pi pi-fw pi-bookmark',
//                         items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
//                     }
//                 ]
//             }

//         ]
//     }
// ]);

const model = computed(() => userRole.value ? menusByRole[userRole.value] : menusByRole['default'])
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
