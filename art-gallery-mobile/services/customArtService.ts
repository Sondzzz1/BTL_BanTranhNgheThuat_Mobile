import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { CommissionCreateInput, CommissionRequest, LocalUploadFile } from '../types/customArt';
import apiClient from './api';

type CommissionFiles = {
  reference?: LocalUploadFile;
  source?: LocalUploadFile;
  evidence?: LocalUploadFile;
};

const append = (form: FormData, key: string, value: unknown) => {
  if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
};

const appendFile = (form: FormData, key: string, file?: LocalUploadFile) => {
  if (file) form.append(key, file as any);
};

export const customArtService = {
  async create(input: CommissionCreateInput, files: CommissionFiles): Promise<CommissionRequest> {
    const form = new FormData();
    Object.entries(input).forEach(([key, value]) => append(form, key, value));
    appendFile(form, 'anhThamKhaoFile', files.reference);
    appendFile(form, 'anhTacPhamGocFile', files.source);
    appendFile(form, 'bangChungQuyenSuDungFile', files.evidence);
    const response = await apiClient.post<CommissionRequest>(
      API_ENDPOINTS.CUSTOM_ART_CREATE_WITH_FILES,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async getMine(): Promise<CommissionRequest[]> {
    const response = await apiClient.get<CommissionRequest[]>(API_ENDPOINTS.CUSTOM_ART_MY);
    return response.data || [];
  },

  async getById(id: number): Promise<CommissionRequest> {
    const response = await apiClient.get<CommissionRequest>(API_ENDPOINTS.CUSTOM_ART_DETAIL(id));
    return response.data;
  },

  async cancel(id: number): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CUSTOM_ART_CANCEL(id));
  },

  async acceptQuote(quoteId: number): Promise<void> {
    await apiClient.post(`/tranh-theo-yeu-cau/bao-gia/${quoteId}/xac-nhan`);
  },

  absoluteFileUrl(path?: string | null): string | undefined {
    if (!path) return undefined;
    if (/^data:image\//i.test(path)) return path;
    if (/^https?:\/\//i.test(path)) return path;
    const origin = API_BASE_URL.replace(/\/api\/?$/i, '');
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  },
};
