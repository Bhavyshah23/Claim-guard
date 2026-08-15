import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('renders ClaimGuard branding on the login placeholder', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
  expect(screen.getByText('ClaimGuard')).toBeInTheDocument();
  expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
});
