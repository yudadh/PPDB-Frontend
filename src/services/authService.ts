import createAPI from "@/api/axiosInstance";
import type { PaginationMeta } from "@/interfaces/layoutInterface";
import type { Roles, SubmitUserAdmin, SubmitUserSiswa, UserAdminSekolah, UserSiswaDTO } from "@/interfaces/userInterface";
import { handleAxiosError } from "@/utils/errorAxios";

const authApi = createAPI('auth')
export async function getALlUserBySekolahId(sekolah_id: number, page: number, limit: number): Promise<UserSiswaDTO[]> {
    try {
        const response = await authApi.get(`/auth/users/${sekolah_id}`, {
            params: {
                page: page,
                limit: limit
            }
        })
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function submitUserSiswa(user: SubmitUserSiswa) {
    try {
        const response = await authApi.post("/auth/register-siswa", user)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function updateUserPassword(new_password: string, token: string) {
    try {
        const response = await authApi.put("/auth/change-password", { password: new_password }, {
            params: {
                token: token
            }
        })
        console.log(response)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function updateUser(
    user_id: number, 
    username: string, 
    sekolah_id: number | null
): Promise<{ user_id: number }> {
    try {
        const response = await authApi.put("/auth/users/update", {
            user_id,
            username,
            sekolah_id
        })
        console.log(response)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function deleteUser(user_id: number) {
    try {
        const response = await authApi.delete(`/auth/users/${user_id}`)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
    
}

export async function getAllUserAdminSekolah(page: number, limit: number, filters: any): Promise<{ users: UserAdminSekolah[], meta: PaginationMeta }> {
    try {
        const response = await authApi.get("/auth/users-admin", {
            params: {
                page: page,
                limit: limit,
                filters: filters
            }
        })
        const users = response.data.data
        const meta = response.data.meta
        return { users, meta }
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function getAllRoles(): Promise<Roles[]> {
    try {
        const response = await authApi.get(`/auth/role`)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
    
}

export async function registerAdmin(user: SubmitUserAdmin): Promise<{
    username: string; 
    user_id: number;
    sekolah_nama: string;
    sekolah_id: number;
    role_id: number;
}> {
    try {
        const response = await authApi.post("/auth/register-admin", user)
        return response.data.data
    } catch (error) {
        handleAxiosError(error)
    }
}

export async function refresh() {
    try {
        const response = await authApi.post("/auth/refresh");
        return response.data
    } catch (error) {
        handleAxiosError(error)
    }   
}

export async function verifyUsernameAndSendEmail(username: string): Promise<boolean> {
    try {
        const response = await authApi.post("auth/verify-username", 
            { username }
        )
        return response.data.data
    } catch (error) {
        console.log(error)
        handleAxiosError(error)
    }
}