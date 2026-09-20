import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User } from './types.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'nanucloud-fiscal-security-key-2026-ao';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nif: user.nif,
      company: user.company
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function isStaffOrAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ['super_admin', 'admin_level1', 'admin_level2', 'manager', 'staff'].includes(role);
}

// Middleware de identificação do utilizador por JWT Bearer ou Cookie
export function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.nanucloud_token) {
      token = req.cookies.nanucloud_token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.id) {
      const user = db.findUserById(decoded.id) || db.findUserByEmail(decoded.email);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Token inválido ou expirado - segue como não autenticado
  }
  return next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sessão expirada ou não autenticado. Por favor inicie sessão.' });
  }
  return next();
}

export function requireStaffOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !isStaffOrAdminRole(req.user.role)) {
    return res.status(403).json({ error: 'Acesso restrito à equipa administrativa.' });
  }
  return next();
}

export function requireAdminLevel1(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !['super_admin', 'admin_level1'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores de Nível 1 ou Super Admin.' });
  }
  return next();
}

export function requireAdminLevel2(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !['super_admin', 'admin_level1', 'admin_level2'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso restrito à equipa de gestão administrativa.' });
  }
  return next();
}

