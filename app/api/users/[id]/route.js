import bcrypt from 'bcryptjs';
import { route, json, readBody, bad, checkId, HttpError } from '@/lib/api';
import { User } from '@/lib/models';

const notSelf = (user, id) => {
  if (String(user._id) === id) throw new HttpError(409, 'Tidak bisa mengubah akun sendiri');
};

export const PUT = route(async ({ req, user, params }) => {
  notSelf(user, checkId(params.id));
  const { role, password } = await readBody(req);
  const update = {};
  if (role) {
    if (!['admin', 'super_admin'].includes(role)) throw bad('Peran tidak valid');
    update.role = role;
  }
  if (password) {
    if (String(password).length < 8) throw bad('Password minimal 8 karakter');
    update.passwordHash = await bcrypt.hash(password, 12);
  }
  const target = await User.findByIdAndUpdate(params.id, update, { new: true });
  if (!target) throw new HttpError(404, 'Akun tidak ditemukan');
  return json(target);
}, { superOnly: true });

export const DELETE = route(async ({ user, params }) => {
  notSelf(user, checkId(params.id));
  await User.findByIdAndDelete(params.id);
  return json({ ok: true });
}, { superOnly: true });
