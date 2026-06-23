import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Phone, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const requestOtp = async (e) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      return toast.error("Enter a valid 10-digit phone number");
    }
    setLoading(true);
    try {
      const r = await api.post("/auth/customer/request-otp", { phone });
      toast.success(`OTP sent (mock): ${r.data.otp}`, { duration: 10000 });
      setStep(2);
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const r = await api.post("/auth/customer/verify-otp", { phone, otp, name });
      loginWithToken(r.data.token, r.data.user);
      toast.success("Welcome to TestSeries!");
      const to = location.state?.from?.pathname || "/";
      nav(to);
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12" data-testid="login-page">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50">
          {step === 1 ? <Phone className="h-5 w-5 text-blue-700" /> : <KeyRound className="h-5 w-5 text-blue-700" />}
        </div>
        <h1 className="mt-5 text-center font-display text-2xl font-bold text-slate-900">
          {step === 1 ? "Sign in to TestSeries" : "Verify your number"}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          {step === 1
            ? "We'll send a one-time code to your phone."
            : `Enter the 6-digit OTP sent to ${phone}.`}
        </p>

        {step === 1 ? (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Your name (optional)</label>
              <input
                data-testid="login-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Riya Sharma"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Phone number</label>
              <div className="mt-1 flex rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white">
                <span className="grid place-items-center px-3 text-sm font-semibold text-slate-500">+91</span>
                <input
                  data-testid="login-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 bg-transparent px-2 py-3 text-sm focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="login-send-otp"
              className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">One-time code</label>
              <input
                data-testid="login-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg tracking-[0.5em] focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="login-verify-otp"
              className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-slate-500 hover:text-blue-700"
            >
              Change phone number
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Admin?{" "}
          <Link to="/admin/login" className="font-semibold text-blue-700 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
