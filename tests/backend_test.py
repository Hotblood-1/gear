"""TestSeries backend smoke tests."""
import requests
import uuid
import json

BASE = "https://study-gear-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "AyzalKhan@testseries.com"
ADMIN_PASSWORD = "AyzalKhan@2023"
PHONE = "9876543210"

results = {"passed": [], "failed": []}

def check(name, cond, evidence=""):
    if cond:
        print(f"PASS: {name}")
        results["passed"].append(name)
    else:
        print(f"FAIL: {name} | {evidence}")
        results["failed"].append({"name": name, "evidence": evidence})

# ---- 1. Products list ----
r = requests.get(f"{BASE}/products", timeout=15)
prods = r.json() if r.ok else []
check("GET /products returns 200 with >=10", r.status_code == 200 and len(prods) >= 10,
      f"status={r.status_code}, count={len(prods)}")
if prods:
    p0 = prods[0]
    check("Product has required fields",
          all(k in p0 for k in ("name", "price", "category", "image_url", "stock", "id")),
          f"keys={list(p0.keys())}")

# ---- 2. Category filter ----
r = requests.get(f"{BASE}/products?category=Tablet", timeout=15)
tablets = r.json() if r.ok else []
check("Category=Tablet filters", r.status_code == 200 and all(p["category"] == "Tablet" for p in tablets) and len(tablets) >= 1,
      f"status={r.status_code}, count={len(tablets)}")

# ---- 3. Search filter ----
r = requests.get(f"{BASE}/products?search=notebook", timeout=15)
nbs = r.json() if r.ok else []
check("Search=notebook filters", r.status_code == 200 and all("notebook" in p["name"].lower() for p in nbs) and len(nbs) >= 1,
      f"status={r.status_code}, count={len(nbs)}")

# ---- 4. Get single product & 404 ----
pid = prods[0]["id"] if prods else None
r = requests.get(f"{BASE}/products/{pid}", timeout=15)
check("GET /products/{id} returns product", r.status_code == 200 and r.json().get("id") == pid, f"status={r.status_code}")
r = requests.get(f"{BASE}/products/non-existent-id-xyz", timeout=15)
check("GET /products/{invalid} returns 404", r.status_code == 404, f"status={r.status_code}")

# ---- 5. Customer OTP request ----
r = requests.post(f"{BASE}/auth/customer/request-otp", json={"phone": PHONE}, timeout=15)
otp_data = r.json() if r.ok else {}
otp = otp_data.get("otp")
check("request-otp returns otp+mock", r.status_code == 200 and otp and otp_data.get("mock") is True,
      f"status={r.status_code}, body={otp_data}")

# ---- 6. Verify OTP (invalid) ----
r = requests.post(f"{BASE}/auth/customer/verify-otp", json={"phone": PHONE, "otp": "000000"}, timeout=15)
check("verify-otp invalid returns 400", r.status_code == 400, f"status={r.status_code}")

# ---- 7. Verify OTP (valid) ----
r = requests.post(f"{BASE}/auth/customer/verify-otp", json={"phone": PHONE, "otp": otp, "name": "Test User"}, timeout=15)
vdata = r.json() if r.ok else {}
cust_token = vdata.get("token")
check("verify-otp valid returns token+role=customer",
      r.status_code == 200 and cust_token and vdata.get("user", {}).get("role") == "customer",
      f"status={r.status_code}, body={vdata}")

# ---- 8. Admin login ----
r = requests.post(f"{BASE}/auth/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
adata = r.json() if r.ok else {}
admin_token = adata.get("token")
check("admin login returns token+role=admin",
      r.status_code == 200 and admin_token and adata.get("user", {}).get("role") == "admin",
      f"status={r.status_code}")

r = requests.post(f"{BASE}/auth/admin/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
check("admin login wrong pw returns 401", r.status_code == 401, f"status={r.status_code}")

# ---- 9. /auth/me ----
r = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
check("auth/me returns current admin", r.status_code == 200 and r.json().get("role") == "admin",
      f"status={r.status_code}")

# ---- 10. Admin RBAC ----
r = requests.get(f"{BASE}/admin/orders", headers={"Authorization": f"Bearer {cust_token}"}, timeout=15)
check("Customer accessing /admin/orders -> 403", r.status_code == 403, f"status={r.status_code}")

# ---- 11. Product CRUD admin ----
ah = {"Authorization": f"Bearer {admin_token}"}
new_p = {"name": "Test Pen", "category": "Stationery", "price": 50, "stock": 10, "image_url": "", "description": "x"}
r = requests.post(f"{BASE}/admin/products", json=new_p, headers=ah, timeout=15)
created = r.json() if r.ok else {}
new_id = created.get("id")
check("Admin create product", r.status_code == 200 and new_id, f"status={r.status_code}, body={created}")

r = requests.patch(f"{BASE}/admin/products/{new_id}", json={"price": 60}, headers=ah, timeout=15)
check("Admin patch product price", r.status_code == 200 and r.json().get("price") == 60, f"status={r.status_code}")

r = requests.delete(f"{BASE}/admin/products/{new_id}", headers=ah, timeout=15)
check("Admin delete product", r.status_code == 200 and r.json().get("success"), f"status={r.status_code}")

# ---- 12. Discount code lifecycle ----
code_str = "TESTCODE" + uuid.uuid4().hex[:5].upper()
r = requests.post(f"{BASE}/admin/codes", json={"code": code_str, "amount": 50, "one_time": True}, headers=ah, timeout=15)
cdata = r.json() if r.ok else {}
check("Admin create discount code", r.status_code == 200 and cdata.get("code") == code_str, f"status={r.status_code}")

r = requests.post(f"{BASE}/codes/validate?code={code_str}", timeout=15)
check("Validate code returns amount", r.status_code == 200 and r.json().get("amount") == 50, f"status={r.status_code}")

# ---- 13. Order create ----
test_prod = prods[0]
items = [{"product_id": test_prod["id"], "name": test_prod["name"], "price": test_prod["price"],
          "quantity": 1, "image_url": test_prod.get("image_url", "")}]
addr = {"full_name": "T U", "phone": PHONE, "address_line": "123 St", "city": "Delhi", "state": "DL", "pincode": "110001"}
order_payload = {"items": items, "address": addr, "payment_method": "cod", "discount_code": code_str}
ch = {"Authorization": f"Bearer {cust_token}"}
r = requests.post(f"{BASE}/orders", json=order_payload, headers=ch, timeout=15)
odata = r.json() if r.ok else {}
order_id = odata.get("id")
expected_subtotal = test_prod["price"]
expected_shipping = 0 if expected_subtotal >= 499 else 49
expected_total = max(0, expected_subtotal - 50 + expected_shipping)
check("Create order with discount + shipping calc",
      r.status_code == 200 and odata.get("subtotal") == expected_subtotal
      and odata.get("shipping") == expected_shipping and odata.get("total") == expected_total
      and odata.get("discount") == 50 and odata.get("order_number", "").startswith("TS"),
      f"status={r.status_code}, body={odata}")

# ---- 14. Reuse one-time code ----
r = requests.post(f"{BASE}/codes/validate?code={code_str}", timeout=15)
check("One-time code reuse rejected after use", r.status_code == 400, f"status={r.status_code}")

# ---- 15. Customer orders/mine ----
r = requests.get(f"{BASE}/orders/mine", headers=ch, timeout=15)
mine = r.json() if r.ok else []
check("orders/mine returns customer's orders", r.status_code == 200 and any(o.get("id") == order_id for o in mine),
      f"status={r.status_code}, count={len(mine)}")

# ---- 16. Other customer can't access ----
r = requests.post(f"{BASE}/auth/customer/request-otp", json={"phone": "9000000001"}, timeout=15)
o2 = r.json().get("otp")
r = requests.post(f"{BASE}/auth/customer/verify-otp", json={"phone": "9000000001", "otp": o2, "name": "Other"}, timeout=15)
other_token = r.json().get("token")
r = requests.get(f"{BASE}/orders/{order_id}", headers={"Authorization": f"Bearer {other_token}"}, timeout=15)
check("Non-owner GET /orders/{id} -> 403", r.status_code == 403, f"status={r.status_code}")

# ---- 17. Admin update order status ----
r = requests.patch(f"{BASE}/admin/orders/{order_id}", json={"status": "shipped"}, headers=ah, timeout=15)
check("Admin update status to shipped", r.status_code == 200, f"status={r.status_code}")

r = requests.patch(f"{BASE}/admin/orders/{order_id}", json={"status": "invalid_status"}, headers=ah, timeout=15)
check("Admin update invalid status -> 400", r.status_code == 400, f"status={r.status_code}")

print("\n=== Summary ===")
print(f"Passed: {len(results['passed'])}")
print(f"Failed: {len(results['failed'])}")
print(json.dumps(results, indent=2))
