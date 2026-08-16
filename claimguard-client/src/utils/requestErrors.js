export function extractRequestError(error, fallback = 'Something went wrong, please try again') {
  const data = error?.response?.data;

  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    return first ?? fallback;
  }
  if (typeof data?.message === 'string' && data.message) {
    return data.message;
  }
  if (!error?.response) {
    return 'Network error — check your connection and try again';
  }
  return fallback;
}
