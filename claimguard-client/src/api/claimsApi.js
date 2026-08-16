import axiosInstance from './axiosInstance';

const toData = (response) => response.data;

export function fetchPatients() {
  return axiosInstance.get('/api/patients').then(toData);
}

export function fetchInsurers() {
  return axiosInstance.get('/api/insurers').then(toData);
}

export function fetchDiagnosisCodes() {
  return axiosInstance.get('/api/diagnosis-codes').then(toData);
}

export function fetchProcedureCodes() {
  return axiosInstance.get('/api/procedure-codes').then(toData);
}

// Staff endpoint is admin-facing; we only want the doctors on this page.
export async function fetchDoctors() {
  const staff = await axiosInstance.get('/api/admin/staff').then(toData);
  return staff.filter((member) => member.role === 'DOCTOR');
}

export function createClaim(payload) {
  return axiosInstance.post('/api/claims', payload).then(toData);
}

export function checkClaim(claimId) {
  return axiosInstance.post(`/api/claims/${claimId}/check`).then(toData);
}
