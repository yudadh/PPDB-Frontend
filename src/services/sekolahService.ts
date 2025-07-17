import createAPI from "@/api/axiosInstance";
import { handleAxiosError } from "@/utils/errorAxios";
import type { GetAllSekolahResponse, KuotaSekolahDTO, KuotaSekolahUpdateItem, SekolahDTO, UpdateSekolahDTO, UploadKuotaSekolah, UploadSekolahWithExcel, ZonasiDTO } from "@/interfaces/sekolahInterface";
import type { PaginationMeta } from "@/interfaces/layoutInterface";

const sekolahApi = createAPI('sekolah')

export async function getSekolahById(id: number): Promise<SekolahDTO> {
    try {
        const response = await sekolahApi.get(`/sekolah/${id}`)
        const data: SekolahDTO = response.data.data
        return data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getTemplateCreateSekolah(

): Promise<Blob> {
    try {
        const response = await sekolahApi.get<Blob>('/sekolah/template', {
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

export async function createSekolahWithExcel(file: File): Promise<UploadSekolahWithExcel> {
    try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await sekolahApi.post(`/sekolah/template`, formData, {
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

export async function updateSekolahById(id: number, sekolahData: UpdateSekolahDTO): Promise<{sekolah_id: number}> {
    try {
        const response = await sekolahApi.put(`/sekolah/${id}`, sekolahData)
        const data: {sekolah_id: number} = response.data.data
        return data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getAllSekolah(jenis: string, page: number, limit: number, filters: any): Promise<{
    data: GetAllSekolahResponse[],
    meta: PaginationMeta
}> {
    try {
        const response = await sekolahApi.get(`/sekolah/${jenis}`, {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        return response.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function deleteSekolahById(id: number): Promise<{sekolah_id: number}> {
    try {
        const response = await sekolahApi.delete(`/sekolah/${id}`)
        const data: {sekolah_id: number} = response.data.data
        return data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getTemplateKuotaSekolah(id: number): Promise<Blob> {
    try {
        const response = await sekolahApi.get<Blob>(`/sekolah/kuota-sekolah/template/${id}`, {
            responseType: 'blob'
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function submitKuotaSekolah(file: File): Promise<UploadKuotaSekolah> {
    try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await sekolahApi.post(`/sekolah/kuota-sekolah/upload`, formData, {
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

export async function updateKuotaSekolahById(kuotaSekolahId: number, kuota: number): Promise<{
    sekolah_id: number;
    kuota_sekolah_id: number;
    kuota: number;
}> {
    try {
        const response = await sekolahApi.patch(`/sekolah/kuota-sekolah/${kuotaSekolahId}`, {
            kuota
        })
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function updateKuotaSekolahBySekolahId(
    periodeId: number,
    sekolahId: number, 
    kuota_sekolah: KuotaSekolahUpdateItem[]
): Promise<{
    periode_id: number;
    sekolah_id: number;
    kuota_sekolah: KuotaSekolahUpdateItem[]
}> {
    try {
        const data = {
            periode_id: periodeId,
            kuota_sekolah
        }
        const response = await sekolahApi.put(`/sekolah/kuota-sekolah/${sekolahId}`, data)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getKuotaSekolahByPeriodeId(
    id: number, 
    page: number, 
    limit: number,
    filters: any
): Promise<{
    data: KuotaSekolahDTO[],
    meta: PaginationMeta
}> {
    try {
        const response = await sekolahApi.get(`/sekolah/kuota-sekolah/periode/${id}`, {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        // console.log(response.data)
        return response.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function createZonasi(
    sekolah_id: number,
    banjar_id: number
): Promise<ZonasiDTO> {
    try {
        const data = {
            sekolah_id,
            banjar_id
        }
        const response = await sekolahApi.post(`/sekolah/zonasi`, data)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getAllZonasi(page: number, limit: number, filters: any): Promise<{
    data: ZonasiDTO[],
    meta: PaginationMeta
}> {
    console.log(page, limit)
    try {
        const response = await sekolahApi.get(`/sekolah/zonasi`, {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function updateZonasiById(
    zonasiId: number,
    sekolah_id: number,
    banjar_id: number
): Promise<ZonasiDTO> {
    try {
        const data = {
            sekolah_id,
            banjar_id
        }
        const response = await sekolahApi.put(`/sekolah/zonasi/${zonasiId}`, data)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function deleteZonasiById(
    zonasiId: number
): Promise<{ zonasi_id: number }> {
    try {
        const response = await sekolahApi.delete(`/sekolah/zonasi/${zonasiId}`)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}


