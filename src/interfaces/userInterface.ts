export interface User {
    user_id: number;
    username: string;
    role: string;
}
 
export interface UserSiswa extends User {
    siswa_id: number;
    siswa_nama: string;
}
 
export interface UserAdminSekolah extends User {
    sekolah_id: number;
    sekolah_nama: string;
    // is_otp: number;
    role_id: number;
}
 
export interface UserAuth {
    user: User | UserSiswa | UserAdminSekolah;
    access_token: string;
}

export interface UserSiswaDTO {
    user_id: number;
    username: string;
    siswa_id: number;
    nama: string;
    // is_otp: number;
}

export interface UserSiswaWithIndex extends UserSiswaDTO {
    index: number
}

export interface SubmitUserSiswa {
    username: string,
    // password: string,
    role_id: number,
    siswa_id: number
}

export interface SubmitUserAdmin extends Omit<SubmitUserSiswa, 'siswa_id'> {
    sekolah_id: number
    // is_otp: number
}

export interface CreateUserResponse extends Omit<User, "role"> {
    siswa_id: number
    nama: string
}

export interface UserAdmin extends User {
    sekolah_id: number | null,
    is_otp: number
}

export interface Roles {
    role_id: number;
    role_nama: string;
}