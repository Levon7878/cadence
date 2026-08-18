import { describe, expect, it } from 'vitest';
import { can, roleAtLeast, roleHas } from './permissions';

describe('permissions.can', () => {
  it('denies everything for an anonymous principal', () => {
    expect(can(null, 'project:view')).toBe(false);
    expect(can(undefined, 'task:view')).toBe(false);
  });

  it('grants read-only access to viewers', () => {
    const viewer = { role: 'viewer' as const, id: 'u1' };
    expect(can(viewer, 'project:view')).toBe(true);
    expect(can(viewer, 'task:create')).toBe(false);
    expect(can(viewer, 'member:invite')).toBe(false);
  });

  it('scopes task editing to ownership for members', () => {
    const member = { role: 'member' as const, id: 'u1' };
    expect(can(member, 'task:edit', { ownerId: 'u1' })).toBe(true);
    expect(can(member, 'task:edit', { ownerId: 'u2' })).toBe(false);
    // Without a resource, the base grant applies.
    expect(can(member, 'task:edit')).toBe(true);
  });

  it('lets managers edit any task regardless of ownership', () => {
    const manager = { role: 'manager' as const, id: 'u1' };
    expect(can(manager, 'task:edit', { ownerId: 'someone-else' })).toBe(true);
    expect(can(manager, 'project:create')).toBe(true);
  });

  it('reserves billing management for the owner', () => {
    expect(can({ role: 'admin' as const }, 'billing:manage')).toBe(false);
    expect(can({ role: 'owner' as const }, 'billing:manage')).toBe(true);
    expect(can({ role: 'admin' as const }, 'billing:view')).toBe(true);
  });

  it('supports role hierarchy helpers', () => {
    expect(roleAtLeast('admin', 'manager')).toBe(true);
    expect(roleAtLeast('member', 'admin')).toBe(false);
    expect(roleHas('owner', 'billing:manage')).toBe(true);
    expect(roleHas('viewer', 'task:create')).toBe(false);
  });
});
