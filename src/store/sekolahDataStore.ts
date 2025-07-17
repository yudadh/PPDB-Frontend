import type { GetAllSekolahResponse } from "@/interfaces/sekolahInterface";
import type { GetDesa } from "@/interfaces/wilayahInterface";
import { getAllSekolah } from "@/services/sekolahService";
import { getDesaTabanan } from "@/services/wilayahService";
import { defineStore } from "pinia";


export const useSekolahStore = defineStore("sekolahStore", {
    state: () => ({
        sekolahSd: [] as GetAllSekolahResponse[],
        sekolahSmp: [] as GetAllSekolahResponse[],
        listDesa: [] as GetDesa[]
    }),
    actions: {
        async loadSekolahSd() {
            try {
                const response = await getAllSekolah("sd", 1, 1000, {})
                this.sekolahSd = response.data
            } catch (error) {
                if (error instanceof Error) {
                    console.log(error.message)
                } else {
                    console.log(error)
                }
            }
        },
        async loadSekolahSmp() {
            try {
                const response = await getAllSekolah("smp", 1, 1000, {})
                this.sekolahSmp = response.data
            } catch (error) {
                if (error instanceof Error) {
                    console.log(error.message)
                } else {
                    console.log(error)
                }
            }
        },
        async loadDesa() {
            try {
                const response = await getDesaTabanan()
                this.listDesa = response
            } catch (error) {
                if (error instanceof Error) {
                    console.log(error.message)
                } else {
                    console.log(error)
                }
            }
        }
    }, 
    persist: {
        storage: sessionStorage
    }
})