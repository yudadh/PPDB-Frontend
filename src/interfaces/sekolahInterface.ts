export interface GetAgama {
    agama_id: number,
    nama_agama: string
}

export interface GetPekerjaan {
    pekerjaan_id: number
    nama_pekerjaan: string
}

export interface GetPenghasilan {
    penghasilan_id: number
    penghasilan: string | null
}

export interface SekolahDTO {
    sekolah_id: number;
    sekolah_nama: string;
    npsn: string | null;
    jenjang_sekolah_id: number;
    banjar_id: number | null;
    desa_id: number;
    kecamatan_id: number;
    kabupaten_id: number;
    provinsi_id: number;
    jumlah_kelas: number;
    total_daya_tampung: number;
    lintang: number;
    bujur: number;
}

export interface UpdateSekolahDTO extends Omit <SekolahDTO, "sekolah_id"> {}

export interface GetAllSekolahResponse {
    sekolah_id: number;
    sekolah_nama: string;
    npsn: string | null;
}

export interface CSVRow {
    Sekolah: string;
    'Jenis Kuota': string;
    Kuota: string;
    Periode: string;
}

export interface UploadKuotaSekolah {
    successCount: number;
    failCount: number;
    failedRows: CSVRow[]
}

export interface KuotaSekolah {
    periode_id: number;
    sekolah_id: number;
    npsn: string;
    sekolah_nama: string;
    kuota_sekolah_id: number;
    kuota_id: number;
    jenis_kuota: string;
    kuota: number;
 }
 
 export interface KuotaSekolahEntry extends Omit<KuotaSekolah, 'periode_id' | 'sekolah_id' | 'sekolah_nama' | 'npsn'> {
    
 }
 
 export interface KuotaSekolahDTO extends Omit<KuotaSekolah, 'kuota_sekolah_id' | 'kuota_id' | 'jenis_kuota' | 'kuota'> {
    kuota_sekolah: KuotaSekolahEntry[]
 }

 export interface ZonasiDTO {
    zonasi_id: number;
    sekolah_id: number;
    banjar_id: number;
    sekolah_nama: string;
    npsn: string;
    banjar_nama: string;
    desa_id: number;
    desa_nama: string;
 }
 
 export interface KuotaSekolahUpdateItem {
  kuota_sekolah_id: number;
  kuota: number;
}

export interface UpdateKuotaSekolahDTO {
  periode_id: number,
  kuota_updates: KuotaSekolahUpdateItem[];
}

export interface FailedRows {
    row_number: number;
    sekolah_nama: string;
    message: string;
}

export interface UploadSekolahWithExcel {
    successCount: number;
    failCount: number;
    failedRows: FailedRows[]
}