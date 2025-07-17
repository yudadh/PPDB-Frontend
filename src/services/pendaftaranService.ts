import createAPI from "@/api/axiosInstance";
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type { GetRoutesMapbox, GetSekolahZonasi, PendaftaranSDResponse, PendaftaranSiswaDTO, PendaftaranZonasi, PendaftaranZonasiBulk } from "@/interfaces/pendaftaranInterface";
import { handleAxiosError } from "@/utils/errorAxios";
import axios from "axios";

const pendaftaranApi = createAPI('pendaftaran')

export async function getSekolahByBanjarId(banjar_id: number): Promise<GetSekolahZonasi> {
    try {
        const response = await pendaftaranApi.get(`/pendaftaran/sekolah-tujuan/${banjar_id}`)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function daftarZonasi(data: PendaftaranZonasi): Promise<{pendaftaran_id: number, sekolah_id: number}> {
    try {
        const response = await pendaftaranApi.post(`/pendaftaran/zonasi`, data)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function daftarZonasiBulk(data: PendaftaranZonasiBulk): Promise<{count: number}> {
    try {
        const response = await pendaftaranApi.post(`/pendaftaran/zonasi-many`, data)
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getPendaftaranZonasiSD(
    id: number, 
    periodeJalurId: number, 
    page: number, 
    limit: number, 
    filters: any
): Promise<{siswas: PendaftaranSDResponse[], meta: PaginationMeta}> {
    try {
        
        const response = await pendaftaranApi.get(`/pendaftaran/pendaftaran-sd/${periodeJalurId}/${id}`, {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        const siswas = response.data.data
        const meta = response.data.meta
        return {siswas, meta}
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getPendaftaranZonasiSMP(
    id: number, 
    periodeJalurId: number, 
    page: number, 
    limit: number, 
    filters: any, 
): Promise<{siswas: PendaftaranSDResponse[], meta: PaginationMeta}> {
    try {
        // console.log(periodeJalurId + 8)
        const response = await pendaftaranApi.get(`/pendaftaran/pendaftaran-smp/${periodeJalurId}/${id}`, {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        
        const siswas = response.data.data
        const meta = response.data.meta
        console.log(siswas)
        return {siswas, meta}
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}

export async function getAllPendaftaranBySiswaId(id: number): Promise<PendaftaranSiswaDTO[]> {
    try {
        const response = await pendaftaranApi.get(`/pendaftaran/pendaftaran-siswa/${id}`)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getRoutesMapbox(
    rumah: number[],
    sekolah: number[]
): Promise<{
    distance: number;
    geometry: GetRoutesMapbox;
}> {
    try {
        const apiKey = 'pk.eyJ1IjoieXVkYWRoIiwiYSI6ImNtNG1iY2hjMTAwNXEybG9yNG52N240eHIifQ.lu67gBuXwPDn__wLzdZCDw';
        const url = `https://api.mapbox.com/directions/v5/mapbox/cycling/${rumah};${sekolah}?overview=full&geometries=geojson&access_token=${apiKey}`;
        const routing = await axios.get(url);
        console.log(routing.data)
        return routing.data.routes[0]
    } catch (error) {
        handleAxiosError(error)
    }
}

export function getJarakLurus(
    rumah: number[],
    sekolah: number[]
): number {
    const R = 6371000; // Radius bumi dalam meter

    const toRadians = (degree: number) => (degree * Math.PI) / 180;
    const dLat = toRadians(sekolah[1] - rumah[1]);
    const dLon = toRadians(sekolah[0] - rumah[0]);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(rumah[1])) *
        Math.cos(toRadians(sekolah[1])) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Jarak dalam meter 
}
