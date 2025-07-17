type JenisKelamin = "L" | "P";

export interface SiswaForm {
   siswa_id: number | null;
   user_id: number | null;
   banjar_id: number | null;
   desa_id: number | null;
   kecamatan_id: number | null;
   kabupaten_id: number | null;
   provinsi_id: number | null;
   sekolah_asal_id: number | null;
   nama: string;
   tempat_lahir: string;
   tanggal_lahir: Date | null;
   jenis_kelamin: JenisKelamin | null;
   nomor_telepon: string | null;
   agama_id: number | null;
   nik: string;
   nisn: string;
   alamat_tinggal: string;
   alamat_kk: string;
   isluartabanan: number | null;
   nama_ibu: string;
   pekerjaan_ibu_id: number | null;
   penghasilan_ibu_id: number | null;
   nama_ayah: string;
   pekerjaan_ayah_id: number | null;
   penghasilan_ayah_id: number | null;
   nama_wali: string | null;
   pekerjaan_wali_id: number | null;
   penghasilan_wali_id: number | null;
   kebutuhan_khusus: number | null;
   lintang: string | null;
   bujur: string | null;
}

export interface SiswaDTO extends Omit<SiswaForm, "lintang" | "bujur"> {
   lintang: number;
   bujur: number;
}

export interface SiswaDisplayData {
   siswa_id: number;
   nama: string;
   nisn: string;
}

export interface SiswaWithStatus extends SiswaDisplayData {
   pendaftaran_id: number | null;
   isWilayahFull: boolean;
   isDokumenFull: boolean;
   isAllDokumenValid: boolean;
   totalDokumenValid: number;
   statusDaftar: string;
   banjar_id: number;
   tanggal_lahir: string;
   lintang: string;
   bujur: string;
}

export interface SiswaStatus {
   siswa_id: number;
   isWilayahFull: boolean;
   isDokumenFull: boolean;
   isDokumenValid: boolean;
   isTerdaftar: boolean;
   banjar_id: number;
   tanggal_lahir: string;
   lintang: number;
   bujur: number;
}

// export interface SiswaData extends Omit<SiswaWithStatus, ''>

export interface FailedRows {
    row_number: number;
    siswa_nama: string;
    messages: string[];
}

export interface UploadSiswaWithExcel {
    successCount: number;
    failCount: number;
    failedRows: FailedRows[]
}