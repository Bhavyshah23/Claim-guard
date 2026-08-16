export const NETWORK_ERROR_MESSAGE = 'Something went wrong, please try again';

/**
 * Normalizes backend auth errors into field-level and form-level errors.
 *
 * - 400 responses carry `{ errors: { field: message } }` -> field-level.
 * - 401/other responses carry `{ message }` -> form-level, unless
 *   `messageOnField` is set and the message references one of the fields.
 * - Network failures have no response -> generic fallback message.
 */
export function mapAuthError(error, fields, { messageOnField = false } = {}) {
  const fieldErrors = {};
  let formError = null;
  const data = error?.response?.data;

  if (data?.errors && typeof data.errors === 'object') {
    Object.entries(data.errors).forEach(([field, message]) => {
      if (fields.includes(field)) {
        fieldErrors[field] = message;
      } else if (!formError) {
        formError = message;
      }
    });
  } else if (data?.message) {
    if (messageOnField) {
      const matchedField = fields.find((field) =>
        data.message.toLowerCase().includes(field.toLowerCase())
      );
      if (matchedField) {
        fieldErrors[matchedField] = data.message;
      } else {
        formError = data.message;
      }
    } else {
      formError = data.message;
    }
  } else {
    formError = NETWORK_ERROR_MESSAGE;
  }

  return { fieldErrors, formError };
}
