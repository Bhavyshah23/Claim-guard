import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );

test('renders the login page with branded panel', () => {
  renderAt('/login');
  expect(screen.getByText('Welcome back')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  expect(screen.getByText('Catch claim errors before they cost you.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Set up your account' })).toBeInTheDocument();
});

test('shows inline validation on empty login submit', async () => {
  renderAt('/login');
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  expect(screen.getByText('Enter your username')).toBeInTheDocument();
  expect(screen.getByText('Enter your password')).toBeInTheDocument();
});

test('renders the register page', () => {
  renderAt('/register');
  expect(screen.getByText('Set up your clinic')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
});
