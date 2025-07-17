import createAPI from "@/api/axiosInstance";
import { defineStore } from "pinia";
import type { User, UserSiswa, UserAdminSekolah, UserAuth, Roles } from "@/interfaces/userInterface";
import { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";

// let refreshTimeout = 0

const authApi = createAPI('auth')
export const useAuthStore = defineStore("userAuth", {
   state: () => ({
      user: null as User | UserSiswa | UserAdminSekolah | null,
      access_token: null as string | null,
      // last_refresh_time: null as number | null,
      exp: null as number | null,
      refreshTimeout: null as ReturnType<typeof setTimeout> | null,
      refreshing: false,
      login_error: null as string | null,
      roles: [] as Roles[]
   }),
   actions: {
      async login(username: string, password: string) {
         try {
            const response = await authApi.post("/auth/login", {
               username,
               password
            });
            const data: UserAuth = response.data.data;
            console.log(data)
            this.user = data.user;
            this.access_token = data.access_token;
            console.log(data.access_token)
            this.login_error = null
            this.scheduleRefreshToken()
         } catch (error) {
            if(error instanceof AxiosError) {
               if(error.response) {
                  this.login_error = error.response.data.error.message
               }
            }
            throw error
         }
      },

      async refresh() {
         try {
            if (this.refreshing) return
            // const minInterval = 10 * 60 * 1000
            // const refreshInterval = this.last_refresh_time ? Date.now() - this.last_refresh_time : 1000001
            // if(refreshInterval < minInterval) {
            //    console.log('Skip refresh, masih dalam interval aman.')
            //    return
            // }

            this.refreshing = true
            const response = await authApi.post("/auth/refresh");
            const data: { access_token: string } = response.data.data;
            this.access_token = data.access_token;
            const { exp } = jwtDecode(this.access_token)
            if(exp !== undefined) {
               this.exp = exp * 1000
            }
            this.scheduleRefreshToken()
            // this.last_refresh_time = Date.now()
         } catch (error) {
            // console.log(this.access_token)
            console.log(error)
            // handleAxiosError(error)
         } finally {
            this.refreshing = false
         }
      },

      async scheduleRefreshToken() {
         if(!this.access_token) return
         if(!this.refreshTimeout) clearTimeout(Number(this.refreshTimeout))
         try {
            const refreshTime =  this.exp ? this.exp - Date.now() - 60 * 1000 : 0
            if(refreshTime > 0 && this.refreshTimeout) {
               clearTimeout(this.refreshTimeout)
               this.refreshTimeout = setTimeout(() => this.refresh(), refreshTime) 
               console.log(`Scheduled refresh in ${refreshTime / 1000} seconds`)
            }else {
               await this.refresh()
            }
         } catch (error) {
            console.log("gagal mendecode token")
         }
      },

      setupVisibilityListener() {
         document.addEventListener("visibilitychange", () => {
           if (document.visibilityState === "visible") {
               console.log("🔄 Tab aktif kembali, cek token...");
               if(this.exp && this.exp - Date.now() <= 60 * 1000) {
                  console.log("⚠️ Token hampir expired, refresh segera...");
                  this.refresh(); // Cek token saat user kembali ke tab
               }else {
                  this.scheduleRefreshToken()
               }
           }
         });
      },
      
      async logout() {
         try {
            const response = await authApi.delete('/auth/logout')
            console.log(response)
            if(response.status === 204) {
               console.log('logout status 204')
               // sessionStorage.clear(),
               // localStorage.clear(),
               this.resetStore()
               console.log(this.access_token)
               console.log(this.user)
               // (this.user = null), (this.access_token = null);
            }
         } catch (error) {
            console.log(error)
         }
      },
   
      resetStore() {
         this.access_token = null
         this.user = null
         this.exp = null
         this.refreshTimeout = null
         this.refreshing = false
         this.login_error = null
      }
   },
   getters: {
      isLoggedIn: (state) => !!state.access_token,
   },
   persist: [
      {
         pick: ['access_token', 'user', 'exp', 'refreshTimeout', 'refreshing'],
         storage: localStorage
      },
      {
         pick: ['roles'],
         storage: sessionStorage
      }
   ]
});

// [
//    {
//       pick: ['access_token'],
//       storage: localStorage
//    },
//    {
//       pick: ['user', 'exp', 'refreshTimeout', 'refreshing']
//       // storage: sessionStorage
//    }
// ]
