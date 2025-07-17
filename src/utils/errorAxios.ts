import { AxiosError } from "axios";

export function handleAxiosError(error: unknown): never {
    if (error instanceof AxiosError && error.response) {
        console.log(error)
        if(error.status === 500) {
            throw new Error("Terjadi masalah pada server")
        }

        if(error.response.data?.errors) {
            throw new Error(error.response.data.message)
        }
        
        throw new Error(error.response.data?.error?.message);
    }
    throw error;
}