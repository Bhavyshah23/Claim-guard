import axiosInstance from './axiosInstance';

const toData = (response) => response.data;

export function fetchInsurers() {
  return axiosInstance.get('/api/insurers').then(toData);
}

export function createInsurer(payload) {
  return axiosInstance.post('/api/insurers', payload).then(toData);
}

export function updateInsurer(id, payload) {
  return axiosInstance.put(`/api/insurers/${id}`, payload).then(toData);
}

export function deleteInsurer(id) {
  return axiosInstance.delete(`/api/insurers/${id}`);
}
