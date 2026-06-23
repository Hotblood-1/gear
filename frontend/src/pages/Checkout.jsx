import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { api, formatError } from "@/lib/api";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState(null);

  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [payment, setPayment] = useState("cod");

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyCode = async () => {
    if (!code.trim()) return;
    try {
      const r = await api.post(`/codes/validate?code=${encodeURIComponent(code.trim())}`);
      setDiscount(r.data.amount);
      setAppliedCode(r.data.code);
      toast.success(`Code applied: ₹${r.data.amount} off`);
    } catch (e) {
      setDiscount(0);
      setAppliedCode(null);
      toast.error(formatError(e));
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Cart is empty");
    for (const k of Object.keys(address)) {
      if (!address[k]) return toast.error("Please fill all address fields");
    }
    setSubmitting(true);
    try {
      const res = await api.post("/orders", {
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image_url: i.image_url,
        })),
        address,
        payment_method: payment,
        discount_code: appliedCode || null,
      });
      clear();
      nav(`/order/${res.data.id}`);
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-slate-500">
        Your cart is empty.
      </div>
    );
  }

  const F = (key, label, span = 6) => (
    <div className={`sm:col-span-${span}`}>
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <input
        data-testid={`checkout-${key}`}
        value={address[key]}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" data-testid="checkout-page">
      <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-6">
              {F("full_name", "Full name", 6)}
              {F("phone", "Phone", 6)}
              {F("address_line", "Address", 6)}
              {F("city", "City", 2)}
              {F("state", "State", 2)}
              {F("pincode", "PIN code", 2)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay on delivery" },
                { id: "upi", label: "UPI Payment", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
                { id: "razorpay", label: "Razorpay (Coming soon)", icon: CreditCard, desc: "Cards / NetBanking", disabled: true },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`checkout-pay-${p.id}`}
                  disabled={p.disabled}
                  onClick={() => setPayment(p.id)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
                    payment === p.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  } ${p.disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <p.icon className="h-5 w-5 text-blue-700" />
                  <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                  <div className="text-xs text-slate-500">{p.desc}</div>
                </button>
              ))}
            </div>
            {payment === "razorpay" && (
              <p className="mt-3 text-xs text-amber-700">Razorpay integration is reserved — connect your keys later.</p>
            )}
          </div>
        </div>

        <div className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-lg font-bold text-slate-900">Order summary</h3>

          <div className="max-h-60 space-y-3 overflow-auto">
            {items.map((i) => (
              <div key={i.product_id} className="flex items-center gap-3">
                <img src={i.image_url} alt={i.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1 text-sm">
                  <div className="line-clamp-1 font-medium text-slate-900">{i.name}</div>
                  <div className="text-xs text-slate-500">Qty {i.quantity}</div>
                </div>
                <div className="text-sm font-semibold">₹{i.price * i.quantity}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Discount code</label>
            <div className="flex gap-2">
              <input
                data-testid="checkout-discount-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ENTER CODE"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase focus:border-blue-600 focus:bg-white focus:outline-none"
              />
              <button
                data-testid="checkout-apply-code"
                type="button"
                onClick={applyCode}
                className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
            {appliedCode && (
              <div className="flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> {appliedCode} · ₹{discount} off
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-₹{discount}</span></div>
            )}
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 font-display text-lg font-bold text-slate-900">
              <span>Total</span><span data-testid="checkout-total">₹{total}</span>
            </div>
          </div>

          <button
            type="submit"
            data-testid="checkout-place-order"
            disabled={submitting || payment === "razorpay"}
            className="w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
          >
            {submitting ? "Placing order…" : `Place order · ₹${total}`}
          </button>
        </div>
      </form>
    </div>
  );
}
