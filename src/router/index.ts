import { useAuthStore } from "@/store/authStore";
import { createRouter, createWebHistory } from "vue-router";

declare module 'vue-router' {
    interface RouteMeta {
      requiresAuth: boolean;
      roles?: string[]; 
    }
}

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // component: () => import('@/components/AppLayout.vue'),
        // meta: { requiresAuth: true, roles: ['siswa', 'adminSD', 'adminSMP', 'adminDisdik'] }
        {
            path: '/',
            name: 'Home',
            redirect: { name: 'Login'}
        },
        {
            path: '/siswa',
            name: 'Siswa',
            component: () => import('@/components/AppLayout.vue'),
            meta: { requiresAuth: true, roles: ['siswa'] },
            children: [
                {
                    path: 'dashboard',
                    name: 'Dashboard-Siswa',
                    component: () => import('@/views/DashboardSiswa.vue'),
                    meta: { requiresAuth: true, roles: ['siswa'] },
                },
                {
                    path: 'biodata',
                    name: 'Biodata-Siswa',
                    component: () => import('@/views/adminSD/FormSiswa.vue'),
                    meta: { requiresAuth: true, roles: ['siswa'] }
                },
                {
                    path: 'dokumen',
                    name: 'Dokumen-Siswa',
                    component: () => import('@/components/forms/Dokumen.vue'),
                    meta: { requiresAuth: true, roles: ['siswa'] }
                },
                {
                    path: 'pendaftaran-zonasi',
                    name: 'Zonasi',
                    component: () => import('@/views/Zonasi.vue'),
                    meta: { requiresAuth: true, roles: ['siswa'] }
                },
                {
                    path: 'status-pendaftaran',
                    name: 'Status-Pendaftaran',
                    component: () => import('@/views/StatusPendaftaran.vue'),
                    meta: { requiresAuth: true, roles: ['siswa'] }
                },
                {
                    path: 'kuota-pendaftar',
                    name: 'Kuota-Pendaftar',
                    component: () => import('@/views/KuotaPendaftar.vue'),
                    meta: { requiresAuth: true, roles: ['siswa'] }
                },
                {
                    path: '/biodata-siswa/:id',
                    name: 'Biodata-Siswa-Dinamis',
                    component: () => import('@/views/adminSD/FormSiswa.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD', 'adminSMP', 'adminDisdik']}
                },
                {
                    path: '/dokumen-siswa/:id',
                    name: 'Dokumen-Siswa-Dinamis',
                    component: () => import('@/components/forms/Dokumen.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD', 'adminSMP']}
                },
            ]
        },
        {
            path: '/admin-sd',
            name: 'AdminSD',
            component: () => import('@/components/AppLayout.vue'),
            meta: { requiresAuth: true, roles: ['adminSD'] },
            children: [
                {
                    path: 'dashboard',
                    name: 'Dashboard-AdminSD',
                    component: () => import('@/views/adminSD/DashboardAdminSD.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD']},
                },
                {
                    path: 'profil',
                    name: 'ProfilSekolah-AdminSD',
                    component: () => import('@/views/adminSD/ProfilSekolah.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD']},
                },
                {
                    path: 'manajemen-user',
                    name: 'Manajemen-user-Siswa',
                    component: () => import('@/views/adminSD/ManajemenUser.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD']},
                },
                {
                    path: 'biodata-siswa',
                    name: 'Biodata-Siswa-AdminSD',
                    component: () => import('@/views/adminSD/ListSiswa.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD']}
                },
                {
                    path: 'pendaftaran-zonasi/belum-terdaftar',
                    name: 'Pendaftaran-Zonasi-Belum-Terdaftar',
                    component: () => import('@/views/adminSD/Zonasi/DaftarZonasi.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD']}
                },
                // {
                //     path: 'pendaftaran-zonasi/sudah-terdaftar',
                //     name: 'Pendaftaran-Zonasi-Sudah-Terdaftar',
                //     component: () => import('@/views/adminSD/Zonasi/SiswaTerdaftarZonasi.vue'),
                //     meta: { requiresAuth: true, roles: ['adminSD']}
                // },
                {
                    path: 'pendaftaran-zonasi/sudah-terdaftar',
                    name: 'Pendaftaran-Zonasi-Sudah-Terdaftar',
                    component: () => import('@/views/adminSD/Zonasi/SiswaTerdaftar.vue'),
                    meta: { requiresAuth: true, roles: ['adminSD']}
                }
            ]
        },
        {
            path: '/admin-smp',
            name: 'AdminSMP',
            component: () => import('@/components/AppLayout.vue'),
            meta: { requiresAuth: true, roles: ['adminSMP'] },
            children: [
                {
                    path: 'dashboard',
                    name: 'Dashboard-AdminSMP',
                    component: () => import('@/views/adminSMP/DashboardAdminSMP.vue'),
                    meta: { requiresAuth: true, roles: ['adminSMP']},
                },
                {
                    path: 'profil',
                    name: 'Profil-AdminSMP',
                    component: () => import('@/views/adminSMP/ProfilSekolah.vue'),
                    meta: { requiresAuth: true, roles: ['adminSMP']},
                },
                {
                    path: 'siswa-terdaftar',
                    name: 'SiswaTerdaftar-AdminSMP',
                    component: () => import('@/views/adminSMP/SiswaTerdaftar.vue'),
                    meta: { requiresAuth: true, roles: ['adminSMP']},
                },
                {
                    path: 'kelulusan',
                    name: 'Kelulusan-AdminSMP',
                    component: () => import('@/views/adminSMP/Kelulusan.vue'),
                    meta: { requiresAuth: true, roles: ['adminSMP']},
                },
            ]
        },
        {
            path: '/admin-disdik',
            name: 'AdminDisdik',
            component: () => import('@/components/AppLayout.vue'),
            meta: { requiresAuth: true, roles: ['adminDisdik'] },
            children: [
                {
                    path: 'dashboard',
                    name: 'Dashboard-AdminDisdik',
                    component: () => import('@/views/adminDisdik/DashboardAdminDisdik.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-user-admin',
                    name: 'ManajemenUserAdmin-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenUserAdmin.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-periode',
                    name: 'ManajemenPeriode-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenPeriode.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-sekolah',
                    name: 'ManajemenSekolah-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenSekolah.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'profil-sekolah/:id',
                    name: 'ProfilSekolah-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ProfilSekolahDinamis.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-zonasi',
                    name: 'ManajemenZonasi-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenZonasi.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-periode/:id',
                    name: 'ManajemenPeriodeJalur-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenPeriodeJalur.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-jadwal/:id',
                    name: 'ManajemenJadwal-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenJadwal.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-kuota',
                    name: 'ManajemenKuota-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenKuota.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'manajemen-siswa',
                    name: 'ManajemenSiswa-AdminDisdik',
                    component: () => import('@/views/adminDisdik/ManajemenSiswa.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                },
                {
                    path: 'pendaftaran-zonasi',
                    name: 'PendaftaranZonasi-AdminDisdik',
                    component: () => import('@/views/adminDisdik/PendaftaranZonasiList.vue'),
                    meta: { requiresAuth: true, roles: ['adminDisdik']},
                }
            ]
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/Login.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/change-password',
            name: 'Change-Password',
            component: () => import('@/views/ChangePassword.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/set-password',
            name: 'Set-Password',
            component: () => import('@/views/SetPassword.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/access-denied',
            name: 'Forbidden',
            component: () => import('@/views/Forbidden.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            component: () => import('@/views/NotFound.vue'),
            meta: { requiresAuth: false }
        },

    
        // {
        //     path: '/dashboard/siswa',
        //     name: 'Siswa',
        //     component: () => import('@/components/HelloWorld.vue'),
        //     meta: { requiresAuth: true, roles: ['siswa']}
        // }
        // tambahakn routes lainnya
    ]
})

router.beforeEach(async(to) => {
    const authStore = useAuthStore()
    console.log(authStore.isLoggedIn)
    // console.log(authStore.access_token)
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        // console.log("if 1")
        try {
            console.log("hello from try")
            await authStore.refresh()
            // console.log(authStore.refreshing)
        } catch (error) {
            console.log("hello from catch")
            await authStore.logout()
            return { name: 'Login' }
        }
    }

    if (to.name === 'Login' && authStore.isLoggedIn) {
        const user = authStore.user
        if(!user) {
            return { name: 'Login' }
        }
        console.log(user)
        console.log(authStore.access_token)
        switch(user.role) {
            case 'siswa':
                return { name: 'Dashboard-Siswa' }
            case 'adminSD':
                return { name: 'Dashboard-AdminSD'}
            case 'adminSMP': 
                return { name: 'Dashboard-AdminSMP'}
            case 'adminDisdik':
                return { name: 'Dashboard-AdminDisdik'}
        }
    }

    if (to.meta.roles) {
        console.log("if 2")
        const userRole = authStore.user?.role
        if(!userRole) {
            if (to.name !== 'Login') {
                return { name: 'Login' }
            }
            return
        }
        if(!to.meta.roles.includes(userRole)) {
            if (to.name !== 'Login') {
                return { name: 'Forbidden' }
            }
            return
        }
    }
    console.log(to)
    return true
})

export default router