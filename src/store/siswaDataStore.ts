import type { SiswaDisplayData, SiswaDTO } from "@/interfaces/siswaInterface";
import { getSiswaById, updateSiswaById } from "@/services/siswaService";
import { defineStore } from "pinia";

export const useSiswaDataStore = defineStore("siswaData", {
    state: () => ({
        siswaData: null as SiswaDTO | null,
        is_full: false as boolean,
        siswas: [] as SiswaDisplayData[]

    }),
    actions: {
        async getSiswaData(siswa_id: number) {
            if(this.siswaData) return this.siswaData
            const data = await getSiswaById(siswa_id)
            this.siswaData = data
            return data
        },
        async updateSiswaData(siswa_id: number, data: SiswaDTO): Promise<number> {
            const response = await updateSiswaById(siswa_id, data)
            if(response === 200) {
                this.siswaData = data
                this.is_full = true
            }
            return response
        },

        storeSiswas(data: SiswaDisplayData[]) {
            if (this.siswas.length > 0) return
            this.siswas = data
        }
    },
    persist: {
        storage: sessionStorage
    }
})