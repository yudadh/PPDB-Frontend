import axios, { type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
// import { env } from "@/config/envConfig";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean; // Properti opsional
}

type Service = 'auth' | 'siswa' | 'wilayah' | 'sekolah' | 'dokumen' | 'pendaftaran' | 'periode' | 'pengumuman'

function createAPI(service: Service) {
    // const services = {
    //     auth: env.AUTH_SERVICE,
    //     siswa: env.SISWA_SERVICE,
    //     wilayah: env.WILAYAH_SERVICE,
    //     sekolah: env.SEKOLAH_SERVICE,
    //     dokumen: env.DOKUMEN_SERVICE,
    //     pendaftaran: env.PENDAFTARAN_SERVICE,
    //     periode: env.PERIODE_SERVICE,
    //     pengumuman: env.PENGUMUMAN_SERVICE
    // };
    const services = {
      auth: "https://auth-service-371797359815.asia-southeast2.run.app",
      siswa: "https://siswa-service-371797359815.asia-southeast2.run.app",
      wilayah: "https://wilayah-service-371797359815.asia-southeast2.run.app",
      sekolah: "https://sekolah-service-371797359815.asia-southeast2.run.app",
      dokumen: "https://dokumen-service-371797359815.asia-southeast2.run.app",
      pendaftaran: "https://pendaftaran-service-371797359815.asia-southeast2.run.app",
      periode: "https://periode-service-371797359815.asia-southeast2.run.app",
      pengumuman: "https://pengumuman-service-371797359815.asia-southeast2.run.app"  
    }

    if (!services[service]) {
        throw new Error(`Service ${service} is not defined`);
    }

    const api =  axios.create({
        baseURL: services[service],
        withCredentials: true,
    });

    api.interceptors.request.use((config) => {
        const authStore = useAuthStore()
        if(authStore.access_token) {
            config.headers.Authorization = `Bearer ${authStore.access_token}`
        }
        return config
    })
    
    let isRefreshing = false; // Menandakan apakah proses refresh sedang berlangsung
    let refreshSubscribers: ((token: string) => void)[] = []; // Daftar subscriber yang menunggu refresh selesai

    // Fungsi untuk memberitahu semua subscriber bahwa refresh selesai
    function onTokenRefreshed(token: string) {
      refreshSubscribers.forEach((callback) => callback(token));
      refreshSubscribers = [];
    }

    // Fungsi untuk menambahkan subscriber
    function addRefreshSubscriber(callback: (token: string) => void) {
      refreshSubscribers.push(callback);
    }

    // Tambahkan interceptor response
    api.interceptors.response.use(
      (response) => response, // Jika response berhasil, kembalikan response
      async (error) => {
        const authStore = useAuthStore();
        const originalRequest: CustomAxiosRequestConfig = error.config;
        // console.log(originalRequest)
        console.log(error)
        // Periksa apakah error adalah 401 dan belum di-retry
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
          originalRequest._retry = true; // Tandai bahwa request ini sedang di-retry
          // console.log('disni')
          if (!isRefreshing) {
            isRefreshing = true; // Tandai bahwa proses refresh sedang berlangsung
            try {
              await authStore.refresh(); // Refresh token
              isRefreshing = false; // Proses refresh selesai
              // console.log('disni 2')
              // Beritahu semua subscriber bahwa refresh selesai
              // console.log(authStore.access_token)
              console.log(authStore.isLoggedIn)
              if(authStore.access_token) {
                onTokenRefreshed(authStore.access_token);
              }
            } catch (refreshError) {
              isRefreshing = false; // Proses refresh selesai meskipun gagal
              await authStore.logout(); // Logout jika refresh token gagal
              console.log(refreshError)
              return Promise.reject(refreshError);
            }
          }

          // Tunggu hingga token baru tersedia
          return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`, // Gunakan token baru
              };
              resolve(api(originalRequest)); // Retry request
            });
          });
        } 
        // console.log('reject langsung')
        return Promise.reject(error); // Return error jika bukan 401
      }
    );

    return api
}



export default createAPI