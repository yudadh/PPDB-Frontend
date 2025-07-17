<script setup lang="ts">
import { useLayout } from './composables/layout';
import { computed, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue';


const { layoutConfig, layoutState, isSidebarActive } = useLayout();

const outsideClickListener = ref<((event: MouseEvent) => void) | null>(null);
const confirm = useConfirm()
const authStore = useAuthStore()
const router = useRouter()

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive
    };
});



function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event: MouseEvent) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event: MouseEvent): boolean {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');
    if (!sidebarEl || !topbarEl) {
        // Jika salah satu elemen tidak ditemukan, anggap kliknya berada di luar
        return true;
    }

    return !(sidebarEl.isSameNode(event.target as Node) || sidebarEl.contains(event.target as Node) || topbarEl.isSameNode(event.target as Node) || topbarEl.contains(event.target as Node));
}

function onLogout() {
    confirm.require({
        message: 'Anda yakin ingin Logout?',
        header: 'Konfirmasi',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Batal',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Logout',
            severity: 'danger'
        },
        accept: async () => {
            await authStore.logout()
            router.push('/login')
        },
        reject: () => {
            
        }
    });
}
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar @logout="onLogout"></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <ConfirmDialog></ConfirmDialog>
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>
