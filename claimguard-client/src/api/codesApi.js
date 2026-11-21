import axiosInstance from './axiosInstance';

const toData = (response) => response.data;

export function fetchDiagnosisCodes() {
  return axiosInstance.get('/api/diagnosis-codes').then(toData);
}

export function createDiagnosisCode(payload) {
  return axiosInstance.post('/api/diagnosis-codes', payload).then(toData);
}

export function deleteDiagnosisCode(id) {
  return axiosInstance.delete(`/api/diagnosis-codes/${id}`);
}

export function fetchProcedureCodes() {
  return axiosInstance.get('/api/procedure-codes').then(toData);
}

export function createProcedureCode(payload) {
  return axiosInstance.post('/api/procedure-codes', payload).then(toData);
}

export function deleteProcedureCode(id) {
  return axiosInstance.delete(`/api/procedure-codes/${id}`);
}
