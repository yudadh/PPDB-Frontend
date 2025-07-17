import createAPI from "@/api/axiosInstance";
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type {
   CreateJadwal,
   CreatePeriode,
   CreatePeriodeJalur,
   JadwalDTO,
   JalurDTO,
   PeriodeDTO,
   PeriodeJalurDTO,
   TahapanDTO,
   UpdatePeriodeJalur,
} from "@/interfaces/periodeInterface";
import { handleAxiosError } from "@/utils/errorAxios";

const periodeApi = createAPI("periode");

export async function createPeriode(data: CreatePeriode): Promise<PeriodeDTO> {
   try {
      const response = await periodeApi.post("/periode/periode", data);
      return response.data.data;
   } catch (error) {
      console.log(error)
      handleAxiosError(error);
   }
}

export async function getAllPeriode(
   page: number,
   limit: number
): Promise<{
   data: PeriodeDTO[];
   meta: PaginationMeta;
}> {
   try {
      const response = await periodeApi.get("/periode/periode", {
         params: {
            page: page,
            limit: limit,
         },
      });
      return response.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function updatePeriodeById(
   data: CreatePeriode,
   periodeId: number
): Promise<PeriodeDTO> {
   try {
      const response = await periodeApi.put(
         `/periode/periode/${periodeId}`,
         data
      );
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function deletePeriodeById(periodeId: number): Promise<{
   periode_id: number;
}> {
   try {
      const response = await periodeApi.delete(`/periode/periode/${periodeId}`);
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function createPeriodeJalur(
   data: CreatePeriodeJalur
): Promise<PeriodeJalurDTO> {
   try {
      const response = await periodeApi.post(`/periode/periode-jalur/`, data);
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function updatePeriodeJalurById(
   periode_jalur_id: number,
   data: UpdatePeriodeJalur
): Promise<PeriodeJalurDTO> {
   try {
      const response = await periodeApi.put(
         `/periode/periode-jalur/${periode_jalur_id}`,
         data
      );
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function getAllPeriodeJalurByPeriodeId(
   periode_id: number
): Promise<PeriodeJalurDTO[]> {
   try {
      const response = await periodeApi.get(
         `/periode/periode-jalur/${periode_id}`
      );
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function deletePeriodeJalurById(
   periode_jalur_id: number
): Promise<{ periode_jalur_id: number }> {
   try {
      const response = await periodeApi.delete(
         `/periode/periode-jalur/${periode_jalur_id}`
      );
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}


export async function createJadwal(
   data: CreateJadwal
): Promise<JadwalDTO> {
   try {
      const response = await periodeApi.post(`periode/jadwal/`, data);
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function getJadwalByPeriodeJalurId(
   periodeJalurId: number
): Promise<JadwalDTO[]> {
   try {
      const response = await periodeApi.get(`periode/jadwal/${periodeJalurId}`);
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function updateJadwalById(
   jadwalId: number,
   data: CreateJadwal
): Promise<JadwalDTO> {
   try {
      const response = await periodeApi.put(`periode/jadwal/${jadwalId}`, data);
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function deleteJadwalById(
   jadwalId: number
): Promise<{jadwal_id: number}> {
   try {
      const response = await periodeApi.delete(`periode/jadwal/${jadwalId}`);
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function closeOrOpenJadwal(jadwalId: number, data: 0 | 1): Promise<JadwalDTO> {
   try {
      console.log(data)
      const response = await periodeApi.patch(`periode/jadwal/status/${jadwalId}`,
         {
            is_closed: data
         }
      );

      return response.data.data;
   } catch (error) {
      handleAxiosError(error)
   }
}

export async function getAllJalur(): Promise<JalurDTO[]> {
   try {
      const response = await periodeApi.get("/periode/jalur");
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function getAllTahapan(): Promise<TahapanDTO[]> {
   try {
      const response = await periodeApi.get("/periode/tahapan");
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}


