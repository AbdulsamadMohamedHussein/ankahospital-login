import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Reception.css";
import logo from "../../assets/logo.png";

/**
 * ReceptionDashboard.jsx (localStorage based)
 *
 * Storage keys used:
 *  - anka_patients
 *  - anka_invoices
 *  - anka_service_orders
 */

const LS = {
  patients: "anka_patients",
  invoices: "anka_invoices",
  serviceOrders: "anka_service_orders",
};

const todayISO = () => new Date().toISOString().split("T")[0];
const nowISO = () => new Date().toISOString();

const loadLS = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const saveLS = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const KES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const uid = (prefix = "ID") =>
  `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

// ---------------------------
// SERVICES
// ---------------------------
const LAB_TESTS = [
  { code: "LAB-001", name: "Full Blood Count (FBC)", price: 2000 },
  { code: "LAB-002", name: "Malaria Test (RDT)", price: 1000 },
  { code: "LAB-003", name: "Urinalysis", price: 1500 },
  { code: "LAB-004", name: "Stool Analysis", price: 1500 },
  { code: "LAB-005", name: "Blood Sugar (RBS/FBS)", price: 1200 },
  { code: "LAB-006", name: "Liver Function Test (LFT)", price: 4500 },
  { code: "LAB-007", name: "Kidney Function Test (KFT)", price: 4500 },
  { code: "LAB-008", name: "Pregnancy Test (HCG)", price: 1000 },
  { code: "LAB-009", name: "HIV Test", price: 1000 },
  { code: "LAB-010", name: "Hepatitis B (HBsAg)", price: 1500 },
  { code: "LAB-011", name: "Hepatitis C (HCV)", price: 1800 },
  { code: "LAB-012", name: "Widal Test", price: 1200 },
  { code: "LAB-013", name: "CRP", price: 2500 },
  { code: "LAB-014", name: "ESR", price: 1000 },
  { code: "LAB-015", name: "Blood Grouping", price: 1200 },
];

const RADIOLOGY_TESTS = [
  { code: "RAD-001", name: "X-Ray Chest (PA)", price: 2000 },
  { code: "RAD-002", name: "X-Ray Chest (AP)", price: 1800 },
  { code: "RAD-003", name: "X-Ray Abdomen", price: 2500 },
  { code: "RAD-004", name: "X-Ray Pelvis", price: 2500 },
  { code: "RAD-005", name: "X-Ray Spine (Cervical)", price: 3000 },
  { code: "RAD-006", name: "X-Ray Spine (Lumbar)", price: 3500 },
  { code: "RAD-007", name: "X-Ray Knee (1 view)", price: 1500 },
  { code: "RAD-008", name: "X-Ray Knee (2 views)", price: 2200 },
  { code: "RAD-009", name: "X-Ray Ankle", price: 1500 },
  { code: "RAD-010", name: "X-Ray Wrist", price: 1500 },
  { code: "RAD-011", name: "Ultrasound Abdomen", price: 4500 },
  { code: "RAD-012", name: "Ultrasound Pelvis", price: 3500 },
  { code: "RAD-013", name: "Ultrasound Obstetric (Basic)", price: 4000 },
  { code: "RAD-014", name: "Ultrasound Obstetric (Detailed)", price: 6000 },
  { code: "RAD-015", name: "Ultrasound KUB", price: 4500 },
  { code: "RAD-016", name: "Ultrasound Thyroid", price: 5000 },
  { code: "RAD-017", name: "ECG", price: 1000 },
  { code: "RAD-018", name: "ECHO (Basic)", price: 7000 },
  { code: "RAD-019", name: "Doppler (Single Limb)", price: 6500 },
  { code: "RAD-020", name: "CT Scan (Non-Contrast) - Referral", price: 7000 },
];

export default function ReceptionDashboard() {
  const printRef = useRef(null);

  const [tab, setTab] = useState("dashboard");

  const [patients, setPatients] = useState(() => loadLS(LS.patients, []));
  const [invoices, setInvoices] = useState(() => loadLS(LS.invoices, []));
  const [serviceOrders, setServiceOrders] = useState(() => loadLS(LS.serviceOrders, []));

  const [searchPatient, setSearchPatient] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    idNumber: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    county: "",
    subCounty: "",
    village: "",
    address: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    allergies: "",
    notes: "",
  });

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [department, setDepartment] = useState("Laboratory");
  const [complaint, setComplaint] = useState("");

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paid, setPaid] = useState(0);

  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  useEffect(() => saveLS(LS.patients, patients), [patients]);
  useEffect(() => saveLS(LS.invoices, invoices), [invoices]);
  useEffect(() => saveLS(LS.serviceOrders, serviceOrders), [serviceOrders]);

  const refresh = () => {
    setPatients(loadLS(LS.patients, []));
    setInvoices(loadLS(LS.invoices, []));
    setServiceOrders(loadLS(LS.serviceOrders, []));
  };

  const filteredPatients = useMemo(() => {
    const q = String(searchPatient || "").toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const blob = `${p.id} ${p.fullName} ${p.phone} ${p.idNumber}`.toLowerCase();
      return blob.includes(q);
    });
  }, [patients, searchPatient]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const totals = useMemo(() => {
    const total = cart.reduce((s, it) => s + Number(it.total || 0), 0);
    const paidAmt = Number(paid || 0);
    const balance = Math.max(0, total - paidAmt);
    return { total, paid: paidAmt, balance };
  }, [cart, paid]);

  const unbilledOrdersForPatient = useMemo(() => {
    if (!selectedPatientId) return [];
    return (serviceOrders || []).filter(
      (o) =>
        o &&
        o.status === "unbilled" &&
        String(o.patientId || "") === String(selectedPatientId)
    );
  }, [serviceOrders, selectedPatientId]);

  const clearForm = () => {
    setForm({
      fullName: "",
      phone: "",
      idNumber: "",
      dob: "",
      gender: "",
      bloodGroup: "",
      county: "",
      subCounty: "",
      village: "",
      address: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      allergies: "",
      notes: "",
    });
  };

  const savePatient = (goBilling = false) => {
    if (!form.fullName.trim()) return alert("Full name is required.");
    if (!form.phone.trim()) return alert("Phone is required.");

    const patient = {
      id: uid("PT"),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      idNumber: form.idNumber.trim(),
      dob: form.dob,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      county: form.county,
      subCounty: form.subCounty,
      village: form.village,
      address: form.address,
      nextOfKinName: form.nextOfKinName,
      nextOfKinPhone: form.nextOfKinPhone,
      allergies: form.allergies,
      notes: form.notes,
      createdAt: nowISO(),
      lastVisit: todayISO(),
    };

    setPatients((prev) => [patient, ...prev]);
    alert("Patient saved ✅");

    if (goBilling) {
      setSelectedPatientId(patient.id);
      setTab("billing");
      clearForm();
    } else {
      clearForm();
    }
  };

  const addServiceToCart = (svc, typeLabel) => {
    setCart((prev) => {
      const exist = prev.find((x) => x.code === svc.code);
      if (exist) {
        const nextQty = Number(exist.qty || 1) + 1;
        return prev.map((x) =>
          x.code === svc.code
            ? { ...x, qty: nextQty, total: nextQty * Number(x.unitPrice || 0) }
            : x
        );
      }
      return [
        ...prev,
        {
          type: typeLabel,
          code: svc.code,
          name: svc.name,
          qty: 1,
          unitPrice: svc.price,
          total: Number(svc.price || 0),
        },
      ];
    });
  };

  const addOrderItemsToCart = (order) => {
    if (!order?.items?.length) return;

    setCart((prev) => {
      const next = [...prev];
      for (const it of order.items) {
        const code = `${order.source || "order"}-${String(it.name || "item")
          .slice(0, 12)
          .toUpperCase()}-${Math.random().toString(16).slice(2, 5).toUpperCase()}`;

        next.push({
          type: it.type || "Service",
          code,
          name: it.name,
          qty: Number(it.qty || 1),
          unitPrice: Number(it.unitPrice || 0),
          total: Number(it.total || 0),
          _fromOrderId: order.id,
          _refSaleId: order.refSaleId || "",
        });
      }
      return next;
    });

    alert("Order items added to bill ✅");
  };

  const updateQty = (code, qty) => {
    const q = Math.max(1, Number(qty || 1));
    setCart((prev) =>
      prev.map((x) => (x.code === code ? { ...x, qty: q, total: q * x.unitPrice } : x))
    );
  };

  const removeItem = (code) => 
    setCart((prev) => prev.filter((x) => x.code !== code));

  const clearBill = () => {
    setCart([]);
    setPaymentMethod("cash");
    setPaid(0);
    setComplaint("");
    setDepartment("Laboratory");
  };

  const createInvoice = () => {
    if (!selectedPatient) return alert("Select a patient first.");
    if (cart.length === 0) return alert("Add at least one service.");

    const invoice = {
      id: uid("INV"),
      date: todayISO(),
      createdAt: nowISO(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      department,
      complaint,
      paymentMethod,
      items: cart.map((x) => ({
        type: x.type,
        name: x.name,
        qty: x.qty,
        unitPrice: x.unitPrice,
        total: x.total,
        _fromOrderId: x._fromOrderId || "",
        _refSaleId: x._refSaleId || "",
      })),
      total: totals.total,
      paid: totals.paid,
      balance: totals.balance,
    };

    setInvoices((prev) => [invoice, ...prev]);

    const orderIdsUsed = Array.from(
      new Set(cart.map((x) => x._fromOrderId).filter(Boolean))
    );

    if (orderIdsUsed.length > 0) {
      setServiceOrders((prev) =>
        (prev || []).map((o) =>
          orderIdsUsed.includes(o.id) ? { ...o, status: "billed", billedAt: nowISO() } : o
        )
      );
    }

    setInvoiceToPrint(invoice);
    setTab("print");
    alert("Invoice created ✅ (Ready to print)");
  };

  const printReceipt = () => window.print();

  const Header = () => (
    <div className="hdr">
      <div className="brand">
        <img src={logo} alt="Anka Hospital" className="logo" />
        <div>
          <div className="title">Anka Hospital</div>
          <div className="sub">Reception Desk</div>
        </div>
      </div>

      <div className="hdrRight">
        <div className="welcome">
          <div className="w1">Welcome, Receptionist</div>
          <div className="w2">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <button className="btn" onClick={refresh}>
          Refresh
        </button>
        <button className="btn danger" onClick={() => alert("Logout will be connected later.")}>
          Logout
        </button>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="side">
      <div className="navTitle">Navigation</div>

      <NavItem id="dashboard" label="📊 Dashboard" />
      <NavItem id="register" label="📝 Register Patient" />
      <NavItem id="details" label="👤 Patient Details" />
      <NavItem id="billing" label="💰 Billing & Receipt" />
      <NavItem id="history" label="🧾 Receipts History" />
      <NavItem id="print" label="🖨️ Print" />

      <div className="muted small" style={{ marginTop: 14 }}>
        Currency: <b>KES</b>
      </div>
    </div>
  );

  const NavItem = ({ id, label }) => (
    <div className={"nav " + (tab === id ? "active" : "")} onClick={() => setTab(id)}>
      {label}
    </div>
  );

  const Card = ({ title, right, children }) => (
    <div className="card">
      <div className="cardHead">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );

  const Stat = ({ label, value }) => (
    <div className="stat">
      <div className="muted">{label}</div>
      <div className="statVal">{value}</div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div className="field">
      <div className="label">{label}</div>
      {children}
    </div>
  );

  const Info = ({ label, value }) => (
    <div className="info">
      <div className="muted">{label}</div>
      <div className="infoVal">{String(value ?? "-")}</div>
    </div>
  );

  const Dashboard = () => {
    const patientsCount = patients.length;
    const todayInv = invoices.filter((i) => i.date === todayISO());
    const revenueToday = todayInv.reduce((s, x) => s + Number(x.paid || 0), 0);
    const pendingToday = todayInv.reduce((s, x) => s + Number(x.balance || 0), 0);

    return (
      <div className="main">
        <div className="pageTitle">Dashboard</div>

        <div className="grid">
          <Card title="Today Summary">
            <div className="stats">
              <Stat label="Patients Total" value={patientsCount} />
              <Stat label="Receipts Today" value={todayInv.length} />
              <Stat label="Revenue Today" value={KES(revenueToday)} />
              <Stat label="Pending Today" value={KES(pendingToday)} />
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="row">
              <button className="btn primary" onClick={() => setTab("register")}>
                Register Patient
              </button>
              <button className="btn primary" onClick={() => setTab("billing")}>
                Billing & Receipt
              </button>
              <button className="btn" onClick={() => setTab("history")}>
                Receipts History
              </button>
            </div>

            <div className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
              • Pharmacy orders (OPD/IPD) can appear in billing if saved to <b>anka_service_orders</b>.
              <br />
              • Print receipts with logo from the Print tab.
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const Register = () => (
    <div className="main">
      <div className="pageTitle">Register New Patient</div>

      <Card title="Patient Details">
        <div className="formGrid">
          <Field label="Full Name *">
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Enter patient full name"
              autoFocus
            />
          </Field>

          <Field label="Phone *">
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 07xx xxx xxx"
              inputMode="tel"
            />
          </Field>

          <Field label="ID Number">
            <input
              className="input"
              value={form.idNumber}
              onChange={(e) => setForm((p) => ({ ...p, idNumber: e.target.value }))}
              placeholder="National ID / Passport"
            />
          </Field>

          <Field label="Date of Birth">
            <input
              className="input"
              type="date"
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
            />
          </Field>

          <Field label="Gender">
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Blood Group">
            <select
              className="input"
              value={form.bloodGroup}
              onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </Field>

          <Field label="County">
            <input
              className="input"
              value={form.county}
              onChange={(e) => setForm((p) => ({ ...p, county: e.target.value }))}
              placeholder="e.g. Nairobi"
            />
          </Field>

          <Field label="Sub-County">
            <input
              className="input"
              value={form.subCounty}
              onChange={(e) => setForm((p) => ({ ...p, subCounty: e.target.value }))}
              placeholder="e.g. Westlands"
            />
          </Field>

          <Field label="Village/Estate">
            <input
              className="input"
              value={form.village}
              onChange={(e) => setForm((p) => ({ ...p, village: e.target.value }))}
              placeholder="e.g. Kangemi"
            />
          </Field>

          <Field label="Address">
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Street / landmark"
            />
          </Field>

          <Field label="Next of Kin Name">
            <input
              className="input"
              value={form.nextOfKinName}
              onChange={(e) => setForm((p) => ({ ...p, nextOfKinName: e.target.value }))}
              placeholder="e.g. Mary Wanjiku"
            />
          </Field>

          <Field label="Next of Kin Phone">
            <input
              className="input"
              value={form.nextOfKinPhone}
              onChange={(e) => setForm((p) => ({ ...p, nextOfKinPhone: e.target.value }))}
              placeholder="e.g. 07xx xxx xxx"
            />
          </Field>
        </div>

        <div className="formGrid2">
          <Field label="Allergies">
            <textarea
              className="input"
              value={form.allergies}
              onChange={(e) => setForm((p) => ({ ...p, allergies: e.target.value }))}
              placeholder="Any known allergies"
              rows={3}
            />
          </Field>

          <Field label="Notes">
            <textarea
              className="input"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Extra notes (optional)"
              rows={3}
            />
          </Field>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={() => savePatient(false)}>
            Save Patient
          </button>
          <button className="btn primary" onClick={() => savePatient(true)}>
            Save & Go to Billing
          </button>
          <button className="btn danger" onClick={clearForm}>
            Clear Form
          </button>
        </div>
      </Card>
    </div>
  );

  const Details = () => (
    <div className="main">
      <div className="pageTitle">Patient Details</div>

      <Card
        title="Select Patient"
        right={
          <input
            className="input"
            style={{ width: 320 }}
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            placeholder="Search patient by name / phone / ID"
          />
        }
      >
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Last Visit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.slice(0, 20).map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.fullName}</td>
                  <td>{p.phone}</td>
                  <td>{p.lastVisit || "-"}</td>
                  <td>
                    <button className="btnSmall primary" onClick={() => setSelectedPatientId(p.id)}>
                      View
                    </button>
                    <button className="btnSmall" style={{ marginLeft: 8 }} onClick={() => setTab("billing")}>
                      Bill
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No patients yet. Register first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Patient Info">
        {!selectedPatient ? (
          <div className="empty">Select a patient to view.</div>
        ) : (
          <div className="gridInfo">
            <Info label="Patient ID" value={selectedPatient.id} />
            <Info label="Name" value={selectedPatient.fullName} />
            <Info label="Phone" value={selectedPatient.phone} />
            <Info label="ID Number" value={selectedPatient.idNumber || "-"} />
            <Info label="DOB" value={selectedPatient.dob || "-"} />
            <Info label="Gender" value={selectedPatient.gender || "-"} />
            <Info label="Blood Group" value={selectedPatient.bloodGroup || "-"} />
            <Info label="County" value={selectedPatient.county || "-"} />
            <Info label="Sub-County" value={selectedPatient.subCounty || "-"} />
            <Info label="Village" value={selectedPatient.village || "-"} />
            <Info label="Address" value={selectedPatient.address || "-"} />
            <Info label="Next of Kin" value={selectedPatient.nextOfKinName || "-"} />
            <Info label="Next of Kin Phone" value={selectedPatient.nextOfKinPhone || "-"} />
          </div>
        )}
      </Card>
    </div>
  );

  const Billing = () => (
    <div className="main">
      <div className="pageTitle">Billing & Receipt (KES)</div>

      <Card title="1) Choose Patient">
        <div className="billTop">
          <div>
            <div className="label">Select Patient *</div>
            <select
              className="input"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">-- Select Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="label">Department *</div>
            <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="Laboratory">Laboratory</option>
              <option value="Radiology">Radiology</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ gridColumn: "span 1" }}>
            <div className="label">Patient Complain / Reason</div>
            <input
              className="input"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="e.g headache, fever, checkup"
            />
          </div>
        </div>

        {unbilledOrdersForPatient.length > 0 && (
          <div className="orderBox">
            <div style={{ fontWeight: 900, marginBottom: 8 }}>
              Unbilled Orders from other departments (e.g Pharmacy)
            </div>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unbilledOrdersForPatient.map((o) => (
                    <tr key={o.id}>
                      <td>{o.date || "-"}</td>
                      <td style={{ fontWeight: 900 }}>{String(o.source || "").toUpperCase()}</td>
                      <td>{(o.items || []).length}</td>
                      <td>{KES(o.total)}</td>
                      <td>
                        <button className="btnSmall primary" onClick={() => addOrderItemsToCart(o)}>
                          Add to Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <Card title="2) Service Selection">
        {department === "Radiology" ? (
          <div className="muted" style={{ marginBottom: 10 }}>
            Choose radiology tests (20 available). Prices range from KES 1,000 to KES 7,000.
          </div>
        ) : department === "Laboratory" ? (
          <div className="muted" style={{ marginBottom: 10 }}>
            Choose lab tests. Prices vary.
          </div>
        ) : (
          <div className="muted" style={{ marginBottom: 10 }}>
            For Pharmacy, add unbilled orders above or use “Other” manual items (next feature).
          </div>
        )}

        <div className="svcGrid">
          {(department === "Radiology" ? RADIOLOGY_TESTS : LAB_TESTS).map((svc) => (
            <div key={svc.code} className="svcCard">
              <div className="svcName">{svc.name}</div>
              <div className="svcMeta">
                <span>{svc.code}</span>
                <span style={{ fontWeight: 900 }}>{KES(svc.price)}</span>
              </div>
              <button className="btnSmall primary" onClick={() => addServiceToCart(svc, department)}>
                + Select
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="3) Bill Items & Payment">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item</th>
                <th style={{ width: 120 }}>Qty</th>
                <th>Unit</th>
                <th>Total</th>
                <th style={{ width: 110 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((it) => (
                <tr key={it.code}>
                  <td style={{ fontWeight: 900 }}>{it.type}</td>
                  <td>{it.name}</td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={(e) => updateQty(it.code, e.target.value)}
                      style={{ padding: 8 }}
                    />
                  </td>
                  <td>{KES(it.unitPrice)}</td>
                  <td>{KES(it.total)}</td>
                  <td>
                    <button className="btnSmall danger" onClick={() => removeItem(it.code)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    No items yet. Select tests/services above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payRow">
          <div>
            <div className="label">Payment Method</div>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>

          <div>
            <div className="label">Paid Amount</div>
            <input
              className="input"
              type="number"
              min="0"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="totBox">
            <div className="totLine">
              <span>Total</span>
              <b>{KES(totals.total)}</b>
            </div>
            <div className="totLine">
              <span>Paid</span>
              <b>{KES(totals.paid)}</b>
            </div>
            <div className="totLine">
              <span>Balance</span>
              <b style={{ color: totals.balance > 0 ? "#c62828" : "#2e7d32" }}>{KES(totals.balance)}</b>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn success" onClick={createInvoice}>
            Save Receipt
          </button>
          <button className="btn" onClick={clearBill}>
            Clear Bill
          </button>
        </div>
      </Card>
    </div>
  );

  const History = () => (
    <div className="main">
      <div className="pageTitle">Receipts History</div>

      <Card
        title="Invoices / Receipts"
        right={
          <input
            className="input"
            style={{ width: 320 }}
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            placeholder="Search patient / invoice / phone"
          />
        }
      >
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Dept</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 80).map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{inv.date}</td>
                  <td>
                    {inv.patientName} ({inv.patientId})
                  </td>
                  <td style={{ fontWeight: 900 }}>{inv.department}</td>
                  <td>{KES(inv.total)}</td>
                  <td>{KES(inv.paid)}</td>
                  <td>{KES(inv.balance)}</td>
                  <td>
                    <button
                      className="btnSmall primary"
                      onClick={() => {
                        setInvoiceToPrint(inv);
                        setTab("print");
                      }}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No receipts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const PrintPage = () => (
    <div className="main">
      <div className="pageTitle">Print Receipt</div>

      {!invoiceToPrint ? (
        <Card title="No receipt selected">
          <div className="muted">Create a receipt from Billing or pick one from History.</div>
        </Card>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <button className="btn primary" onClick={() => setTab("history")}>
              Back to History
            </button>
            <button className="btn success" onClick={printReceipt}>
              Print
            </button>
          </div>

          <div ref={printRef} className="print-area paper">
            <div className="pHead">
              <img src={logo} alt="logo" className="pLogo" />
              <div>
                <div className="pTitle">ANKA HOSPITAL</div>
                <div className="muted">Receipt / Bill</div>
              </div>
              <div className="pRight">
                <div>
                  Receipt No: <b>{invoiceToPrint.id}</b>
                </div>
                <div>
                  Date: <b>{invoiceToPrint.date}</b>
                </div>
              </div>
            </div>

            <hr />

            <div className="pInfo">
              <div>
                Patient: <b>{invoiceToPrint.patientName}</b> (<b>{invoiceToPrint.patientId}</b>)
              </div>
              <div>
                Department: <b>{invoiceToPrint.department}</b>
              </div>
              <div>
                Payment: <b>{String(invoiceToPrint.paymentMethod || "").toUpperCase()}</b>
              </div>
              {invoiceToPrint.complaint ? (
                <div>
                  Reason: <b>{invoiceToPrint.complaint}</b>
                </div>
              ) : null}
            </div>

            <hr />

            <table className="pTable">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoiceToPrint.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.name}</td>
                    <td>{it.qty || 1}</td>
                    <td>{KES(it.unitPrice || 0)}</td>
                    <td>{KES(it.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr />

            <div className="pTotals">
              <div className="pLine">
                <span>Total</span>
                <b>{KES(invoiceToPrint.total)}</b>
              </div>
              <div className="pLine">
                <span>Paid</span>
                <b>{KES(invoiceToPrint.paid)}</b>
              </div>
              <div className="pLine">
                <span>Balance</span>
                <b>{KES(invoiceToPrint.balance)}</b>
              </div>
            </div>

            <div className="pThanks">Thank you for choosing Anka Hospital.</div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="page">
      <Header />
      <div className="layout">
        <Sidebar />
        <div className="content">
          {tab === "dashboard" && <Dashboard />}
          {tab === "register" && <Register />}
          {tab === "details" && <Details />}
          {tab === "billing" && <Billing />}
          {tab === "history" && <History />}
          {tab === "print" && <PrintPage />}
        </div>
      </div>
    </div>
  );
}