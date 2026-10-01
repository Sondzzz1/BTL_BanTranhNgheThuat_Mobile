import apiClient from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ConsultationBooking, CreateConsultationInput } from '../types/consultation';

export const consultationService = {
  async getMine(): Promise<ConsultationBooking[]> {
    const response = await apiClient.get<ConsultationBooking[]>(API_ENDPOINTS.CONSULTATION_MY);
    return response.data;
  },

  async create(input: CreateConsultationInput): Promise<ConsultationBooking> {
    const response = await apiClient.post<ConsultationBooking>(API_ENDPOINTS.CONSULTATION_BOOK, input);
    return response.data;
  },
};
