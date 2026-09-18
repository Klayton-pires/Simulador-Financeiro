import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

export function generateToken(_user: any): string {
  return '';
}

export function isStaffOrAdminRole(_role?: string | null): boolean {
  return true;
}

// Pass-through middleware: no authentication or login is required
export function authenticateUser(_req: AuthRequest, _res: Response, next: NextFunction) {
  return next();
}

export function requireAuth(_req: AuthRequest, _res: Response, next: NextFunction) {
  return next();
}

export function requireAdminLevel1(_req: AuthRequest, _res: Response, next: NextFunction) {
  return next();
}

export function requireAdminLevel2(_req: AuthRequest, _res: Response, next: NextFunction) {
  return next();
}

export function requireStaffOrAdmin(_req: AuthRequest, _res: Response, next: NextFunction) {
  return next();
}
