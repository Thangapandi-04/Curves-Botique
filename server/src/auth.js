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
    console.info('[AUTH_DEBUG]', JSON.stringify({ path: req.originalUrl, cookiePresent: Boolean(token) }));
    if (!token) return res.status(401).json({message:'Authentication required'});
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    console.info('[AUTH_DEBUG]', JSON.stringify({ path: req.originalUrl, jwtVerified: true, userId: req.user?.id ?? null, userRole: req.user?.role ?? null }));
    next();
  } catch (err) { console.info('[AUTH_DEBUG]', JSON.stringify({ path: req.originalUrl, jwtVerified: false, failureReason: err.name })); return res.status(401).json({message:'Session expired or invalid'}); }
}
export const requireAdmin = (req,res,next) => {
  const adminCheck = req.user?.role === 'ADMIN';
  console.info('[AUTH_DEBUG]', JSON.stringify({ path: req.originalUrl, userId: req.user?.id ?? null, userRole: req.user?.role ?? null, adminCheck }));
  return adminCheck ? next() : res.status(403).json({message:'Admin access required'});
};
