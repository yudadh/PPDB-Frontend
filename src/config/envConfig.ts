import dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
   dotenv.config();
}

export const env = {
   NODE_ENV: process.env.NODE_ENV || "production",
   AUTH_SERVICE: process.env.AUTH_SERVICE || 'http://localhost:3001',
   DOKUMEN_SERVICE: process.env.DOKUMEN_SERVICE || 'http://localhost:3002',
   PERIODE_SERVICE: process.env.PERIODE_SERVICE || 'http://localhost:3004',
   PENDAFTARAN_SERVICE: process.env.PENDAFTARAN_SERVICE || 'http://localhost:3003',
   PENGUMUMAN_SERVICE: process.env.PENGUMUMAN_SERVICE || 'http://localhost:3009',
   SEKOLAH_SERVICE: process.env.SEKOLAH_SERVICE || 'http://localhost:3005',
   SISWA_SERVICE: process.env.SISWA_SERVICE || 'http://localhost:3006',
   WILAYAH_SERVICE: process.env.WILAYAH_SERVICE || 'http://localhost:3008'
};

