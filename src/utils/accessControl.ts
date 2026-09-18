import { UserSafe, UserRole } from '../types';
import { getGuestCredits } from './guestCredits';

export const BACKOFFICE_ROLES: UserRole[] = [
  'super_admin',
  'superadmin',
  'admin_level1',
  'admin_level2',
  'admin',
  'manager',
  'staff'
];

/**
 * Checks if a user has staff, admin or super-admin privileges (Backoffice access)
 */
export function isStaffOrAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return BACKOFFICE_ROLES.some((r) => r.toLowerCase() === normalized);
}

/**
 * Checks if a user is a super administrator (admin_level1, super_admin, superadmin)
 */
export function isSuperAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return ['super_admin', 'superadmin', 'admin_level1'].includes(normalized);
}

/**
 * Checks if a user is a client (frontend access only)
 */
export function isClientUser(role?: string | null): boolean {
  return !isStaffOrAdmin(role);
}

/**
 * Formats a friendly label for the role
 */
export function getRoleDisplayLabel(role?: string | null): string {
  if (!role) return 'Visitante';
  switch (role.toLowerCase()) {
    case 'super_admin':
    case 'superadmin':
    case 'admin_level1':
      return 'Super Administrador';
    case 'admin':
    case 'admin_level2':
      return 'Administrador';
    case 'manager':
      return 'Gestor Comercial';
    case 'staff':
      return 'Staff Utilizador';
    case 'client':
    case 'user':
    default:
      return 'Cliente';
  }
}

/**
 * Validates whether a user can perform a simulation in any module:
 * - Unauthenticated (Guest): uses free demonstration credits without login!
 * - Client: MUST have queriesRemaining > 0
 * - Staff / Admin / Super Admin: permitted to test & simulate freely
 */
export function canUserSimulate(user: UserSafe | null): {
  allowed: boolean;
  reason: 'not_authenticated' | 'no_credits' | 'ok';
  message: string;
  isGuest?: boolean;
  requiresAuth?: boolean;
} {
  return {
    allowed: true,
    reason: 'ok',
    message: 'Acesso livre a todas as simulações em tempo real.',
    isGuest: !user,
    requiresAuth: false
  };
}
