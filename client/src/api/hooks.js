import { useQuery } from '@tanstack/react-query';
import api from './client';

export function useStaff() {
  return useQuery({ queryKey: ['staff'], queryFn: async () => (await api.get('/staff')).staff });
}

export function useServices() {
  return useQuery({ queryKey: ['services'], queryFn: async () => (await api.get('/services')).services });
}

export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: async () => (await api.get('/clients')).clients });
}

export function useAppointments(date) {
  return useQuery({ queryKey: ['appointments', date], queryFn: async () => (await api.get(`/appointments?date=${date}`)).appointments });
}

export function useAvailability(bizSlug, serviceId, date, staffId) {
  return useQuery({
    queryKey: ['availability', bizSlug, serviceId, date, staffId],
    queryFn: async () => {
      const params = new URLSearchParams({ serviceId, date });
      if (staffId) params.append('staffId', staffId);
      return (await api.get(`/availability/${bizSlug}?${params.toString()}`)).slots;
    },
    enabled: Boolean(bizSlug && serviceId && date),
  });
}
