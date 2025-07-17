
export interface PeriodeDTO {
   periode_id: number;
   nama_periode: string;
   waktu_mulai: string;
   waktu_selesai: string;
}

export interface PeriodeJalurDTO {
   periode_jalur_id: number;
   periode_id: number;
   jalur_id: number;
   jalur_nama: string;
   waktu_mulai: string;
   waktu_selesai: string;
   metode_ranking: "JARAK_LURUS" | "JARAK_RUTE" | null
}

export interface JalurDTO {
   jalur_id: number
   jalur_nama: string
}

export interface CreatePeriode extends Omit<PeriodeDTO, 'periode_id'> {

}

export interface CreatePeriodeJalur extends Omit<PeriodeJalurDTO, 'periode_jalur_id' | 'jalur_nama'> {

}

export interface UpdatePeriodeJalur extends Omit<CreatePeriodeJalur, 'periode_id'> {

}

export interface JadwalDTO {
   jadwal_id: number
   periode_jalur_id: number
   tahapan_id: number
   tahapan_nama: string
   is_closed: number
   waktu_mulai: string
   waktu_selesai: string
}

export interface CreateJadwal extends Omit<JadwalDTO, 'jadwal_id' | 'tahapan_nama' | 'is_closed'> {}

export interface TahapanDTO {
   tahapan_id: number
   tahapan_nama: string
}

