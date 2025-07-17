import { defineStore } from "pinia";
import type { Dokumen, DokumenSiswaDTO } from "@/interfaces/dokumenInterface";
import { getSiswaDocument, getMasterDocument, uploadSiswaDocument } from "@/services/dokumenService";

export const useDokumenStore = defineStore("siswaDokumen", {
    state: () => ({
        dokumen_wajib: [] as Dokumen[],
        dokumen_siswa: [] as DokumenSiswaDTO[],
        nama: '' as string,
        is_dokumen_full: false as boolean,
        is_dokumen_valid: false as boolean
    }),
    actions: {
        async getSiswaDocument(siswa_id: number) {
            const masterDokumen = await getMasterDocument()
            const dokumenWajib = masterDokumen.filter((dokumen) => dokumen.is_umum === true )
            
            const dokumens = await getSiswaDocument(siswa_id)
            // console.log(dokumens)
            this.dokumen_siswa = dokumens.response
            this.nama = dokumens.nama
            console.log(this.dokumen_siswa)
            if (!dokumenWajib.length) {
                throw new Error("Tidak ada dokumen wajib")
            } 
            
            this.dokumen_wajib = dokumenWajib.map((dokumen) => {
                const dataTambahan = this.dokumen_siswa.find((d) => d.dokumen_id === dokumen.dokumen_id)
                if(dataTambahan) {
                    // console.log(dataTambahan)
                    return {
                        ...dokumen,
                        siswa_id: dataTambahan.siswa_id,
                        dokumen_siswa_id: dataTambahan.dokumen_siswa_id,
                        dokumen_url: dataTambahan.dokumen_url,
                        status: dataTambahan.status,
                        keterangan_pesan: dataTambahan.keterangan
                    }
                }else {
                    return {
                        ...dokumen,
                        siswa_id: null,
                        dokumen_siswa_id: null,
                        dokumen_url: null,
                        status: 'BELUM_VALID',
                        keterangan_pesan: null
                    }
                }
    
            })
        },
        
        async submitDocument(siswa_id: number, dokumen_id: number, dokumen_jenis: string, file: File) {
            const response = await uploadSiswaDocument(siswa_id, dokumen_id, dokumen_jenis, file)
            console.log(response)
            this.dokumen_wajib = this.dokumen_wajib.map((dokumen) => 
                dokumen.dokumen_id === response.dokumen_id 
                ? {...dokumen, 
                    dokumen_siswa_id: 
                    response.dokumen_siswa_id, 
                    dokumen_url: response.dokumen_url, 
                    status: response.status,
                    keterangan_pesan: response.keterangan
                  }
                : dokumen
            )
            return response
        },
        checkCompletenessDocument() {
            if(this.dokumen_wajib.length !== 0) {
                const dokumenWithNullUrl = this.dokumen_wajib.find((dokumen) => dokumen.dokumen_url === null)
                if(dokumenWithNullUrl !== undefined) {
                    this.is_dokumen_full = false
                }else {
                    this.is_dokumen_full = true
                }
            }
            return this.is_dokumen_full
        }
    },
    persist: {
        storage: sessionStorage
    }
})