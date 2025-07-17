export interface DokumenJalurDTO {
   dokumen_jalur_id: number;
   dokumen_id: number;
   dokumen_jenis: string;
   jalur_nama: string;
}

export interface DokumenMasterDTO {
   dokumen_id: number;
   dokumen_jenis: string;
   is_umum: boolean;
   keterangan: string | null;
}

export interface DokumenSiswaDTO {
    siswa_id: number | null;
    dokumen_id: number;
    dokumen_jenis: string;
    dokumen_siswa_id: number | null;
    dokumen_url: string | null;
    status: 'BELUM_VALID' | 'VALID_SD' | 'VALID_SMP';
    keterangan: string | null
}

export interface UpdateDokumenStatus extends Omit<DokumenSiswaDTO, "dokumen_url" | "siswa_id" | "dokumen_id" | "dokumen_jenis" | "keterangan"> {}

export interface Dokumen extends DokumenSiswaDTO {
   is_umum: boolean;
   keterangan: string | null;
   keterangan_pesan: string | null
}

export interface UploadDokumenResponse {
   dokumen_siswa_id: number;
   dokumen_id: number;
   dokumen_url: string;
   status: 'BELUM_VALID' | 'VALID_SD' | 'VALID_SMP';
   keterangan: string | null
}

