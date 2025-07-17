<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './store/authStore';
import { onBeforeUnmount, onMounted } from 'vue';

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

function handleStorageEvent(e: StorageEvent) {
   if(e.key === 'userAuth' && e.newValue) {
      const newState = e.newValue ? JSON.parse(e.newValue) : null
      console.log(newState)
      console.log(authStore.access_token)
      console.log('dsni 1')
      // console.log(value.access_token)

      if (newState.access_token !== authStore.access_token) {
         // Update dari tab lain
         console.log('dsni 2')
         console.log(authStore.access_token)
         console.log(newState.access_token)

         if (!newState.access_token && authStore.access_token) {
           // Logout otomatis jika access_token dihapus dari tab lain
           authStore.$reset()
           router.push('/login')
         }

         if ( newState.access_token && !authStore.access_token ) {
            console.log('dsni 3')
            // console.log(newState.access_token)
            authStore.access_token = newState.access_token
            authStore.user = newState.user
            switch (newState.user.role) {
              case 'siswa':
                router.push('/siswa/dashboard');
                break;
              case 'adminSD':
                router.push('/admin-sd/dashboard');
                break;
              case 'adminSMP':
                router.push('/admin-smp/dashboard');
                break;
              case 'adminDisdik':
                router.push('/admin-disdik/dashboard');
                break;
              default:
                router.push('/login');
            }
         }

      }
   }
}

onMounted(async () => {
   // console.log(authStore.access_token)
   await authStore.scheduleRefreshToken()
   authStore.setupVisibilityListener()
   window.addEventListener('storage', handleStorageEvent)
   if(!authStore.access_token && route.meta.requiresAuth) {
      router.push('/login')
   }

})

onBeforeUnmount(() => {
   window.addEventListener('storage', handleStorageEvent)
})
</script>

<template>
   <RouterView/>
</template>

<style scoped></style>
