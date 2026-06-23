import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, CheckCircle2, XCircle } from "lucide-react";
import { api, formatError } from "@/lib/api";
import { AdminSidebar } from "@/pages/admin/AdminProducts";

export default function AdminCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState(50);
  const [oneTime, setOneTime] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/codes");
      setCodes(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/codes", { code: code.trim() || null, amount: Number(amount), one_time: oneTime });
      toast.success("Code created");
      setCode("");
      setAmount(50);
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this code?")) return;
    try {
      await api.delete(`/admin/codes/${id}`);
      load();
    } catch (e) {
      toast.error(formatError(e));
    }
  };

  const copy = (c) => {
    navigator.clipboard.writeText(c);
    toast.success(`Copied: ${c}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="admin-codes-page">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-slate-900">Discount Codes</h1>

          <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Code (leave empty for auto)</label>
              <input
                data-testid="admin-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="STUDENT50"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Amount (₹)</label>
              <input
                data-testid="admin-code-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={oneTime}
                  onChange={(e) => setOneTime(e.target.checked)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                One-time use
              </label>
            </div>
            <div className="flex items-end">
              <button type="submit" data-testid="admin-code-create" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Create
              </button>
            </div>
          </form>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-4 py-12 text-center text-slate-400">Loading…</td></tr>
                ) : codes.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-12 text-center text-slate-400">No codes yet</td></tr>
                ) : (
                  codes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{c.code}</td>
                      <td className="px-4 py-3">₹{c.amount}</td>
                      <td className="px-4 py-3 text-slate-600">{c.one_time ? "One-time" : "Reusable"}</td>
                      <td className="px-4 py-3">
                        {c.used ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            <XCircle className="h-3 w-3" /> Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => copy(c.code)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(c.id)} data-testid={`admin-code-delete-${c.id}`} className="rounded-full p-2 text-rose-500 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
