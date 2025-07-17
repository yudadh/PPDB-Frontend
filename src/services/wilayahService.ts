import createAPI from "@/api/axiosInstance";
import type { GetProvinsi, GetKabupaten, GetKecamatan, GetDesa, GetBanjar } from "@/interfaces/wilayahInterface";
import { handleAxiosError } from "@/utils/errorAxios";

const wilayahApi = createAPI('wilayah')

export async function getAllProvinsi(): Promise<GetProvinsi[]> {
    try {
        const response = await wilayahApi.get("/wilayah/provinsi")
        const data: GetProvinsi[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

// Kabupaten
export async function getKabupatenByProvinsiId(provinsi_id: number): Promise<GetKabupaten[]> {
    try {
        const response = await wilayahApi.get(`/wilayah/kabupaten/${provinsi_id}`)
        const data: GetKabupaten[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

// Kecamatan
export async function getKecamatanByKabupatenId(kecamatan_id: number): Promise<GetKecamatan[]> {
    try {
        const response = await wilayahApi.get(`/wilayah/kecamatan/${kecamatan_id}`)
        const data: GetKecamatan[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

// Desa
export async function getDesaByKecamatanId(desa_id: number): Promise<GetDesa[]> {
    try {
        const response = await wilayahApi.get(`/wilayah/desa/${desa_id}`)
        const data: GetDesa[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getDesaTabanan(): Promise<GetDesa[]> {
    try {
        const response = await wilayahApi.get(`/wilayah/desa/tabanan`)
        const data: GetDesa[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

// Banjar
export async function getBanjarByDesaId(desa_id: number): Promise<GetBanjar[]> {
    try {
        const response = await wilayahApi.get(`/wilayah/banjar/${desa_id}`)
        const data: GetBanjar[] = response.data.data
        return data
    } catch (error) {
        handleAxiosError(error)
    }
}

