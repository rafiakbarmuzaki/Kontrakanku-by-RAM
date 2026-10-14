'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, useFetch } from '@/lib/client';
import { formatIDR } from '@/lib/format';
import { DataTable } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { StatusBadge } from '@/components/StatusBadge';
import { Pending } from '@/components/Loading';
import { useUser } from '@/components/UserProvider';
import { useAction } from '@/components/useAction';

export default function UnitsPage() {
  const { data, loading, error, reload } = useFetch('/api/units');
  const { isSuper } = useUser();
  const act = useAction(reload);
  const [form, setForm] = useState(null); // null = tertutup, {} = tambah, {unit} = edit

  const wait = Pending({ loading, error, data });
  if (wait) return wait;

  const save = async (v) => {
    const editing = form.unit;
    const body = { number: v.number, price: Number(v.price), status: v.status, facilities: v.facilities.split(',') };
    const ok = await act(
      () => api(editing ? 'PUT' : 'POST', editing ? `/api/units/${editing.id}` : '/api/units', body),
      editing ? 'Unit diperbarui' : 'Unit ditambahkan',
    );
    if (ok) setForm(null);
  };
  const remove = (u) => confirm(`Hapus unit ${u.number}?`) && act(() => api('DELETE', `/api/units/${u.id}`), 'Unit dihapus');

  const u = form?.unit;
  return (
    <>
      <DataTable
        rows={data}
        searchText={(r) => `${r.number} ${r.status} ${r.facilities.join(' ')}`}
        toolbar={<button className="btn-primary" onClick={() => setForm({})}><Plus className="h-4 w-4" />Tambah Unit</button>}
        columns={[
          { header: 'No. Unit', cell: (r) => <b>{r.number}</b> },
          { header: 'Harga / Bulan', cell: (r) => formatIDR(r.price) },
          { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
          { header: 'Fasilitas', cell: (r) => r.facilities.join(', ') || '-' },
          { header: '', cell: (r) => (
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => setForm({ unit: r })}>Edit</button>
              {isSuper && <button className="btn-ghost btn-sm !text-rose-600" onClick={() => remove(r)}>Hapus</button>}
            </div>
          ) },
        ]}
      />
      {form && (
        <FormModal
          key={u?.id ?? 'new'} title={u ? 'Edit Unit' : 'Tambah Unit'} onClose={() => setForm(null)} onSubmit={save}
          fields={[
            { name: 'number', label: 'Nomor Unit', value: u?.number },
            { name: 'price', label: 'Harga per Bulan (Rp)', type: 'number', value: u?.price, attrs: { min: 0 } },
            { name: 'status', label: 'Status', type: 'select', value: u?.status ?? 'Vacant', options: [['Vacant', 'Vacant (Kosong)'], ['Occupied', 'Occupied (Terisi)'], ['Maintenance', 'Maintenance (Perbaikan)']] },
            { name: 'facilities', label: 'Fasilitas (pisahkan dengan koma)', value: u?.facilities.join(', '), required: false },
          ]}
        />
      )}
    </>
  );
}
