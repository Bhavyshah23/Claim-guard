import axiosInstance from './axiosInstance';

const toData = (response) => response.data;

export function fetchRules() {
  return axiosInstance.get('/api/rules').then(toData);
}

export function createRule(payload) {
  return axiosInstance.post('/api/rules', payload).then(toData);
}

export function updateRule(ruleId, payload) {
  return axiosInstance.put(`/api/rules/${ruleId}`, payload).then(toData);
}

export function toggleRuleActive(ruleId) {
  return axiosInstance.patch(`/api/rules/${ruleId}/active`).then(toData);
}

export function deleteRule(ruleId) {
  return axiosInstance.delete(`/api/rules/${ruleId}`).then(toData);
}
