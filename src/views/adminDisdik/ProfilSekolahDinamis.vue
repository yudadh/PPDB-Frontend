<script setup lang="ts">
import type { SekolahDTO } from "@/interfaces/sekolahInterface";
import { getSekolahById } from "@/services/sekolahService";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FormProfilSekolah from "@/components/forms/FormProfilSekolah.vue";
import { useToast } from "primevue";

const route = useRoute()
const sekolah_id = Number(route.params.id)
const router = useRouter();
const toast = useToast();
const goBack = () => {
   if (window.history.length > 1) {
      router.back();
   } else {
      router.push("/"); // Alihkan ke halaman lain jika tidak ada halaman sebelumnya
   }
};

const isLoading = ref(false);
const sekolahs = ref<SekolahDTO[]>([]);
const jenisSekolah = ref<string>('')
onMounted(async () => {
   try {
      isLoading.value = true;
      const sekolahData = await getSekolahById(sekolah_id);
      console.log(sekolahData)
      if (sekolahData) {
        jenisSekolah.value = sekolahData.jenjang_sekolah_id === 1 ? 'SMP' : 'SD'
         Object.assign(sekolahs.value, sekolahData);
         // console.log(initialFormValues)
      }
   } catch (error) {
      if (error instanceof Error) {
         toast.add({
            severity: "error",
            summary: "Gagal",
            detail: error.message,
            life: 2000,
         });
      }
   } finally {
      isLoading.value = false;
   }
});
</script>

<template>
   <div class="flex flex-col md:flex-row gap-8">
      <Toast />
      <div class="md:w-full">
         <div class="card">
            <div class="flex flex-col gap-4">
               <div class="flex flex-col gap-6">
                  <Button
                     label="Kembali"
                     severity="danger"
                     @click="goBack"
                     icon="pi pi-fw pi-arrow-left"
                     class="w-[10%] leading-5"></Button>
               </div>
               <div class="text-xl">Profil Sekolah {{ jenisSekolah }}</div>
               <Fluid v-if="!isLoading">
                  <FormProfilSekolah
                     :sekolahData="sekolahs"
                     :isDialog="false"></FormProfilSekolah>
               </Fluid>
               <ProgressSpinner
                  style="width: 80px; height: 80px"
                  strokeWidth="6"
                  fill="transparent"
                  animationDuration="1s"
                  aria-label="Custom ProgressSpinner"
                  v-else />
            </div>
         </div>
      </div>
   </div>
</template>
