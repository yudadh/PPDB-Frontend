import type { JalurDTO, PeriodeJalurDTO } from "@/interfaces/periodeInterface";
import { getAllPeriode, getAllPeriodeJalurByPeriodeId } from "@/services/periodeService";
import { defineStore } from "pinia";


export const usePendaftaranStore = defineStore("pendaftaranSiswa", {
    state: () => ({
        periode_id: null as number | null,
        periode_nama: null as string | null,
        periode_jalur_id: null as number | null,
        is_daftar: {
            zonasi: false
        },
        periode_jalurs: [] as PeriodeJalurDTO[],
        jalur: [] as JalurDTO[]
    }),
    actions: {
        async loadPeriodeAndPeriodeJalur() {
            const now = Date.now();
      
            const periodes = await getAllPeriode(1, 10);
            const activePeriode = periodes.data.find(
              ({ waktu_mulai, waktu_selesai }) =>
                new Date(waktu_mulai).getTime() <= now &&
                new Date(waktu_selesai).getTime() >= now
            );
            console.log(activePeriode)
      
            if (!activePeriode) {
              throw new Error("Tidak ada periode aktif")
            }
      
            this.periode_id = activePeriode.periode_id;
            this.periode_nama = activePeriode.nama_periode
            const periodeJalurs = await getAllPeriodeJalurByPeriodeId(this.periode_id);
            this.periode_jalurs = periodeJalurs
            
        },

        storePeriodeActive(periode_id: number) {
            if(periode_id === null) {
                this.periode_id = periode_id
            }
        },

        storePendaftaranState(key: string, value: boolean) {
            if(key === 'Zonasi') {
                this.is_daftar.zonasi = value
            }
        },
        
        storeJalurs(jalurs: JalurDTO[]) {
            this.jalur = jalurs
        }
    },
    persist: {
        storage: sessionStorage
    }
})