import axiosInstance from './axiosInstance';

const toData = (response) => response.data;

export function fetchPatients() {
  return axiosInstance.get('/api/patients').then(toData);
}

export function createPatient(payload) {
  return axiosInstance.post('/api/patients', payload).then(toData);
}

export function updatePatient(id, payload) {
  return axiosInstance.put(`/api/patients/${id}`, payload).then(toData);
}

export function deletePatient(id) {
  return axiosInstance.delete(`/api/patients/${id}`);
}
