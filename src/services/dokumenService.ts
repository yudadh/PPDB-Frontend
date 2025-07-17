import createAPI from "@/api/axiosInstance";
import type {
   DokumenMasterDTO,
   DokumenSiswaDTO,
   UpdateDokumenStatus,
   UploadDokumenResponse,
} from "@/interfaces/dokumenInterface";
import { handleAxiosError } from "@/utils/errorAxios";

const dokumenApi = createAPI("dokumen");

export async function getMasterDocument(): Promise<DokumenMasterDTO[]> {
   try {
      const response = await dokumenApi.get("/dokumen/master-dokumen");
      const data: DokumenMasterDTO[] = response.data.data;
      return data;
   } catch (error) {
      console.log(error);
      handleAxiosError(error);
   }
}

export async function getSiswaDocument(
   siswa_id: number
): Promise<{
   response: DokumenSiswaDTO[],
   nama: string
}> {
   try {
      const response = await dokumenApi.get(
         `/dokumen/dokumen-siswa/${siswa_id}`
      );
      const data: {
         response: DokumenSiswaDTO[],
         nama: string
      } = response.data.data;
      return data;
   } catch (error) {
      console.log(error);
      handleAxiosError(error);
   }
}

export async function uploadSiswaDocument(
   siswa_id: number,
   dokumen_id: number,
   dokumen_jenis: string,
   file: File
): Promise<UploadDokumenResponse> {
   try {
      const data = { file: file };
      const response = await dokumenApi.post(
         `dokumen/dokumen-siswa/${siswa_id}/${dokumen_id}`,
         data,
         {
            headers: {
               "Content-Type": "multipart/form-data",
            },
            params: {
               dokumen_jenis: dokumen_jenis,
            },
         }
      );
      return response.data.data;
   } catch (error) {
      handleAxiosError(error);
   }
}

export async function updateDocumentSiswaStatus(
   dokumen_siswa_id: number,
   status: 'BELUM_VALID' | 'VALID_SD' | 'VALID_SMP',
   keterangan: string | null
): Promise<UpdateDokumenStatus> {
   try {
      const response = await dokumenApi.patch(
         `/dokumen/dokumen-siswa/status/${dokumen_siswa_id}`,
         { 
            status: status,
            keterangan: keterangan 
         }
      );
      return response.data.data;
   } catch (error) {
      console.log(error);
      handleAxiosError(error);
   }
}