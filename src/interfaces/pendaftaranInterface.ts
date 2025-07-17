export interface GetSekolahZonasi {
    sekolah_id: number;
    sekolah_nama: string;
    lintang: number;
    bujur: number;
}

type siswaData = {
    siswa_id: number;
    banjar_id: number;
    tanggal_lahir: string;
    lintang: number;
    bujur: number;
}

export interface PendaftaranZonasi {
    siswa: siswaData;
    periode_jalur_id: number;
    // jalur_id: number
}

export interface PendaftaranZonasiBulk extends Omit<PendaftaranZonasi, 'siswa' | 'jalur_id'> {
    siswas: siswaData[]
}

export interface PendaftaranSDResponse {
    siswa_id: number;
    nama: string;
    nisn: string;
    pendaftaran_id: number;
    sekolah_id: number;
    sekolah_nama: string;
    sekolah_lintang: number;
    sekolah_bujur: number;
    status: string;
    isAllDokumenValid: boolean;
    totalDokumenValid: number;
    status_kelulusan: string;
    keterangan: string | null;
    lintang: number;
    bujur: number
 }

export interface PendaftaranSiswaDTO {
    pendaftaran_id: number,
    siswa_id: number,
    nama: string,
    nisn: string,
    status: string,
    status_kelulusan: string
    periode_jalur_id: number
    jalur_id: number
    create_at: string | null
}

export type StatusPendaftaran = 'DIBATALKAN' | 'BELUM_VERIF' | 'VERIF_SD' | 'VERIF_SMP'

type latlng = [number, number]

export interface GetRoutesMapbox {
    coordinates: latlng[]
    type: string
}