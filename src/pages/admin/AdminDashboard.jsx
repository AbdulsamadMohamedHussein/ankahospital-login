import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";
import logo from "../../assets/logo.png";

/* =========================
   STORAGE KEYS
========================= */
const LS = {
  patients: "anka_patients",
  invoices: "anka_invoices",
  pharmacySales: "anka_pharmacy_sales",
  pharmacyStock: "anka_pharmacy_stock",
  salaries: "anka_salaries",
  expenses: "anka_expenses",
  doctorReports: "anka_doctor_notes",
  nurseReports: "anka_nurse_notes",
  labReports: "anka_lab_results",
  radiologyReports: "anka_radiology_reports",
  ultrasoundReports: "anka_ultrasound_results",
};

/* =========================
   HELPERS
========================= */
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

const uid = (prefix = "ADM") =>
  `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

const KES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const sameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  return String(dateA).slice(0, 10) === String(dateB).slice(0, 10);
};

const sameMonth = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

const sameYear = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear();
};

const weekNumber = (dateStr) => {
  const d = new Date(dateStr);
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((((d - firstJan) / dayMs) + firstJan.getDay() + 1) / 7);
};

const sameWeek = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() && weekNumber(dateA) === weekNumber(dateB);
};

const csvEscape = (value) => {
  const cell = value == null ? "" : String(value);
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
};

const exportCSV = (filename, rows) => {
  if (!rows.length) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const countByMonth = (items, amountGetter) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result = monthNames.map((name, index) => ({
    label: name,
    value: 0,
    monthIndex: index,
  }));

  items.forEach((item) => {
    const rawDate = item.date || item.createdAt || item.updatedAt;
    if (!rawDate) return;
    const d = new Date(rawDate);
    const month = d.getMonth();
    result[month].value += Number(amountGetter(item) || 0);
  });

  return result;
};

/* =========================
   SMALL UI COMPONENTS
========================= */
function SummaryCard({ label, value, tone = "default" }) {
  return (
    <div className={`summary-card ${tone}`}>
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="admin-panel">
      <div className="panel-head">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field-box">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-box">{text}</div>;
}

function SimpleBarChart({ title, data, formatValue = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <div className="chart-body">
        {data.map((item) => (
          <div key={item.label} className="bar-row">
            <div className="bar-label">{item.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(item.value / max) * 100}%` }}
                title={`${item.label}: ${formatValue(item.value)}`}
              />
            </div>
            <div className="bar-value">{formatValue(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [roleView, setRoleView] = useState("admin");

  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pharmacySales, setPharmacySales] = useState([]);
  const [pharmacyStock, setPharmacyStock] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [doctorReports, setDoctorReports] = useState([]);
  const [nurseReports, setNurseReports] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [radiologyReports, setRadiologyReports] = useState([]);
  const [ultrasoundReports, setUltrasoundReports] = useState([]);

  const [patientSearch, setPatientSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");

  const [salaryForm, setSalaryForm] = useState({
    staffName: "",
    role: "",
    amount: "",
    date: todayISO(),
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    expenseName: "",
    category: "",
    amount: "",
    date: todayISO(),
    notes: "",
  });

  /* =========================
     LOAD / LIVE SYNC
  ========================= */
  const syncAll = () => {
    setPatients(loadLS(LS.patients, []));
    setInvoices(loadLS(LS.invoices, []));
    setPharmacySales(loadLS(LS.pharmacySales, []));
    setPharmacyStock(loadLS(LS.pharmacyStock, []));
    setSalaries(loadLS(LS.salaries, []));
    setExpenses(loadLS(LS.expenses, []));
    setDoctorReports(loadLS(LS.doctorReports, []));
    setNurseReports(loadLS(LS.nurseReports, []));
    setLabReports(loadLS(LS.labReports, []));
    setRadiologyReports(loadLS(LS.radiologyReports, []));
    setUltrasoundReports(loadLS(LS.ultrasoundReports, []));
  };

  useEffect(() => {
    syncAll();

    const onStorage = () => syncAll();
    const onFocus = () => syncAll();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncAll();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => saveLS(LS.salaries, salaries), [salaries]);
  useEffect(() => saveLS(LS.expenses, expenses), [expenses]);

  /* =========================
     COMPUTED TOTALS
  ========================= */
  const receptionIncome = useMemo(
    () => invoices.reduce((sum, inv) => sum + Number(inv.paid || 0), 0),
    [invoices]
  );

  const receptionOutstanding = useMemo(
    () => invoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0),
    [invoices]
  );

  const pharmacyIncome = useMemo(
    () => pharmacySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [pharmacySales]
  );

  const pharmacyStockCost = useMemo(
    () =>
      pharmacyStock.reduce(
        (sum, item) => sum + Number(item.costPrice || 0) * Number(item.quantity || 0),
        0
      ),
    [pharmacyStock]
  );

  const salariesTotal = useMemo(
    () => salaries.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [salaries]
  );

  const expensesTotal = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const totalIncome = receptionIncome + pharmacyIncome;
  const totalSpending = salariesTotal + expensesTotal;
  const operatingNet = totalIncome - totalSpending;

  const totalReports =
    doctorReports.length +
    nurseReports.length +
    labReports.length +
    radiologyReports.length +
    ultrasoundReports.length;

  /* =========================
     DAILY / WEEKLY / MONTHLY / YEARLY
  ========================= */
  const today = todayISO();

  const dailyIncome = useMemo(() => {
    const rec = invoices
      .filter((i) => sameDay(i.date || i.createdAt, today))
      .reduce((sum, i) => sum + Number(i.paid || 0), 0);

    const pharm = pharmacySales
      .filter((s) => sameDay(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    return rec + pharm;
  }, [invoices, pharmacySales, today]);

  const dailySpending = useMemo(() => {
    const sal = salaries
      .filter((s) => sameDay(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const exp = expenses
      .filter((e) => sameDay(e.date || e.createdAt, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return sal + exp;
  }, [salaries, expenses, today]);

  const weeklyIncome = useMemo(() => {
    const rec = invoices
      .filter((i) => sameWeek(i.date || i.createdAt, today))
      .reduce((sum, i) => sum + Number(i.paid || 0), 0);

    const pharm = pharmacySales
      .filter((s) => sameWeek(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    return rec + pharm;
  }, [invoices, pharmacySales, today]);

  const weeklySpending = useMemo(() => {
    const sal = salaries
      .filter((s) => sameWeek(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const exp = expenses
      .filter((e) => sameWeek(e.date || e.createdAt, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return sal + exp;
  }, [salaries, expenses, today]);

  const monthlyIncome = useMemo(() => {
    const rec = invoices
      .filter((i) => sameMonth(i.date || i.createdAt, today))
      .reduce((sum, i) => sum + Number(i.paid || 0), 0);

    const pharm = pharmacySales
      .filter((s) => sameMonth(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    return rec + pharm;
  }, [invoices, pharmacySales, today]);

  const monthlySpending = useMemo(() => {
    const sal = salaries
      .filter((s) => sameMonth(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const exp = expenses
      .filter((e) => sameMonth(e.date || e.createdAt, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return sal + exp;
  }, [salaries, expenses, today]);

  const yearlyIncome = useMemo(() => {
    const rec = invoices
      .filter((i) => sameYear(i.date || i.createdAt, today))
      .reduce((sum, i) => sum + Number(i.paid || 0), 0);

    const pharm = pharmacySales
      .filter((s) => sameYear(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    return rec + pharm;
  }, [invoices, pharmacySales, today]);

  const yearlySpending = useMemo(() => {
    const sal = salaries
      .filter((s) => sameYear(s.date || s.createdAt, today))
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const exp = expenses
      .filter((e) => sameYear(e.date || e.createdAt, today))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return sal + exp;
  }, [salaries, expenses, today]);

  /* =========================
     ALERTS
  ========================= */
  const lowStockItems = useMemo(() => {
    return pharmacyStock.filter(
      (item) => Number(item.quantity || 0) <= Number(item.reorderLevel || 10)
    );
  }, [pharmacyStock]);

  const unpaidBills = useMemo(() => {
    return invoices.filter((inv) => Number(inv.balance || 0) > 0);
  }, [invoices]);

  const todayExpenseItems = useMemo(() => {
    return expenses.filter((e) => sameDay(e.date || e.createdAt, today));
  }, [expenses, today]);

  /* =========================
     SEARCH
  ========================= */
  const filteredPatients = useMemo(() => {
    const q = String(patientSearch || "").toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const blob = `${p.id || ""} ${p.fullName || ""} ${p.phone || ""} ${p.idNumber || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [patients, patientSearch]);

  const mergedReports = useMemo(() => {
    const doctor = doctorReports.map((r) => ({
      source: "Doctor",
      patientName: r.patientName || "",
      patientId: r.patientId || "",
      title: r.finalDiagnosis || r.provisionalDiagnosis || "Doctor Report",
      content: r.doctorReport || r.treatmentPlan || "",
      date: r.consultationDate || r.updatedAt || "",
    }));

    const nurse = nurseReports.map((r) => ({
      source: "Nurse",
      patientName: r.patientName || "",
      patientId: r.patientId || "",
      title: r.status || "Nurse Report",
      content: r.nurseReport || r.triageNotes || "",
      date: r.updatedAt || "",
    }));

    const lab = labReports.map((r) => ({
      source: "Lab",
      patientName: r.patientName || "",
      patientId: r.patientId || "",
      title: r.testName || "Lab Report",
      content: r.findings || r.interpretation || "",
      date: r.testDate || r.updatedAt || "",
    }));

    const radiology = radiologyReports.map((r) => ({
      source: "Radiology",
      patientName: r.patientName || "",
      patientId: r.patientId || "",
      title: r.test || r.testName || "Radiology Report",
      content: r.impression || r.findings || "",
      date: r.date || r.updatedAt || "",
    }));

    const ultrasound = ultrasoundReports.map((r) => ({
      source: "Ultrasound",
      patientName: r.patientName || "",
      patientId: r.patientId || "",
      title: r.test || r.testName || "Ultrasound Report",
      content: r.impression || r.findings || "",
      date: r.date || r.updatedAt || "",
    }));

    return [...doctor, ...nurse, ...lab, ...radiology, ...ultrasound];
  }, [doctorReports, nurseReports, labReports, radiologyReports, ultrasoundReports]);

  const filteredReports = useMemo(() => {
    const q = String(reportSearch || "").toLowerCase().trim();
    if (!q) return mergedReports;
    return mergedReports.filter((r) => {
      const blob = `${r.source} ${r.patientName} ${r.patientId} ${r.title} ${r.content}`.toLowerCase();
      return blob.includes(q);
    });
  }, [mergedReports, reportSearch]);

  /* =========================
     CHART DATA
  ========================= */
  const incomeByMonth = useMemo(() => {
    const reception = countByMonth(invoices, (i) => i.paid || 0);
    const pharmacy = countByMonth(pharmacySales, (s) => s.total || 0);

    return reception.map((row, index) => ({
      label: row.label,
      value: row.value + pharmacy[index].value,
    }));
  }, [invoices, pharmacySales]);

  const spendingByMonth = useMemo(() => {
    const salaryChart = countByMonth(salaries, (s) => s.amount || 0);
    const expenseChart = countByMonth(expenses, (e) => e.amount || 0);

    return salaryChart.map((row, index) => ({
      label: row.label,
      value: row.value + expenseChart[index].value,
    }));
  }, [salaries, expenses]);

  const departmentIncomeData = useMemo(() => {
    return [
      { label: "Reception", value: receptionIncome },
      { label: "Pharmacy", value: pharmacyIncome },
    ];
  }, [receptionIncome, pharmacyIncome]);

  /* =========================
     ACTIONS
  ========================= */
  const addSalary = () => {
    if (!salaryForm.staffName.trim()) return alert("Enter staff name.");
    if (!salaryForm.amount) return alert("Enter amount.");

    const newSalary = {
      id: uid("SAL"),
      ...salaryForm,
      amount: Number(salaryForm.amount || 0),
      createdAt: new Date().toISOString(),
    };

    setSalaries((prev) => [newSalary, ...prev]);
    setSalaryForm({
      staffName: "",
      role: "",
      amount: "",
      date: todayISO(),
      notes: "",
    });
    alert("Salary saved ✅");
  };

  const addExpense = () => {
    if (!expenseForm.expenseName.trim()) return alert("Enter expense name.");
    if (!expenseForm.amount) return alert("Enter amount.");

    const newExpense = {
      id: uid("EXP"),
      ...expenseForm,
      amount: Number(expenseForm.amount || 0),
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setExpenseForm({
      expenseName: "",
      category: "",
      amount: "",
      date: todayISO(),
      notes: "",
    });
    alert("Expense saved ✅");
  };

  const exportReceptionCSV = () => {
    const rows = invoices.map((inv) => ({
      InvoiceID: inv.id,
      Date: inv.date || inv.createdAt || "",
      Patient: inv.patientName || "",
      Department: inv.department || "",
      Total: inv.total || 0,
      Paid: inv.paid || 0,
      Balance: inv.balance || 0,
      PaymentMethod: inv.paymentMethod || "",
    }));
    exportCSV("reception_income.csv", rows);
  };

  const exportPharmacyCSV = () => {
    const rows = pharmacySales.map((sale) => ({
      SaleID: sale.id,
      Date: sale.date || sale.createdAt || "",
      Type: sale.saleType || "",
      CustomerOrPatient: sale.customerName || sale.patientName || "",
      PaymentMethod: sale.paymentMethod || "",
      Total: sale.total || 0,
      Paid: sale.paid || 0,
      Balance: sale.balance || 0,
    }));
    exportCSV("pharmacy_sales.csv", rows);
  };

  const exportPatientsCSV = () => {
    const rows = patients.map((p) => ({
      PatientID: p.id,
      FullName: p.fullName || "",
      Phone: p.phone || "",
      IDNumber: p.idNumber || "",
      Gender: p.gender || "",
      DOB: p.dob || "",
      PatientType: p.patientType || "",
      Address: p.address || "",
    }));
    exportCSV("patients.csv", rows);
  };

  const exportReportsCSV = () => {
    const rows = filteredReports.map((r) => ({
      Source: r.source,
      PatientName: r.patientName,
      PatientID: r.patientId,
      Title: r.title,
      Content: r.content,
      Date: r.date,
    }));
    exportCSV("hospital_reports.csv", rows);
  };

  const exportFullHospitalCSV = () => {
    const rows = [
      {
        Metric: "Reception Income",
        Value: receptionIncome,
      },
      {
        Metric: "Reception Outstanding",
        Value: receptionOutstanding,
      },
      {
        Metric: "Pharmacy Income",
        Value: pharmacyIncome,
      },
      {
        Metric: "Pharmacy Stock Cost",
        Value: pharmacyStockCost,
      },
      {
        Metric: "Salary Total",
        Value: salariesTotal,
      },
      {
        Metric: "Normal Expenses",
        Value: expensesTotal,
      },
      {
        Metric: "Operating Net",
        Value: operatingNet,
      },
      {
        Metric: "Patients Registered",
        Value: patients.length,
      },
      {
        Metric: "Total Reports",
        Value: totalReports,
      },
    ];
    exportCSV("hospital_full_summary.csv", rows);
  };

  const printHospitalReport = () => {
    window.print();
  };

  /* =========================
     VIEWS
  ========================= */
  const DashboardView = () => (
    <div className="admin-main">
      <div className="page-title">Hospital Overview Dashboard</div>

      <div className="summary-grid">
        <SummaryCard label="Reception Income" value={KES(receptionIncome)} />
        <SummaryCard label="Pharmacy Sales" value={KES(pharmacyIncome)} />
        <SummaryCard label="Pharmacy Stock Cost" value={KES(pharmacyStockCost)} />
        <SummaryCard label="Salary Total" value={KES(salariesTotal)} />
        <SummaryCard label="Normal Expenses" value={KES(expensesTotal)} />
        <SummaryCard label="Operating Net" value={KES(operatingNet)} tone={operatingNet >= 0 ? "good" : "bad"} />
        <SummaryCard label="Patients Registered" value={patients.length} />
        <SummaryCard label="Total Reports" value={totalReports} />
      </div>

      <div className="three-grid">
        <Panel title="Today">
          <div className="snapshot-row"><span>Income</span><b>{KES(dailyIncome)}</b></div>
          <div className="snapshot-row"><span>Spending</span><b>{KES(dailySpending)}</b></div>
          <div className="snapshot-row"><span>Net</span><b>{KES(dailyIncome - dailySpending)}</b></div>
        </Panel>

        <Panel title="This Week">
          <div className="snapshot-row"><span>Income</span><b>{KES(weeklyIncome)}</b></div>
          <div className="snapshot-row"><span>Spending</span><b>{KES(weeklySpending)}</b></div>
          <div className="snapshot-row"><span>Net</span><b>{KES(weeklyIncome - weeklySpending)}</b></div>
        </Panel>

        <Panel title="This Month">
          <div className="snapshot-row"><span>Income</span><b>{KES(monthlyIncome)}</b></div>
          <div className="snapshot-row"><span>Spending</span><b>{KES(monthlySpending)}</b></div>
          <div className="snapshot-row"><span>Net</span><b>{KES(monthlyIncome - monthlySpending)}</b></div>
        </Panel>
      </div>

      <div className="two-grid">
        <SimpleBarChart
          title="Monthly Income Trend"
          data={incomeByMonth}
          formatValue={(v) => `Ksh ${Number(v).toLocaleString()}`}
        />
        <SimpleBarChart
          title="Monthly Spending Trend"
          data={spendingByMonth}
          formatValue={(v) => `Ksh ${Number(v).toLocaleString()}`}
        />
      </div>

      <div className="two-grid">
        <SimpleBarChart
          title="Income by Department"
          data={departmentIncomeData}
          formatValue={(v) => `Ksh ${Number(v).toLocaleString()}`}
        />

        <Panel title="Important Alerts">
          {lowStockItems.length === 0 && unpaidBills.length === 0 ? (
            <EmptyState text="No critical alerts right now." />
          ) : (
            <div className="alert-list">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="alert-item warning">
                  Low stock: <b>{item.name}</b> ({item.quantity} left)
                </div>
              ))}
              {unpaidBills.slice(0, 5).map((bill) => (
                <div key={bill.id} className="alert-item danger">
                  Unpaid bill: <b>{bill.patientName || bill.id}</b> — {KES(bill.balance)}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Ideas to Make Admin Even Stronger">
        <ul className="idea-list">
          <li>Add actual login authentication with role-based route protection.</li>
          <li>Add attendance and payroll automation for staff.</li>
          <li>Add approval flow for expenses above a certain amount.</li>
          <li>Add medicine low-stock alerts directly from pharmacy to admin.</li>
          <li>Add PDF report generation using a dedicated PDF library later.</li>
          <li>Add charts for department profit and patient traffic.</li>
          <li>Add daily hospital closing summary.</li>
          <li>Add overdue bill collection tracking.</li>
        </ul>
      </Panel>
    </div>
  );

  const IncomeView = () => (
    <div className="admin-main">
      <div className="page-title">Hospital Bills & Income</div>

      <div className="two-grid">
        <Panel
          title="Reception Income (Invoices)"
          right={
            <button className="admin-btn primary no-print" onClick={exportReceptionCSV}>
              Export Reception CSV
            </button>
          }
        >
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.id}</td>
                    <td>{inv.date || inv.createdAt || "-"}</td>
                    <td>{inv.patientName || "-"}</td>
                    <td>{inv.department || "-"}</td>
                    <td>{KES(inv.total)}</td>
                    <td>{KES(inv.paid)}</td>
                    <td>{KES(inv.balance)}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="7" className="muted-cell">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Pharmacy Sales"
          right={
            <button className="admin-btn primary no-print" onClick={exportPharmacyCSV}>
              Export Pharmacy CSV
            </button>
          }
        >
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Patient / Customer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {pharmacySales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.id}</td>
                    <td>{sale.date || sale.createdAt || "-"}</td>
                    <td>{sale.saleType || "-"}</td>
                    <td>{sale.customerName || sale.patientName || "-"}</td>
                    <td>{sale.paymentMethod || "-"}</td>
                    <td>{KES(sale.total)}</td>
                    <td>{KES(sale.paid)}</td>
                    <td>{KES(sale.balance)}</td>
                  </tr>
                ))}
                {pharmacySales.length === 0 && (
                  <tr>
                    <td colSpan="8" className="muted-cell">No pharmacy sales found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );

  const PharmacyView = () => (
    <div className="admin-main">
      <div className="page-title">Pharmacy Sales & Stock Cost</div>

      <div className="summary-grid small-grid">
        <SummaryCard label="Pharmacy Income" value={KES(pharmacyIncome)} />
        <SummaryCard label="Stock Cost" value={KES(pharmacyStockCost)} />
        <SummaryCard label="Sales Records" value={pharmacySales.length} />
        <SummaryCard label="Low Stock Alerts" value={lowStockItems.length} tone={lowStockItems.length ? "bad" : "good"} />
      </div>

      <Panel title="Pharmacy Stock Details">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
                <th>Total Stock Cost</th>
              </tr>
            </thead>
            <tbody>
              {pharmacyStock.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category || "-"}</td>
                  <td>{KES(item.costPrice)}</td>
                  <td>{KES(item.sellingPrice)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.reorderLevel || 10}</td>
                  <td>{KES(Number(item.costPrice || 0) * Number(item.quantity || 0))}</td>
                </tr>
              ))}
              {pharmacyStock.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted-cell">No pharmacy stock records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Low Stock Alerts">
        {lowStockItems.length === 0 ? (
          <EmptyState text="No low stock items." />
        ) : (
          <div className="alert-list">
            {lowStockItems.map((item) => (
              <div key={item.id} className="alert-item warning">
                <b>{item.name}</b> is low: {item.quantity} remaining.
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );

  const ExpensesView = () => (
    <div className="admin-main">
      <div className="page-title">Salaries & Normal Expenses</div>

      <div className="two-grid">
        <Panel title="Record Salary">
          <div className="form-grid">
            <Field label="Staff Name">
              <input
                className="admin-input"
                value={salaryForm.staffName}
                onChange={(e) => setSalaryForm((prev) => ({ ...prev, staffName: e.target.value }))}
                placeholder="e.g. Dr Felix"
              />
            </Field>

            <Field label="Role">
              <input
                className="admin-input"
                value={salaryForm.role}
                onChange={(e) => setSalaryForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="e.g. Doctor"
              />
            </Field>

            <Field label="Amount">
              <input
                className="admin-input"
                type="number"
                value={salaryForm.amount}
                onChange={(e) => setSalaryForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Salary amount"
              />
            </Field>

            <Field label="Date">
              <input
                className="admin-input"
                type="date"
                value={salaryForm.date}
                onChange={(e) => setSalaryForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </Field>

            <Field label="Notes">
              <input
                className="admin-input"
                value={salaryForm.notes}
                onChange={(e) => setSalaryForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </Field>
          </div>

          <div className="action-row no-print">
            <button className="admin-btn primary" onClick={addSalary}>Save Salary</button>
          </div>
        </Panel>

        <Panel title="Record Normal Expense">
          <div className="form-grid">
            <Field label="Expense Name">
              <input
                className="admin-input"
                value={expenseForm.expenseName}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseName: e.target.value }))}
                placeholder="e.g. Electricity"
              />
            </Field>

            <Field label="Category">
              <input
                className="admin-input"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Utility"
              />
            </Field>

            <Field label="Amount">
              <input
                className="admin-input"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Expense amount"
              />
            </Field>

            <Field label="Date">
              <input
                className="admin-input"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </Field>

            <Field label="Notes">
              <input
                className="admin-input"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </Field>
          </div>

          <div className="action-row no-print">
            <button className="admin-btn primary" onClick={addExpense}>Save Expense</button>
          </div>
        </Panel>
      </div>

      <div className="two-grid">
        <Panel title="Salary Records">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((item) => (
                  <tr key={item.id}>
                    <td>{item.staffName}</td>
                    <td>{item.role}</td>
                    <td>{item.date}</td>
                    <td>{KES(item.amount)}</td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))}
                {salaries.length === 0 && (
                  <tr>
                    <td colSpan="5" className="muted-cell">No salary records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Expense Records">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.expenseName}</td>
                    <td>{item.category}</td>
                    <td>{item.date}</td>
                    <td>{KES(item.amount)}</td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="5" className="muted-cell">No expense records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Amount Spent Today">
        {todayExpenseItems.length === 0 ? (
          <EmptyState text="No expenses recorded today." />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {todayExpenseItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.expenseName}</td>
                    <td>{item.category}</td>
                    <td>{KES(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );

  const PatientsView = () => (
    <div className="admin-main">
      <div className="page-title">Patients Registered from Reception</div>

      <Panel
        title="Patient Records"
        right={
          <div className="panel-actions no-print">
            <input
              className="admin-input search-box"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patient by name / phone / ID"
            />
            <button className="admin-btn primary" onClick={exportPatientsCSV}>
              Export Patients CSV
            </button>
          </div>
        }
      >
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>ID Number</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.fullName}</td>
                  <td>{patient.phone || "-"}</td>
                  <td>{patient.idNumber || "-"}</td>
                  <td>{patient.gender || "-"}</td>
                  <td>{patient.dob || "-"}</td>
                  <td>{patient.patientType || "-"}</td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted-cell">No matching patient records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const ReportsView = () => (
    <div className="admin-main">
      <div className="page-title">Doctor / Nurse / Lab / Radiology / Ultrasound Reports</div>

      <Panel
        title="All Hospital Reports"
        right={
          <div className="panel-actions no-print">
            <input
              className="admin-input search-box"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              placeholder="Search reports"
            />
            <button className="admin-btn primary" onClick={exportReportsCSV}>
              Export Reports CSV
            </button>
          </div>
        }
      >
        <div className="report-list">
          {filteredReports.map((report, index) => (
            <div key={`${report.source}-${report.patientId}-${index}`} className="report-card">
              <div className="report-top">
                <span className="report-badge">{report.source}</span>
                <span className="report-date">{report.date || "-"}</span>
              </div>
              <h4>{report.patientName || "Unknown Patient"}</h4>
              <p><strong>Patient ID:</strong> {report.patientId || "-"}</p>
              <p><strong>Title:</strong> {report.title || "-"}</p>
              <p><strong>Details:</strong> {report.content || "-"}</p>
            </div>
          ))}
          {filteredReports.length === 0 && <EmptyState text="No reports found." />}
        </div>
      </Panel>
    </div>
  );

  const AnalyticsView = () => (
    <div className="admin-main">
      <div className="page-title">Analytics & Charts</div>

      <div className="three-grid">
        <Panel title="Daily">
          <div className="snapshot-row"><span>Income</span><b>{KES(dailyIncome)}</b></div>
          <div className="snapshot-row"><span>Spending</span><b>{KES(dailySpending)}</b></div>
          <div className="snapshot-row"><span>Net</span><b>{KES(dailyIncome - dailySpending)}</b></div>
        </Panel>

        <Panel title="Monthly">
          <div className="snapshot-row"><span>Income</span><b>{KES(monthlyIncome)}</b></div>
          <div className="snapshot-row"><span>Spending</span><b>{KES(monthlySpending)}</b></div>
          <div className="snapshot-row"><span>Net</span><b>{KES(monthlyIncome - monthlySpending)}</b></div>
        </Panel>

        <Panel title="Yearly">
          <div className="snapshot-row"><span>Income</span><b>{KES(yearlyIncome)}</b></div>
          <div className="snapshot-row"><span>Spending</span><b>{KES(yearlySpending)}</b></div>
          <div className="snapshot-row"><span>Net</span><b>{KES(yearlyIncome - yearlySpending)}</b></div>
        </Panel>
      </div>

      <div className="two-grid">
        <SimpleBarChart
          title="Monthly Income Graph"
          data={incomeByMonth}
          formatValue={(v) => `Ksh ${Number(v).toLocaleString()}`}
        />
        <SimpleBarChart
          title="Monthly Spending Graph"
          data={spendingByMonth}
          formatValue={(v) => `Ksh ${Number(v).toLocaleString()}`}
        />
      </div>

      <div className="two-grid">
        <Panel title="Role Views (UI Role Switch)">
          <div className="role-switch">
            <button
              className={`admin-btn ${roleView === "admin" ? "primary" : ""}`}
              onClick={() => setRoleView("admin")}
            >
              Admin
            </button>
            <button
              className={`admin-btn ${roleView === "doctor" ? "primary" : ""}`}
              onClick={() => setRoleView("doctor")}
            >
              Doctor
            </button>
            <button
              className={`admin-btn ${roleView === "nurse" ? "primary" : ""}`}
              onClick={() => setRoleView("nurse")}
            >
              Nurse
            </button>
          </div>
          <div className="role-note">
            Current UI role view: <b>{roleView}</b>.  
            This is a frontend role switch for now. Real secure login protection can be added later with backend auth.
          </div>
        </Panel>

        <Panel title="PDF / Print Report">
          <div className="role-note">
            Use the <b>Print Hospital Report</b> button in the header and choose <b>Save as PDF</b> in the print window.
            This gives you PDF-ready hospital reports without extra libraries.
          </div>
        </Panel>
      </div>
    </div>
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="admin-page">
      <div className="print-header-only">
        <h1>ANKA HOSPITAL - ADMIN REPORT</h1>
        <p>Date: {todayISO()}</p>
      </div>

      <header className="admin-header">
        <div className="brand-box">
          <img src={logo} alt="Anka Hospital Logo" className="brand-logo" />
          <div>
            <div className="brand-title">ANKA HOSPITAL</div>
            <div className="brand-subtitle">Admin Dashboard</div>
          </div>
        </div>

        <div className="header-actions no-print">
          <button className="admin-btn" onClick={syncAll}>Sync Now</button>
          <button className="admin-btn" onClick={exportFullHospitalCSV}>Export Full CSV</button>
          <button className="admin-btn primary" onClick={printHospitalReport}>Print / Save PDF</button>
          <button className="admin-btn danger">Logout</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar no-print">
          <div className="nav-title">Navigation</div>

          <div className={`nav-item ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
            📊 Dashboard
          </div>
          <div className={`nav-item ${tab === "income" ? "active" : ""}`} onClick={() => setTab("income")}>
            💰 Bills & Income
          </div>
          <div className={`nav-item ${tab === "pharmacy" ? "active" : ""}`} onClick={() => setTab("pharmacy")}>
            💊 Pharmacy & Stock
          </div>
          <div className={`nav-item ${tab === "expenses" ? "active" : ""}`} onClick={() => setTab("expenses")}>
            🧾 Salaries & Expenses
          </div>
          <div className={`nav-item ${tab === "patients" ? "active" : ""}`} onClick={() => setTab("patients")}>
            👤 Patients
          </div>
          <div className={`nav-item ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>
            📋 Reports
          </div>
          <div className={`nav-item ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}>
            📈 Analytics & Charts
          </div>

          <div className="sidebar-note">
            Admin can see patient bills, pharmacy sales, stock cost, salaries, expenses, and all clinical reports across the hospital.
          </div>
        </aside>

        <main className="admin-content">
          {tab === "dashboard" && <DashboardView />}
          {tab === "income" && <IncomeView />}
          {tab === "pharmacy" && <PharmacyView />}
          {tab === "expenses" && <ExpensesView />}
          {tab === "patients" && <PatientsView />}
          {tab === "reports" && <ReportsView />}
          {tab === "analytics" && <AnalyticsView />}
        </main>
      </div>
    </div>
  );
}