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
 * Checks if a user has manager or admin privileges (Financial Dashboard & Management)
 */
export function isManagerOrAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return ['manager', 'gestor', 'super_admin', 'superadmin', 'admin_level1', 'admin_level2', 'admin'].includes(normalized);
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
      return 'Utilizador';
  }
}

/**
 * Validates whether a user can perform a simulation in any module:
 * - Unauthenticated (Guest): uses free demonstration credits without login!
 * - Utilizador: MUST have queriesRemaining > 0
 * - Staff / Admin / Super Admin: permitted to test & simulate freely
 */
export function canUserSimulate(user: UserSafe | null): {
  allowed: boolean;
  reason: 'not_authenticated' | 'no_credits' | 'ok';
  message: string;
  isGuest?: boolean;
  requiresAuth?: boolean;
} {
  // Staff and admins have unlimited queries
  if (user && isStaffOrAdmin(user.role)) {
    return {
      allowed: true,
      reason: 'ok',
      message: 'Acesso Staff / Administrador ilimitado.',
      isGuest: false,
      requiresAuth: false
    };
  }

  // If not logged in or guest operator, check available guest demonstration credits
  if (!user || user.id === 'visitante_anonimo') {
    const guestCredits = getGuestCredits();
    if (guestCredits <= 0) {
      return {
        allowed: false,
        reason: 'no_credits',
        message: 'Créditos de demonstração esgotados (0 créditos). Não é permitido simular sem créditos. Por favor subscreva um plano para recarregar.',
        isGuest: true,
        requiresAuth: true
      };
    }
    return {
      allowed: true,
      reason: 'ok',
      message: `Acesso com créditos ativos (${guestCredits} créditos restantes).`,
      isGuest: true,
      requiresAuth: false
    };
  }

  // Client user: strictly require positive credit balance
  if ((user.queriesRemaining || 0) <= 0) {
    return {
      allowed: false,
      reason: 'no_credits',
      message: 'Créditos de consulta esgotados (0 créditos). Não se faz simulação sem créditos. Por favor recarregue a sua conta para simular.',
      isGuest: false,
      requiresAuth: false
    };
  }

  return {
    allowed: true,
    reason: 'ok',
    message: `Acesso ativo (${user.queriesRemaining} créditos disponíveis).`,
    isGuest: false,
    requiresAuth: false
  };
}
