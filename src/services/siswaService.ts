import createAPI from "@/api/axiosInstance";
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type { GetAgama, GetPekerjaan, GetPenghasilan } from "@/interfaces/sekolahInterface";
import type { SiswaDisplayData, SiswaDTO, SiswaStatus, SiswaWithStatus, UploadSiswaWithExcel } from "@/interfaces/siswaInterface";
import { handleAxiosError } from "@/utils/errorAxios";

const siswaApi = createAPI('siswa')



export async function getTemplateCreateSiswa(): Promise<Blob> {
    try {
        const response = await siswaApi.get<Blob>('/siswa/template', {
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

export async function createSiswaWithExcel(file: File): Promise<UploadSiswaWithExcel> {
    try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await siswaApi.post(`/siswa/many`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        console.log(response.data)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getSiswaById(id: number): Promise<SiswaDTO> {
    try {
        const response = await siswaApi.get(`/siswa/${id}`)
        const data: SiswaDTO = response.data.data
        return data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }

}

export async function getSiswaStatusById(id: number, periodeJalurId: number): Promise<SiswaStatus> {
    try {
        const response = await siswaApi.get(`/siswa/status/${id}/${periodeJalurId}`)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }

}

export async function updateSiswaById(id: number, data: SiswaDTO): Promise<number>{
    try {
        const response = await siswaApi.put(`/siswa/${id}`, data)
        return response.status
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }

}

export async function deleteSiswaById(id: number): Promise<{
    siswa_id: number
}>{
    try {
        const response = await siswaApi.delete(`/siswa/${id}`)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }

}

export async function getAllSiswaBySekolahId(sekolah_id: number, page: number, limit: number, filters?: any): Promise<{siswas: SiswaDisplayData[], meta: PaginationMeta}> {
    try {
        const response = await siswaApi.get(`/siswa/sekolah/${sekolah_id}`, {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        const siswas = response.data.data
        const meta = response.data.meta

        return { siswas, meta }
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getAllSiswaWithStatus(sekolah_id: number, periode_jalur_id: number, page: number, limit: number, filters?: any): Promise<{siswas: SiswaWithStatus[], meta: PaginationMeta}> {
    try {
        const response = await siswaApi.get(`siswa/${periode_jalur_id}/${sekolah_id}`,
            {
                params: {
                    page: page,
                    limit: limit,
                    filters: filters
                }
            }
        )
        const siswas = response.data.data
        const meta = response.data.meta

        return { siswas, meta }
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getTotalSiswaBySekolahId(sekolahId: number): Promise<number>{
    try {
        const response = await siswaApi.get(`/siswa/total/${sekolahId}`)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }

}

export async function getAllAgama(): Promise<GetAgama[]> {
    try {
        const response = await siswaApi.get("/siswa/agama")
        const data: GetAgama[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getAllPekerjaan(): Promise<GetPekerjaan[]> {
    try {
        const response = await siswaApi.get("/siswa/pekerjaan")
        const data: GetPekerjaan[] = response.data.data
        return data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getAllPenghasilan(): Promise<GetPenghasilan[]> {
    try {
        const response = await siswaApi.get("/siswa/penghasilan")
        const data: GetPenghasilan[] = response.data.data
        return data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

