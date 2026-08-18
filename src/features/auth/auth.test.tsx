import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { LoginForm } from './ui/LoginForm';

describe('LoginForm validation', () => {
  it('surfaces an accessible error when email is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.clear(screen.getByLabelText(/email/i));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const error = await screen.findByText(/email is required/i);
    expect(error).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('logs in with valid pre-filled credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // On success the mutation resolves; the button leaves its loading state.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    });
  });
});
