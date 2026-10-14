import { cookies } from 'next/headers';
import { COOKIE, verifyToken } from './token';
import { User } from './models';

/** Ambil user yang sedang login dari cookie (null jika belum login / akun sudah dihapus). */
export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  const id = token && (await verifyToken(token));
  // Cek ke database agar perubahan peran / penghapusan akun langsung berlaku.
  return id ? User.findById(id).catch(() => null) : null;
}
