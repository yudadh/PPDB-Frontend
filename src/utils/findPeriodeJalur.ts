import type { JadwalDTO, PeriodeJalurDTO } from "@/interfaces/periodeInterface";

export const findPeriodeJalur = (periodeJalurs: PeriodeJalurDTO[], jalur: string) => {
    const periodeJalur = periodeJalurs.find((pj) => pj.jalur_nama.toLowerCase() === jalur)
    if (!periodeJalur) {
        throw new Error(`Tidak ada jalur ${jalur}`)
    }
    return periodeJalur
}

export const findPeriodeJalurBerlangsung = (periodeJalurs: PeriodeJalurDTO[]) => {
    const now = new Date()
    const periodeJalur = periodeJalurs.find((pj) => new Date(pj.waktu_mulai) <= now && new Date(pj.waktu_selesai) >= now)

    if (!periodeJalur) {
        return {
            message: "Tidak ada jalur yang sedang berlangsung",
            periodeJalur: null
        }
    }

    return {
        message: '',
        periodeJalur
    }
}

export const findJadwal = (jadwals: JadwalDTO[], tahapan: string) => {
    const jadwal = jadwals.find((j) => j.tahapan_nama.toLowerCase() === tahapan && j.is_closed === 0)
    if (!jadwal) {
        return {
            message: `Tidak ada jadwal tahapan ${tahapan}`,
            jadwal: null
        }
    }
    const now = new Date()
    const waktu_mulai = new Date(jadwal.waktu_mulai)
    const waktu_selesai = new Date(jadwal.waktu_selesai)
    if (waktu_mulai > now || waktu_selesai < now) {
        return {
            message: `Tidak ada jadwal tahapan ${tahapan} yang sedang berlangsung`,
            jadwal: null
        }
    }

    return { 
        message: '',
        jadwal: jadwal
    }
}