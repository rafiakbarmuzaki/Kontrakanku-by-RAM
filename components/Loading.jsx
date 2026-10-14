/** Tampilan sementara untuk halaman yang datanya belum siap. Return null jika data sudah ada. */
export function Pending({ loading, error, data }) {
  if (error) return <p className="card p-6 text-sm text-rose-600">Gagal memuat data: {error}</p>;
  if (loading || !data) return <p className="text-sm text-slate-500">Memuat data...</p>;
  return null;
}
