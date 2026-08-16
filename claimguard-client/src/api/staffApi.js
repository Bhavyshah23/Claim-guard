import axiosInstance from './axiosInstance';

const toData = (response) => response.data;

export function fetchStaff() {
  return axiosInstance.get('/api/admin/staff').then(toData);
}

export function createStaff(payload) {
  return axiosInstance.post('/api/admin/staff', payload).then(toData);
}
