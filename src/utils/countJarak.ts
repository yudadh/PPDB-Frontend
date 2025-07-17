import { getJarakLurus, getRoutesMapbox } from "@/services/pendaftaranService";
import type { LatLngExpression } from "leaflet";

export const countJarakRute = async (rumah: number[], sekolah: number[]) => {
    const data = await getRoutesMapbox([rumah[1], rumah[0]], [sekolah[1], sekolah[0]])
    const coordinates = data.geometry.coordinates;
    const latlngs: LatLngExpression[] = coordinates.map(coord => [coord[1], coord[0]]); // convert to [lat, lng]
    return { 
        latlngs,
        jarak: data.distance
    }
}

export const countJarakLurus = (rumah: number[], sekolah: number[]) => {
    const jarakLurus: number = getJarakLurus([rumah[1], rumah[0]], [sekolah[1], sekolah[0]])
    const latlngs: LatLngExpression[] = [[rumah[0], rumah[1]], [sekolah[0], sekolah[1]]]
    return {
        latlngs,
        jarak: jarakLurus
    }
}