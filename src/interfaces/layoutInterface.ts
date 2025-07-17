import type { FormFieldState } from '@primevue/forms'

export interface MenuItem {
    disabled?: boolean;
    to?: string;
    url?: string;
    items?: MenuItem[];
    command?: (options: { originalEvent: MouseEvent; item: MenuItem }) => void;
}

export interface SubmitEventForm {
    originalEvent: Event
    values: Record<string, any>
    states: Record<string, FormFieldState>
    valid: boolean
    errors: any[]
    reset: Function
}

export interface PaginationMeta {
    total: number
    page: number
    limit: number
}

export interface FiltersBelumTerdaftar {
    nama: {value: any, matchMode: any}
    nisn: {value: any, matchMode: any}
    isDokumenFull: {value: any, matchMode: any}
    isWilayahFull: {value: any, matchMode: any}
    statusDaftar: {value: any, matchMode: any}
}

export interface FiltersSudahTerdaftar extends Omit<FiltersBelumTerdaftar, 'isDokumenFull' | 'isWilayahFull' | 'statusDaftar'> {
    statusPendaftaran: {value: any, matchMode: any}
    statusKelulusan: {value: any, matchMode: any}
}

export interface Field {
    name: string;
    label: string;
    is_required?: boolean;
    type: 'select' | 'date' | 'text';
    attrs?: Record<string, any>;
    showIf?: (form: Record<string, any>) => boolean;
}
