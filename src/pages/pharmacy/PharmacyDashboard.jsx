import React, { useEffect, useMemo, useState } from "react";
import "./Pharmacy.css";
import logo from "../../assets/logo.png";

const LS = {
  patients: "anka_patients",
  pharmacyStock: "anka_pharmacy_stock",
  pharmacySales: "anka_pharmacy_sales",
};

const loadLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveLS = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const uid = (prefix = "ID") =>
  `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

const nowISO = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().split("T")[0];

const KES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const daysToExpiry = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  const exp = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  const diff = exp.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getWeekKey = (isoDate) => {
  const d = new Date(isoDate);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d - oneJan) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${week}`;
};

const sameMonth = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
};

const sameYear = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear();
};

const defaultMedicines = [
  { name: "Paracetamol 500mg", category: "Tablet", sellingPrice: 10, quantity: 300, expiryDate: "2027-06-15", manufacturer: "Medicare Pharma", batchNo: "PARA-001", reorderLevel: 50, dosage: "1 tablet 3 times daily" },
  { name: "Ibuprofen 400mg", category: "Tablet", sellingPrice: 20, quantity: 250, expiryDate: "2027-04-20", manufacturer: "HealthPlus", batchNo: "IBU-001", reorderLevel: 40, dosage: "1 tablet after meals" },
  { name: "Amoxicillin 500mg", category: "Capsule", sellingPrice: 35, quantity: 180, expiryDate: "2026-11-10", manufacturer: "BioCare", batchNo: "AMOX-001", reorderLevel: 30, dosage: "1 capsule 3 times daily" },
  { name: "Ciprofloxacin 500mg", category: "Tablet", sellingPrice: 45, quantity: 160, expiryDate: "2026-10-28", manufacturer: "City Pharma", batchNo: "CIPRO-001", reorderLevel: 25, dosage: "1 tablet twice daily" },
  { name: "Metronidazole 400mg", category: "Tablet", sellingPrice: 25, quantity: 220, expiryDate: "2026-09-19", manufacturer: "WellLife", batchNo: "METRO-001", reorderLevel: 35, dosage: "1 tablet 3 times daily" },
  { name: "Azithromycin 500mg", category: "Tablet", sellingPrice: 60, quantity: 120, expiryDate: "2026-12-15", manufacturer: "PrimeMed", batchNo: "AZI-001", reorderLevel: 20, dosage: "1 tablet daily" },
  { name: "Diclofenac 50mg", category: "Tablet", sellingPrice: 18, quantity: 260, expiryDate: "2027-01-10", manufacturer: "Care Drugs", batchNo: "DICLO-001", reorderLevel: 40, dosage: "1 tablet twice daily" },
  { name: "Omeprazole 20mg", category: "Capsule", sellingPrice: 22, quantity: 210, expiryDate: "2027-03-17", manufacturer: "GastroMed", batchNo: "OME-001", reorderLevel: 35, dosage: "1 capsule before breakfast" },
  { name: "Cetirizine 10mg", category: "Tablet", sellingPrice: 15, quantity: 240, expiryDate: "2027-05-08", manufacturer: "AllerFree", batchNo: "CET-001", reorderLevel: 30, dosage: "1 tablet daily" },
  { name: "Loratadine 10mg", category: "Tablet", sellingPrice: 18, quantity: 180, expiryDate: "2027-02-11", manufacturer: "AllerFree", batchNo: "LORA-001", reorderLevel: 30, dosage: "1 tablet daily" },

  { name: "Salbutamol Inhaler", category: "Inhaler", sellingPrice: 250, quantity: 80, expiryDate: "2026-08-21", manufacturer: "RespiraMed", batchNo: "SALB-001", reorderLevel: 10, dosage: "2 puffs when needed" },
  { name: "Ventolin Syrup", category: "Syrup", sellingPrice: 120, quantity: 75, expiryDate: "2026-07-12", manufacturer: "RespiraMed", batchNo: "VENT-001", reorderLevel: 12, dosage: "As prescribed" },
  { name: "Benylin Cough Syrup", category: "Syrup", sellingPrice: 150, quantity: 60, expiryDate: "2026-11-29", manufacturer: "ColdRelief", batchNo: "BENY-001", reorderLevel: 10, dosage: "10ml 3 times daily" },
  { name: "Ascof Syrup", category: "Syrup", sellingPrice: 110, quantity: 65, expiryDate: "2026-12-01", manufacturer: "ColdRelief", batchNo: "ASCOF-001", reorderLevel: 12, dosage: "10ml 3 times daily" },
  { name: "Zinc Sulphate", category: "Tablet", sellingPrice: 30, quantity: 140, expiryDate: "2027-01-26", manufacturer: "NutriMed", batchNo: "ZINC-001", reorderLevel: 20, dosage: "1 tablet daily" },
  { name: "Vitamin C 500mg", category: "Tablet", sellingPrice: 25, quantity: 200, expiryDate: "2027-06-30", manufacturer: "NutriMed", batchNo: "VITC-001", reorderLevel: 25, dosage: "1 tablet daily" },
  { name: "Multivitamin Syrup", category: "Syrup", sellingPrice: 130, quantity: 70, expiryDate: "2026-10-09", manufacturer: "NutriMed", batchNo: "MULTI-001", reorderLevel: 10, dosage: "5ml daily" },
  { name: "ORS Sachets", category: "Oral Rehydration", sellingPrice: 20, quantity: 300, expiryDate: "2027-04-01", manufacturer: "HydraCare", batchNo: "ORS-001", reorderLevel: 50, dosage: "As directed" },
  { name: "Folic Acid", category: "Tablet", sellingPrice: 15, quantity: 250, expiryDate: "2027-05-14", manufacturer: "MumCare", batchNo: "FOLIC-001", reorderLevel: 30, dosage: "1 tablet daily" },
  { name: "Ferrous Sulphate", category: "Tablet", sellingPrice: 18, quantity: 220, expiryDate: "2026-09-25", manufacturer: "MumCare", batchNo: "FERRO-001", reorderLevel: 30, dosage: "1 tablet daily" },

  { name: "Coartem", category: "Tablet", sellingPrice: 180, quantity: 100, expiryDate: "2026-08-14", manufacturer: "MalariaCare", batchNo: "COAR-001", reorderLevel: 15, dosage: "As prescribed" },
  { name: "Fansidar", category: "Tablet", sellingPrice: 60, quantity: 110, expiryDate: "2027-02-19", manufacturer: "MalariaCare", batchNo: "FANS-001", reorderLevel: 15, dosage: "As prescribed" },
  { name: "Artemether Injection", category: "Injection", sellingPrice: 320, quantity: 40, expiryDate: "2026-07-18", manufacturer: "MalariaCare", batchNo: "ART-001", reorderLevel: 8, dosage: "As prescribed" },
  { name: "Ceftriaxone 1g", category: "Injection", sellingPrice: 180, quantity: 90, expiryDate: "2026-11-07", manufacturer: "BioCare", batchNo: "CEF-001", reorderLevel: 15, dosage: "As prescribed" },
  { name: "Gentamicin Injection", category: "Injection", sellingPrice: 70, quantity: 95, expiryDate: "2027-03-12", manufacturer: "BioCare", batchNo: "GEN-001", reorderLevel: 12, dosage: "As prescribed" },
  { name: "Dexamethasone Injection", category: "Injection", sellingPrice: 60, quantity: 100, expiryDate: "2027-01-15", manufacturer: "Care Drugs", batchNo: "DEX-001", reorderLevel: 12, dosage: "As prescribed" },
  { name: "Hydrocortisone Injection", category: "Injection", sellingPrice: 90, quantity: 85, expiryDate: "2026-10-06", manufacturer: "Care Drugs", batchNo: "HYDRO-001", reorderLevel: 10, dosage: "As prescribed" },
  { name: "Normal Saline 500ml", category: "IV Fluid", sellingPrice: 120, quantity: 100, expiryDate: "2026-12-24", manufacturer: "FluidMed", batchNo: "NS-001", reorderLevel: 20, dosage: "As prescribed" },
  { name: "Dextrose 5% 500ml", category: "IV Fluid", sellingPrice: 140, quantity: 95, expiryDate: "2027-01-09", manufacturer: "FluidMed", batchNo: "DEX5-001", reorderLevel: 18, dosage: "As prescribed" },
  { name: "Ringer Lactate 500ml", category: "IV Fluid", sellingPrice: 130, quantity: 88, expiryDate: "2026-09-11", manufacturer: "FluidMed", batchNo: "RL-001", reorderLevel: 18, dosage: "As prescribed" },

  { name: "Aspirin 75mg", category: "Tablet", sellingPrice: 12, quantity: 260, expiryDate: "2027-06-01", manufacturer: "HeartCare", batchNo: "ASP-001", reorderLevel: 35, dosage: "1 tablet daily" },
  { name: "Amlodipine 5mg", category: "Tablet", sellingPrice: 20, quantity: 210, expiryDate: "2027-02-27", manufacturer: "HeartCare", batchNo: "AMLO-001", reorderLevel: 30, dosage: "1 tablet daily" },
  { name: "Losartan 50mg", category: "Tablet", sellingPrice: 35, quantity: 170, expiryDate: "2026-08-30", manufacturer: "HeartCare", batchNo: "LOS-001", reorderLevel: 25, dosage: "1 tablet daily" },
  { name: "Metformin 500mg", category: "Tablet", sellingPrice: 25, quantity: 190, expiryDate: "2026-12-18", manufacturer: "DiaCare", batchNo: "METF-001", reorderLevel: 30, dosage: "1 tablet twice daily" },
  { name: "Glibenclamide 5mg", category: "Tablet", sellingPrice: 18, quantity: 160, expiryDate: "2027-04-07", manufacturer: "DiaCare", batchNo: "GLIB-001", reorderLevel: 20, dosage: "1 tablet daily" },
  { name: "Insulin 10ml", category: "Injection", sellingPrice: 500, quantity: 35, expiryDate: "2026-07-25", manufacturer: "DiaCare", batchNo: "INS-001", reorderLevel: 8, dosage: "As prescribed" },
  { name: "Captopril 25mg", category: "Tablet", sellingPrice: 15, quantity: 180, expiryDate: "2027-01-02", manufacturer: "HeartCare", batchNo: "CAP-001", reorderLevel: 25, dosage: "As prescribed" },
  { name: "Furosemide 40mg", category: "Tablet", sellingPrice: 20, quantity: 170, expiryDate: "2026-10-16", manufacturer: "HeartCare", batchNo: "FURO-001", reorderLevel: 25, dosage: "As prescribed" },
  { name: "Spironolactone 25mg", category: "Tablet", sellingPrice: 22, quantity: 150, expiryDate: "2027-03-22", manufacturer: "HeartCare", batchNo: "SPIRO-001", reorderLevel: 20, dosage: "As prescribed" },
  { name: "Atorvastatin 20mg", category: "Tablet", sellingPrice: 40, quantity: 140, expiryDate: "2027-05-19", manufacturer: "HeartCare", batchNo: "ATOR-001", reorderLevel: 20, dosage: "1 tablet at night" },

  { name: "Clotrimazole Cream", category: "Cream", sellingPrice: 90, quantity: 70, expiryDate: "2026-08-12", manufacturer: "SkinCare", batchNo: "CLOT-001", reorderLevel: 10, dosage: "Apply twice daily" },
  { name: "Miconazole Cream", category: "Cream", sellingPrice: 95, quantity: 65, expiryDate: "2026-10-14", manufacturer: "SkinCare", batchNo: "MICO-001", reorderLevel: 10, dosage: "Apply twice daily" },
  { name: "Hydrocortisone Cream", category: "Cream", sellingPrice: 110, quantity: 60, expiryDate: "2027-02-08", manufacturer: "SkinCare", batchNo: "HC-001", reorderLevel: 10, dosage: "Apply as directed" },
  { name: "Piriton Syrup", category: "Syrup", sellingPrice: 80, quantity: 75, expiryDate: "2026-09-03", manufacturer: "AllerFree", batchNo: "PIR-001", reorderLevel: 12, dosage: "5ml 3 times daily" },
  { name: "Piriton Tablets", category: "Tablet", sellingPrice: 12, quantity: 180, expiryDate: "2027-04-16", manufacturer: "AllerFree", batchNo: "PIRT-001", reorderLevel: 20, dosage: "As directed" },
  { name: "Eye Drops Chloramphenicol", category: "Drops", sellingPrice: 120, quantity: 50, expiryDate: "2026-08-05", manufacturer: "EyeMed", batchNo: "EYE-001", reorderLevel: 8, dosage: "As prescribed" },
  { name: "Ear Drops", category: "Drops", sellingPrice: 100, quantity: 55, expiryDate: "2026-11-26", manufacturer: "ENTCare", batchNo: "EAR-001", reorderLevel: 8, dosage: "As prescribed" },
  { name: "Nasal Drops", category: "Drops", sellingPrice: 95, quantity: 58, expiryDate: "2027-01-13", manufacturer: "ENTCare", batchNo: "NASAL-001", reorderLevel: 8, dosage: "As prescribed" },
  { name: "ORS Zinc Combo", category: "Combo", sellingPrice: 45, quantity: 120, expiryDate: "2027-03-28", manufacturer: "HydraCare", batchNo: "ORSZ-001", reorderLevel: 20, dosage: "As directed" },
  { name: "Albendazole 400mg", category: "Tablet", sellingPrice: 30, quantity: 140, expiryDate: "2026-12-09", manufacturer: "WormCare", batchNo: "ALB-001", reorderLevel: 20, dosage: "Single dose" },
];

function PharmacyDashboard() {
  const [tab, setTab] = useState("dashboard");

  const [patients, setPatients] = useState(() => loadLS(LS.patients, []));
  const [stock, setStock] = useState(() => {
    const existing = loadLS(LS.pharmacyStock, []);
    if (existing.length > 0) return existing;
    const seeded = defaultMedicines.map((m) => ({
      id: uid("MED"),
      ...m,
      costPrice: Math.max(5, m.sellingPrice - 5),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }));
    saveLS(LS.pharmacyStock, seeded);
    return seeded;
  });

  const [sales, setSales] = useState(() => loadLS(LS.pharmacySales, []));

  const [searchStock, setSearchStock] = useState("");
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [saleType, setSaleType] = useState("OTC"); // OTC | OUTPATIENT | INPATIENT
  const [cart, setCart] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "",
    manufacturer: "",
    batchNo: "",
    dosage: "",
    costPrice: "",
    sellingPrice: "",
    quantity: "",
    reorderLevel: "",
    expiryDate: "",
  });

  useEffect(() => saveLS(LS.pharmacyStock, stock), [stock]);
  useEffect(() => saveLS(LS.pharmacySales, sales), [sales]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(loadLS(LS.patients, []));
      setSales(loadLS(LS.pharmacySales, []));
      setStock(loadLS(LS.pharmacyStock, []));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const filteredStock = useMemo(() => {
    const q = String(searchStock || "").toLowerCase().trim();
    if (!q) return stock;
    return stock.filter((m) => {
      const blob = `${m.name} ${m.category} ${m.manufacturer} ${m.batchNo}`.toLowerCase();
      return blob.includes(q);
    });
  }, [stock, searchStock]);

  const filteredPatients = useMemo(() => {
    const q = String(searchPatient || "").toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const blob = `${p.id || ""} ${p.fullName || ""} ${p.phone || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [patients, searchPatient]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const lowStockItems = useMemo(() => {
    return stock.filter((m) => Number(m.quantity || 0) <= Number(m.reorderLevel || 0));
  }, [stock]);

  const nearExpiryItems = useMemo(() => {
    return stock.filter((m) => {
      const days = daysToExpiry(m.expiryDate);
      return days !== null && days >= 0 && days <= 60;
    });
  }, [stock]);

  const expiredItems = useMemo(() => {
    return stock.filter((m) => {
      const days = daysToExpiry(m.expiryDate);
      return days !== null && days < 0;
    });
  }, [stock]);

  const cartTotals = useMemo(() => {
    const total = cart.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const paid = Number(paidAmount || 0);
    const balance = Math.max(0, total - paid);
    return { total, paid, balance };
  }, [cart, paidAmount]);

  const salesToday = useMemo(() => {
    return sales.filter((s) => s.date === todayISO());
  }, [sales]);

  const dailyRevenue = salesToday.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const currentWeekKey = getWeekKey(new Date().toISOString());
  const weeklySales = sales.filter((s) => getWeekKey(s.createdAt || s.date) === currentWeekKey);
  const weeklyRevenue = weeklySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const monthlySales = sales.filter((s) => sameMonth(s.createdAt || s.date, new Date().toISOString()));
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const yearlySales = sales.filter((s) => sameYear(s.createdAt || s.date, new Date().toISOString()));
  const yearlyRevenue = yearlySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const otcSales = sales.filter((s) => s.saleType === "OTC");
  const outpatientSales = sales.filter((s) => s.saleType === "OUTPATIENT");
  const inpatientSales = sales.filter((s) => s.saleType === "INPATIENT");

  const otcRevenue = otcSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const outpatientRevenue = outpatientSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const inpatientRevenue = inpatientSales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const addToCart = (medicine) => {
    if (Number(medicine.quantity || 0) <= 0) {
      alert("This medicine is out of stock.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === medicine.id);
      if (existing) {
        if (existing.qty >= medicine.quantity) {
          alert("Cannot exceed available stock.");
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === medicine.id
            ? {
                ...item,
                qty: item.qty + 1,
                total: (item.qty + 1) * item.unitPrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          cartId: uid("CRT"),
          medicineId: medicine.id,
          name: medicine.name,
          category: medicine.category,
          qty: 1,
          unitPrice: Number(medicine.sellingPrice || 0),
          total: Number(medicine.sellingPrice || 0),
        },
      ];
    });
  };

  const updateCartQty = (medicineId, qty) => {
    const q = Math.max(1, Number(qty || 1));
    const med = stock.find((m) => m.id === medicineId);
    if (!med) return;

    if (q > Number(med.quantity || 0)) {
      alert("Entered quantity is above available stock.");
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              qty: q,
              total: q * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeCartItem = (medicineId) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  const clearSale = () => {
    setCart([]);
    setPaidAmount(0);
    setPaymentMethod("cash");
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setSelectedPatientId("");
    setSaleType("OTC");
  };

  const saveSale = () => {
    if (cart.length === 0) {
      alert("Add at least one medicine to cart.");
      return;
    }

    if ((saleType === "OUTPATIENT" || saleType === "INPATIENT") && !selectedPatient) {
      alert("Select a patient for outpatient or inpatient sale.");
      return;
    }

    if (saleType === "OTC" && !customerName.trim()) {
      alert("Enter OTC customer name.");
      return;
    }

    const sale = {
      id: uid("SAL"),
      date: todayISO(),
      createdAt: nowISO(),
      saleType,
      patientId: selectedPatient?.id || "",
      patientName: selectedPatient?.fullName || "",
      customerName: saleType === "OTC" ? customerName.trim() : selectedPatient?.fullName || "",
      customerPhone: saleType === "OTC" ? customerPhone.trim() : selectedPatient?.phone || "",
      paymentMethod,
      notes,
      items: cart,
      total: cartTotals.total,
      paid: cartTotals.paid,
      balance: cartTotals.balance,
    };

    setSales((prev) => [sale, ...prev]);

    setStock((prev) =>
      prev.map((med) => {
        const sold = cart.find((item) => item.medicineId === med.id);
        if (!sold) return med;
        return {
          ...med,
          quantity: Math.max(0, Number(med.quantity || 0) - Number(sold.qty || 0)),
          updatedAt: nowISO(),
        };
      })
    );

    alert("Pharmacy sale saved ✅");
    clearSale();
  };

  const handleNewMedicineChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addNewMedicine = () => {
    if (!newMedicine.name.trim()) return alert("Medicine name is required.");
    if (!newMedicine.expiryDate) return alert("Expiry date is required.");
    if (!newMedicine.quantity) return alert("Quantity is required.");
    if (!newMedicine.sellingPrice) return alert("Selling price is required.");

    const medicine = {
      id: uid("MED"),
      name: newMedicine.name.trim(),
      category: newMedicine.category.trim() || "General",
      manufacturer: newMedicine.manufacturer.trim() || "-",
      batchNo: newMedicine.batchNo.trim() || uid("BATCH"),
      dosage: newMedicine.dosage.trim() || "-",
      costPrice: Number(newMedicine.costPrice || 0),
      sellingPrice: Number(newMedicine.sellingPrice || 0),
      quantity: Number(newMedicine.quantity || 0),
      reorderLevel: Number(newMedicine.reorderLevel || 10),
      expiryDate: newMedicine.expiryDate,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    setStock((prev) => [medicine, ...prev]);

    setNewMedicine({
      name: "",
      category: "",
      manufacturer: "",
      batchNo: "",
      dosage: "",
      costPrice: "",
      sellingPrice: "",
      quantity: "",
      reorderLevel: "",
      expiryDate: "",
    });

    alert("New medicine added to stock ✅");
  };

  const addStockToMedicine = (medicineId) => {
    const amount = prompt("Enter quantity to add:");
    if (!amount) return;
    const qty = Number(amount);
    if (qty <= 0) return alert("Invalid quantity.");

    setStock((prev) =>
      prev.map((med) =>
        med.id === medicineId
          ? {
              ...med,
              quantity: Number(med.quantity || 0) + qty,
              updatedAt: nowISO(),
            }
          : med
      )
    );

    alert("Stock updated ✅");
  };

  const Header = () => (
    <div className="ph-header">
      <div className="ph-brand">
        <img src={logo} alt="Anka Hospital" className="ph-logo" />
        <div>
          <div className="ph-title">Anka Hospital</div>
          <div className="ph-sub">Pharmacy Desk</div>
        </div>
      </div>

      <div className="ph-header-right">
        <div className="ph-welcome">
          <div className="ph-welcome-title">Welcome, Pharmacist</div>
          <div className="ph-welcome-date">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <button className="ph-btn">Refresh</button>
        <button className="ph-btn danger">Logout</button>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="ph-sidebar">
      <div className="ph-nav-title">Navigation</div>
      <div className={`ph-nav-item ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
        📊 Dashboard
      </div>
      <div className={`ph-nav-item ${tab === "sales" ? "active" : ""}`} onClick={() => setTab("sales")}>
        💊 Sell Medicines
      </div>
      <div className={`ph-nav-item ${tab === "stock" ? "active" : ""}`} onClick={() => setTab("stock")}>
        📦 Stock Management
      </div>
      <div className={`ph-nav-item ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
        🧾 Sales History
      </div>
      <div className={`ph-nav-item ${tab === "alerts" ? "active" : ""}`} onClick={() => setTab("alerts")}>
        ⏰ Expiry & Alerts
      </div>

      <div className="ph-side-note">
        <p>
          This module handles OTC sales, outpatient and inpatient medication billing,
          stock records, and expiry monitoring.
        </p>
      </div>
    </div>
  );

  const Panel = ({ title, right, children }) => (
    <div className="ph-panel">
      <div className="ph-panel-head">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div className="ph-field">
      <label className="ph-label">{label}</label>
      {children}
    </div>
  );

  const SummaryCard = ({ label, value }) => (
    <div className="ph-summary-card">
      <div className="ph-summary-label">{label}</div>
      <div className="ph-summary-value">{value}</div>
    </div>
  );

  const renderDashboard = () => (
    <div className="ph-main">
      <div className="ph-page-title">Pharmacy Dashboard</div>

      <div className="ph-summary-grid">
        <SummaryCard label="Medicines in Stock" value={stock.length} />
        <SummaryCard label="Daily Revenue" value={KES(dailyRevenue)} />
        <SummaryCard label="Weekly Revenue" value={KES(weeklyRevenue)} />
        <SummaryCard label="Monthly Revenue" value={KES(monthlyRevenue)} />
        <SummaryCard label="Yearly Revenue" value={KES(yearlyRevenue)} />
        <SummaryCard label="OTC Revenue" value={KES(otcRevenue)} />
        <SummaryCard label="Outpatient Revenue" value={KES(outpatientRevenue)} />
        <SummaryCard label="Inpatient Revenue" value={KES(inpatientRevenue)} />
        <SummaryCard label="Low Stock Items" value={lowStockItems.length} />
        <SummaryCard label="Near Expiry" value={nearExpiryItems.length} />
      </div>

      <div className="ph-two-grid">
        <Panel title="Sales Categories">
          <div className="sales-mix-grid">
            <div className="sales-box otc">
              <h4>Over the Counter</h4>
              <p>Sales: {otcSales.length}</p>
              <p>Revenue: {KES(otcRevenue)}</p>
            </div>
            <div className="sales-box out">
              <h4>Outpatient</h4>
              <p>Sales: {outpatientSales.length}</p>
              <p>Revenue: {KES(outpatientRevenue)}</p>
            </div>
            <div className="sales-box in">
              <h4>Inpatient</h4>
              <p>Sales: {inpatientSales.length}</p>
              <p>Revenue: {KES(inpatientRevenue)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Ideas to improve Pharmacy Module">
          <ul className="ideas-list">
            <li>Add barcode or batch scanning for faster dispensing.</li>
            <li>Add supplier management and purchase orders.</li>
            <li>Add stock movement report for each medicine.</li>
            <li>Add expiry color coding and lock expired medicine from sale.</li>
            <li>Add profit margin and cost analysis per medicine.</li>
            <li>Add patient prescription integration from doctor dashboard.</li>
            <li>Add printable pharmacy receipt and stock report.</li>
            <li>Add stock audit adjustments and wastage tracking.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="ph-main">
      <div className="ph-page-title">Sell Medicines</div>

      <Panel title="Sale Type & Customer">
        <div className="ph-form-grid">
          <Field label="Sale Type">
            <select className="ph-input" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
              <option value="OTC">OTC</option>
              <option value="OUTPATIENT">Outpatient</option>
              <option value="INPATIENT">Inpatient</option>
            </select>
          </Field>

          {saleType === "OTC" ? (
            <>
              <Field label="Customer Name">
                <input
                  className="ph-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter OTC customer name"
                />
              </Field>

              <Field label="Customer Phone">
                <input
                  className="ph-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Search Reception Patient">
                <input
                  className="ph-input"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Search by name / phone / ID"
                />
              </Field>

              <Field label="Select Patient">
                <select
                  className="ph-input"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- Select Patient --</option>
                  {filteredPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientType || "Outpatient"}) - {p.id}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Payment Method">
            <select className="ph-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="mpesa">Mpesa</option>
              <option value="card">Card</option>
              <option value="insurance">Insurance</option>
            </select>
          </Field>
        </div>

        {selectedPatient && saleType !== "OTC" && (
          <div className="selected-patient-banner">
            <strong>{selectedPatient.fullName}</strong> | {selectedPatient.phone || "-"} |{" "}
            {selectedPatient.patientType || "Outpatient"} | Patient ID: {selectedPatient.id}
          </div>
        )}
      </Panel>

      <Panel
        title="Available Medicines"
        right={
          <input
            className="ph-input stock-search"
            value={searchStock}
            onChange={(e) => setSearchStock(e.target.value)}
            placeholder="Search medicine"
          />
        }
      >
        <div className="medicine-grid">
          {filteredStock.map((med) => {
            const days = daysToExpiry(med.expiryDate);
            return (
              <div key={med.id} className="medicine-card">
                <div className="medicine-name">{med.name}</div>
                <div className="medicine-meta">{med.category}</div>
                <div className="medicine-meta">Price: <b>{KES(med.sellingPrice)}</b></div>
                <div className="medicine-meta">Stock: <b>{med.quantity}</b></div>
                <div className={`medicine-meta ${days !== null && days <= 60 ? "warn-text" : ""}`}>
                  Expiry: <b>{med.expiryDate}</b>
                </div>
                <button className="small-btn primary" onClick={() => addToCart(med)}>
                  + Add
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Cart & Billing">
        <div className="table-wrap">
          <table className="ph-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.cartId}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>
                    <input
                      className="ph-input qty-input"
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateCartQty(item.medicineId, e.target.value)}
                    />
                  </td>
                  <td>{KES(item.unitPrice)}</td>
                  <td>{KES(item.total)}</td>
                  <td>
                    <button className="small-btn danger" onClick={() => removeCartItem(item.medicineId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted-cell">
                    No medicines added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ph-billing-grid">
          <Field label="Notes">
            <textarea
              className="ph-input"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prescription notes, remarks, counseling info..."
            />
          </Field>

          <Field label="Paid Amount">
            <input
              className="ph-input"
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0"
            />
          </Field>

          <div className="totals-box">
            <div className="tot-line">
              <span>Total</span>
              <b>{KES(cartTotals.total)}</b>
            </div>
            <div className="tot-line">
              <span>Paid</span>
              <b>{KES(cartTotals.paid)}</b>
            </div>
            <div className="tot-line">
              <span>Balance</span>
              <b className={cartTotals.balance > 0 ? "danger-text" : "success-text"}>
                {KES(cartTotals.balance)}
              </b>
            </div>
          </div>
        </div>

        <div className="action-row">
          <button className="ph-btn success" onClick={saveSale}>
            Save Sale
          </button>
          <button className="ph-btn" onClick={clearSale}>
            Clear
          </button>
        </div>
      </Panel>
    </div>
  );

  const renderStock = () => (
    <div className="ph-main">
      <div className="ph-page-title">Stock Management</div>

      <Panel title="Add New Medicine">
        <div className="ph-form-grid">
          <Field label="Medicine Name">
            <input className="ph-input" name="name" value={newMedicine.name} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Category">
            <input className="ph-input" name="category" value={newMedicine.category} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Manufacturer">
            <input className="ph-input" name="manufacturer" value={newMedicine.manufacturer} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Batch No">
            <input className="ph-input" name="batchNo" value={newMedicine.batchNo} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Dosage / Usage">
            <input className="ph-input" name="dosage" value={newMedicine.dosage} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Cost Price">
            <input className="ph-input" type="number" name="costPrice" value={newMedicine.costPrice} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Selling Price">
            <input className="ph-input" type="number" name="sellingPrice" value={newMedicine.sellingPrice} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Quantity Stocked">
            <input className="ph-input" type="number" name="quantity" value={newMedicine.quantity} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Reorder Level">
            <input className="ph-input" type="number" name="reorderLevel" value={newMedicine.reorderLevel} onChange={handleNewMedicineChange} />
          </Field>
          <Field label="Expiry Date">
            <input className="ph-input" type="date" name="expiryDate" value={newMedicine.expiryDate} onChange={handleNewMedicineChange} />
          </Field>
        </div>

        <div className="action-row">
          <button className="ph-btn primary" onClick={addNewMedicine}>
            Add Medicine
          </button>
        </div>
      </Panel>

      <Panel
        title="Current Stock"
        right={
          <input
            className="ph-input stock-search"
            value={searchStock}
            onChange={(e) => setSearchStock(e.target.value)}
            placeholder="Search stock"
          />
        }
      >
        <div className="table-wrap">
          <table className="ph-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Batch</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Reorder</th>
                <th>Expiry</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((med) => {
                const d = daysToExpiry(med.expiryDate);
                return (
                  <tr key={med.id}>
                    <td>{med.name}</td>
                    <td>{med.category}</td>
                    <td>{med.batchNo}</td>
                    <td>{KES(med.sellingPrice)}</td>
                    <td>{med.quantity}</td>
                    <td>{med.reorderLevel}</td>
                    <td className={d !== null && d <= 60 ? "warn-text" : ""}>
                      {med.expiryDate}
                    </td>
                    <td>
                      <button className="small-btn primary" onClick={() => addStockToMedicine(med.id)}>
                        Add Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderHistory = () => (
    <div className="ph-main">
      <div className="ph-page-title">Pharmacy Sales History</div>

      <Panel title="Daily / Weekly / Monthly / Yearly Summary">
        <div className="ph-summary-grid">
          <SummaryCard label="Daily Sales" value={`${salesToday.length}`} />
          <SummaryCard label="Daily Revenue" value={KES(dailyRevenue)} />
          <SummaryCard label="Weekly Sales" value={`${weeklySales.length}`} />
          <SummaryCard label="Weekly Revenue" value={KES(weeklyRevenue)} />
          <SummaryCard label="Monthly Sales" value={`${monthlySales.length}`} />
          <SummaryCard label="Monthly Revenue" value={KES(monthlyRevenue)} />
          <SummaryCard label="Yearly Sales" value={`${yearlySales.length}`} />
          <SummaryCard label="Yearly Revenue" value={KES(yearlyRevenue)} />
        </div>
      </Panel>

      <Panel title="Sales Records">
        <div className="table-wrap">
          <table className="ph-table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Customer / Patient</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>{sale.date}</td>
                  <td>{sale.saleType}</td>
                  <td>{sale.customerName || sale.patientName || "-"}</td>
                  <td>{sale.paymentMethod}</td>
                  <td>{KES(sale.total)}</td>
                  <td>{KES(sale.paid)}</td>
                  <td>{KES(sale.balance)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan="8" className="muted-cell">
                    No pharmacy sales yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderAlerts = () => (
    <div className="ph-main">
      <div className="ph-page-title">Expiry & Stock Alerts</div>

      <div className="ph-two-grid">
        <Panel title="Near Expiry Medicines (within 60 days)">
          <div className="table-wrap">
            <table className="ph-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {nearExpiryItems.map((med) => (
                  <tr key={med.id}>
                    <td>{med.name}</td>
                    <td>{med.expiryDate}</td>
                    <td className="warn-text">{daysToExpiry(med.expiryDate)}</td>
                  </tr>
                ))}
                {nearExpiryItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="muted-cell">
                      No near expiry items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Low Stock Medicines">
          <div className="table-wrap">
            <table className="ph-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Available Qty</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((med) => (
                  <tr key={med.id}>
                    <td>{med.name}</td>
                    <td className="warn-text">{med.quantity}</td>
                    <td>{med.reorderLevel}</td>
                  </tr>
                ))}
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="muted-cell">
                      No low stock items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Expired Medicines">
        <div className="table-wrap">
          <table className="ph-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expiredItems.map((med) => (
                <tr key={med.id}>
                  <td>{med.name}</td>
                  <td>{med.expiryDate}</td>
                  <td className="danger-text">Expired</td>
                </tr>
              ))}
              {expiredItems.length === 0 && (
                <tr>
                  <td colSpan="3" className="muted-cell">
                    No expired medicines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  return (
    <div className="ph-page">
      <Header />

      <div className="ph-layout">
        <Sidebar />

        <div className="ph-content">
          {tab === "dashboard" && renderDashboard()}
          {tab === "sales" && renderSales()}
          {tab === "stock" && renderStock()}
          {tab === "history" && renderHistory()}
          {tab === "alerts" && renderAlerts()}
        </div>
      </div>
    </div>
  );
}

export default PharmacyDashboard;