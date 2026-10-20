'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, useFetch } from '@/lib/client';
import { formatDate, formatIDR, periodKey, toInputDate } from '@/lib/format';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { FormModal } from '@/components/FormModal';
import { Pending } from '@/components/Loading';
import { useUser } from '@/components/UserProvider';
import { useAction } from '@/components/useAction';

export default function TenantsPage() {
  const tenants = useFetch('/api/tenants');
  const units = useFetch('/api/units');
  const { isSuper } = useUser();
  const reload = () => Promise.all([tenants.reload(), units.reload()]); // status unit ikut berubah
  const act = useAction(reload);
  const [form, setForm] = useState(null);

  const wait = Pending({ loading: tenants.loading || units.loading, error: tenants.error || units.error, data: tenants.data && units.data });
  if (wait) return wait;

  const t = form?.tenant;
  // Unit yang bisa dipilih: kosong, atau unit penghuni ini sendiri.
  const choices = units.data.filter((u) => u.status === 'Vacant' || u.id === t?.unit?.id);

  const save = async (v) => {
    const ok = await act(
      () => api(t ? 'PUT' : 'POST', t ? `/api/tenants/${t.id}` : '/api/tenants', v),
      t ? 'Data penghuni diperbarui' : 'Penghuni ditambahkan',
    );
    if (ok) setForm(null);
  };
  const remove = (r) => confirm(`Hapus ${r.name}? Seluruh riwayat pembayarannya ikut terhapus.`) && act(() => api('DELETE', `/api/tenants/${r.id}`), 'Penghuni dihapus');

  return (
    <>
      <DataTable
        rows={tenants.data}
        searchText={(r) => `${r.name} ${r.ktp} ${r.phone} ${r.unit?.number ?? ''}`}
        toolbar={<button className="btn-primary" onClick={() => (choices.length ? setForm({}) : alert('Tidak ada unit kosong. Tambahkan unit dulu.'))}><Plus className="h-4 w-4" />Tambah Penghuni</button>}
        columns={[
          { header: 'Nama', cell: (r) => <b>{r.name}</b> },
          { header: 'No. KTP', cell: (r) => r.ktp },
          { header: 'Telepon', cell: (r) => r.phone },
          { header: 'Kontak Darurat', cell: (r) => r.emergencyContact },
          { header: 'Tgl Masuk', cell: (r) => formatDate(r.entryDate) },
          { header: 'Unit', cell: (r) => r.unit?.number ?? '-' },
          { header: 'Status', cell: (r) => (r.moveOutDate && new Date(r.moveOutDate) <= new Date()
            ? <StatusBadge status="Vacant" label={`Keluar ${formatDate(r.moveOutDate)}`} />
            : <StatusBadge status="Occupied" label="Tinggal" />) },
          { header: '', cell: (r) => (
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => setForm({ tenant: r })}>Edit</button>
              {isSuper && <button className="btn-ghost btn-sm !text-rose-600" onClick={() => remove(r)}>Hapus</button>}
            </div>
          ) },
        ]}
      />
      {form && (
        <FormModal
          key={t?.id ?? 'new'} title={t ? 'Edit Penghuni' : 'Tambah Penghuni'} onClose={() => setForm(null)} onSubmit={save}
          fields={[
            { name: 'name', label: 'Nama Lengkap', value: t?.name },
            { name: 'ktp', label: 'No. KTP (16 digit)', value: t?.ktp, attrs: { pattern: '\\d{16}', title: '16 digit angka' } },
            { name: 'phone', label: 'No. Telepon', type: 'tel', value: t?.phone },
            { name: 'emergencyContact', label: 'Kontak Darurat (nama - nomor)', value: t?.emergencyContact },
            { name: 'entryDate', label: 'Tanggal Masuk', type: 'date', value: toInputDate(t?.entryDate) || toInputDate(new Date()) },
            { name: 'billingStart', label: 'Mulai ditagih dari bulan (hutang dihitung sejak bulan ini)', type: 'month', value: t?.billingStart || periodKey() },
            { name: 'moveOutDate', label: 'Tanggal keluar (kosongkan jika masih tinggal)', type: 'date', value: toInputDate(t?.moveOutDate), required: false },
            { name: 'unit', label: 'Unit', type: 'select', value: t?.unit?.id, options: choices.map((u) => [u.id, `${u.number} - ${formatIDR(u.price)}`]) },
          ]}
        />
      )}
    </>
  );
}
