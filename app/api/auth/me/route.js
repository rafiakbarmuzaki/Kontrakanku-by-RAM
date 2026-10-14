import { route, json } from '@/lib/api';

export const GET = route(async ({ user }) => json({ id: String(user._id), email: user.email, role: user.role }));
