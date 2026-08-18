import { describe, expect, it, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, authenticate } from '@/test/utils';
import { useSessionStore } from '@/entities/session';
import { useDemoRoleStore } from '@/features/rbac';
import { Can } from './ui/Can';

beforeEach(() => {
  useSessionStore.setState({ user: null, status: 'unauthenticated' });
  useDemoRoleStore.setState({ overrideRole: null });
});

describe('<Can> gate', () => {
  it('hides affordances a viewer cannot use', () => {
    authenticate('viewer');
    renderWithProviders(
      <Can action="member:invite" fallback={<span>hidden</span>}>
        <button>Invite member</button>
      </Can>,
    );
    expect(screen.queryByRole('button', { name: /invite member/i })).not.toBeInTheDocument();
    expect(screen.getByText('hidden')).toBeInTheDocument();
  });

  it('shows affordances an admin can use', () => {
    authenticate('admin');
    renderWithProviders(
      <Can action="member:invite">
        <button>Invite member</button>
      </Can>,
    );
    expect(screen.getByRole('button', { name: /invite member/i })).toBeInTheDocument();
  });

  it('reserves billing management for the owner', () => {
    authenticate('admin');
    const { rerender } = renderWithProviders(
      <Can action="billing:manage">
        <button>Manage billing</button>
      </Can>,
    );
    expect(screen.queryByRole('button', { name: /manage billing/i })).not.toBeInTheDocument();

    authenticate('owner');
    rerender(
      <Can action="billing:manage">
        <button>Manage billing</button>
      </Can>,
    );
    expect(screen.getByRole('button', { name: /manage billing/i })).toBeInTheDocument();
  });
});
