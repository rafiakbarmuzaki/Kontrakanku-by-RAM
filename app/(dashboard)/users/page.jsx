'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, useFetch } from '@/lib/client';
import { DataTable } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { StatusBadge } from '@/components/StatusBadge';
import { Pending } from '@/components/Loading';
import { useUser } from '@/components/UserProvider';
import { useAction } from '@/components/useAction';

const ROLES = [['admin', 'Admin'], ['super_admin', 'Super Admin']];

/** Hanya super admin: kelola akun pemegang. */
export default function UsersPage() {
  const { user: me, isSuper } = useUser();
  const { data, loading, error, reload } = useFetch(isSuper ? '/api/users' : null);
  const act = useAction(reload);
  const [form, setForm] = useState(null); // {} = tambah, {reset: user} = reset password

  if (!isSuper) return <p className="card p-6 text-sm">Halaman ini hanya untuk super admin.</p>;
  const wait = Pending({ loading, error, data });
  if (wait) return wait;

  const save = async (v) => {
    const ok = await act(
      () => (form.reset ? api('PUT', `/api/users/${form.reset.id}`, { password: v.password }) : api('POST', '/api/users', v)),
      form.reset ? 'Password diperbarui' : 'Akun ditambahkan',
    );
    if (ok) setForm(null);
  };
  const setRole = async (u, role) => { if (!(await act(() => api('PUT', `/api/users/${u.id}`, { role }), 'Peran diperbarui'))) reload(); };
  const remove = (u) => confirm(`Hapus akun ${u.email}?`) && act(() => api('DELETE', `/api/users/${u.id}`), 'Akun dihapus');

  const passwordField = { name: 'password', label: 'Password (min. 8 karakter)', type: 'password', attrs: { minLength: 8, autoComplete: 'new-password' } };

  return (
    <>
      <DataTable
        rows={data}
        toolbar={<button className="btn-primary" onClick={() => setForm({})}><Plus className="h-4 w-4" />Tambah Akun</button>}
        columns={[
          { header: 'Email', cell: (u) => u.email },
          { header: 'Peran', cell: (u) => u.id === me.id
            ? <StatusBadge status="super_admin" label="Super Admin (Anda)" />
            : <select className="input !w-44 !py-1" value={u.role} onChange={(e) => setRole(u, e.target.value)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> },
          { header: '', cell: (u) => u.id === me.id ? null : (
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => setForm({ reset: u })}>Reset Password</button>
              <button className="btn-ghost btn-sm !text-rose-600" onClick={() => remove(u)}>Hapus</button>
            </div>
          ) },
        ]}
      />
      {form && (
        <FormModal
          key={form.reset?.id ?? 'new'} title={form.reset ? `Reset Password - ${form.reset.email}` : 'Tambah Akun'} onClose={() => setForm(null)} onSubmit={save}
          fields={form.reset ? [passwordField] : [
            { name: 'email', label: 'Email', type: 'email' },
            passwordField,
            { name: 'role', label: 'Peran', type: 'select', value: 'admin', options: ROLES },
          ]}
        />
      )}
    </>
  );
}
