// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// react-router v7 relies on TextEncoder/TextDecoder at module load, which the
// CRA 5 (Jest 27) jsdom environment does not provide.
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line global-require
  const { TextDecoder, TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
