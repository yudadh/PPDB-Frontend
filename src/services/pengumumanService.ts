import createAPI from "@/api/axiosInstance";
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type { GetKelulusanSiswa, GetLaporanDashboardDinas, GetLaporanDashboardSd, GetLaporanDashboardSmp, GetTotalPendaftaranBySekolah, GetTotalPendaftarPerSekolah, PendaftaranZonasiResponse, StatusKelulusan } from "@/interfaces/pengumumanInterface";
import { handleAxiosError } from "@/utils/errorAxios";

const pengumumanApi = createAPI('pengumuman')

export async function seleksiKelulusan(
    sekolahId: number,
    periodeJalurId: number,
): Promise<{ count: number}> {
    try {
        const response = await pengumumanApi.post('/pengumuman/set-kelulusan', {
            sekolah_id: sekolahId,
            periode_jalur_id: periodeJalurId
        })
        
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getKuotaPendaftar(
    periodeId: number,
    periodeJalurId: number,
    page: number,
    limit: number,
    filters: any
): Promise<{ 
    data: GetTotalPendaftaranBySekolah[],
    meta: PaginationMeta
}> {
    try {
        const response = await pengumumanApi.get('/pengumuman/kuota-pendaftar', {
            params: {
                periode_id: periodeId,
                periode_jalur_id: periodeJalurId,
                page: page,
                limit: limit,
                filters: filters
            }
        })
        
        return response.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getLaporanPendaftaran(
    periode_id: number | null,
    periodeJalurId: number | null,
    sekolah_id: number | null,
    status: StatusKelulusan | null
): Promise<Blob> {
    try {
        const response = await pengumumanApi.get<Blob>('/pengumuman/laporan-pendaftaran', {
            params: {
                periode_id: periode_id ?? undefined,
                periode_jalur_id: periodeJalurId ?? undefined,
                sekolah_id: sekolah_id,
                status_kelulusan: status
            },
            responseType: 'blob'
        })
        
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        return blob
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getPengumumanData(
    sekolah_id: number,
    periode_jalur_id: number,
    page: number,
    limit: number,
    filters: any
): Promise<{
    data: GetKelulusanSiswa[],
    meta: PaginationMeta
}> {
    try {
        const response = await pengumumanApi.get(`/pengumuman/kelulusan/${sekolah_id}`, {
            params: {
                periode_jalur_id,
                page,
                limit,
                filters
            }
        })

        return response.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getLaporanDashboardSd(
    sekolah_id: number,
    periode_jalur_id: number,
): Promise<GetLaporanDashboardSd> {
    try {
        const response = await pengumumanApi.get(`/pengumuman/dashboard-sd/${sekolah_id}`, {
            params: {
                periode_jalur_id
            }
        })
        console.log(response.data)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getLaporanDashboardSmp(
    sekolah_id: number,
    periode_jalur_id: number,
): Promise<GetLaporanDashboardSmp> {
    try {
        const response = await pengumumanApi.get(`/pengumuman/dashboard-smp/${sekolah_id}`, {
            params: {
                periode_jalur_id
            }
        })
        console.log(response.data)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getLaporanDashboardDinas(
    periode_jalur_id: number
): Promise<GetLaporanDashboardDinas> {
    try {
        const response = await pengumumanApi.get(`/pengumuman/dashboard-dinas/${periode_jalur_id}`)
        console.log(response.data)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getTotalPendaftarPerSekolah(
    periode_jalur_id: number
): Promise<GetTotalPendaftarPerSekolah[]> {
    try {
        const response = await pengumumanApi.get(`/pengumuman/pendaftar-per-sekolah/${periode_jalur_id}`)
        console.log(response.data)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getAllPendaftaranZonasi(
    periodeId: number,
    page: number,
    limit: number,
    filters: any
): Promise<{
    data: PendaftaranZonasiResponse[],
    meta: PaginationMeta
}> {
    try {
        console.log(periodeId)
        const response = await pengumumanApi.get(`/pengumuman/zonasi/${periodeId}`, {
            params: {
                page,
                limit,
                filters
            }
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        handleAxiosError(error)
    }
}