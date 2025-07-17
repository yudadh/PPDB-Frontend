export interface GetTotalPendaftaranBySekolah {
   sekolah_id: number;
   sekolah_nama: string;
   npsn: string;
   totalPendaftar: number;
   kuota: number
}

export interface GetKelulusanSiswa {
   pendaftaran_id: number;
   siswa_id: number;
   nama: string;
   nisn: string;
   sekolah_asal_id: number;
   sekolah_asal_nama: string;
   status_kelulusan: StatusKelulusan
}

export type StatusKelulusan = "PENDAFTARAN" | "LULUS" | "TIDAK_LULUS"


export interface GetLaporanDashboardSd {
   total_siswa: number;
   total_user: number;
   total_terdaftar: number;
   total_lulus: number;
   total_terverifikasi: number;
   total_belum_terverifikasi: number;
   total_biodata_belum_lengkap: number;
   total_dokumen_belum_lengkap: number;
}

export interface GetLaporanDashboardSmp {
   total_siswa_terdaftar: number;
   total_terverifikasi: number;
   total_belum_terverifikasi: number;
   total_lulus: number;
}

export interface GetLaporanDashboardDinas {
   total_siswa: number;
   total_sekolah_sd: number;
   total_sekolah_smp: number;
   total_terdaftar: number;
   total_terverifikasi: number;
   total_belum_terverifikasi: number;
   total_lulus: number;
   total_tidak_lulus: number;
}

export interface GetTotalPendaftarPerSekolah {
   sekolah_id: number;
   sekolah_nama: string;
   total_pendaftar: number;
}

export interface PendaftaranZonasiResponse {
   pendaftaran_id: number;
   sekolah_id: number;
   sekolah_nama: string;
   siswa_id: number;
   siswa_nama: string;
   nisn: string;
   sekolah_asal_nama: string;
   jarak_lurus: number;
   jarak_rute: number,
   status: string;
   status_kelulusan: string;
}