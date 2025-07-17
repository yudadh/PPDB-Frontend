import type { User, UserSiswa, UserAdminSekolah } from "@/interfaces/userInterface";

export function isUserSiswa(user: User | UserSiswa | UserAdminSekolah | null): user is UserSiswa {
    return (user as UserSiswa)?.siswa_id !== undefined;
}

export function isUserAdminSekolah(user: User | UserSiswa | UserAdminSekolah | null): user is UserAdminSekolah {
    return (user as UserAdminSekolah)?.sekolah_id !== undefined;
}