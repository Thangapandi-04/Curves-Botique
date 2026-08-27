import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const cookieName = () => process.env.COOKIE_NAME || 'curve_auth';

export async function hashPassword(password) { return bcrypt.hash(password, 12); }
export async function comparePassword(password, hash) { return bcrypt.compare(password, hash); }

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
}

export function setAuthCookie(res, token) {
  res.cookie(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2,
    path: '/'
  });
}
export function clearAuthCookie(res) { res.clearCookie(cookieName(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }); }

export function requireAuth(req,res,next){
  try {
    const token = req.cookies?.[cookieName()];
    if (!token) return res.status(401).json({message:'Authentication required'});
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({message:'Session expired or invalid'}); }
}
export const requireAdmin = (req,res,next) => req.user?.role === 'ADMIN' ? next() : res.status(403).json({message:'Admin access required'});
