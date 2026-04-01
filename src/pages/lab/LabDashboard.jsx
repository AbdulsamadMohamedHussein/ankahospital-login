import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Lab.css";
import logo from "../../assets/logo.png";

const LS = {
  patients: "anka_patients",
  labResults: "anka_lab_results",
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

const uid = (prefix = "LAB") =>
  `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

const nowISO = () => new Date().toISOString();
const todayText = () =>
  new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const TEST_TEMPLATES = {
  "Full Haemogram": [
    { key: "wbc", label: "WBC", unit: "x10^9/L", normal: "4.0 - 11.0" },
    { key: "rbc", label: "RBC", unit: "x10^12/L", normal: "4.2 - 5.9" },
    { key: "hb", label: "Haemoglobin (Hb)", unit: "g/dL", normal: "12.0 - 17.5" },
    { key: "hct", label: "Hematocrit (HCT)", unit: "%", normal: "36 - 53" },
    { key: "mcv", label: "MCV", unit: "fL", normal: "80 - 100" },
    { key: "mch", label: "MCH", unit: "pg", normal: "27 - 34" },
    { key: "mchc", label: "MCHC", unit: "g/dL", normal: "32 - 36" },
    { key: "plt", label: "Platelets", unit: "x10^9/L", normal: "150 - 450" },
    { key: "neut", label: "Neutrophils", unit: "%", normal: "40 - 75" },
    { key: "lymph", label: "Lymphocytes", unit: "%", normal: "20 - 45" },
    { key: "mono", label: "Monocytes", unit: "%", normal: "2 - 10" },
    { key: "eos", label: "Eosinophils", unit: "%", normal: "1 - 6" },
    { key: "baso", label: "Basophils", unit: "%", normal: "0 - 2" },
  ],

  "Malaria Test": [
    { key: "method", label: "Method", unit: "", normal: "RDT / Microscopy" },
    { key: "parasites", label: "Malaria Parasites", unit: "", normal: "Negative" },
    { key: "species", label: "Species", unit: "", normal: "-" },
    { key: "density", label: "Parasite Density", unit: "/uL", normal: "-" },
  ],

  Urinalysis: [
    { key: "colour", label: "Colour", unit: "", normal: "Yellow" },
    { key: "appearance", label: "Appearance", unit: "", normal: "Clear" },
    { key: "ph", label: "pH", unit: "", normal: "4.5 - 8.0" },
    { key: "protein", label: "Protein", unit: "", normal: "Negative" },
    { key: "glucose", label: "Glucose", unit: "", normal: "Negative" },
    { key: "ketones", label: "Ketones", unit: "", normal: "Negative" },
    { key: "bilirubin", label: "Bilirubin", unit: "", normal: "Negative" },
    { key: "urobilinogen", label: "Urobilinogen", unit: "", normal: "Normal" },
    { key: "blood", label: "Blood", unit: "", normal: "Negative" },
    { key: "nitrites", label: "Nitrites", unit: "", normal: "Negative" },
    { key: "leucocytes", label: "Leucocytes", unit: "", normal: "Negative" },
    { key: "sg", label: "Specific Gravity", unit: "", normal: "1.005 - 1.030" },
  ],

  "Stool Analysis": [
    { key: "colour", label: "Colour", unit: "", normal: "Brown" },
    { key: "consistency", label: "Consistency", unit: "", normal: "Formed" },
    { key: "mucus", label: "Mucus", unit: "", normal: "Absent" },
    { key: "blood", label: "Blood", unit: "", normal: "Absent" },
    { key: "ova", label: "Ova", unit: "", normal: "Absent" },
    { key: "cysts", label: "Cysts", unit: "", normal: "Absent" },
    { key: "protozoa", label: "Protozoa", unit: "", normal: "Absent" },
    { key: "helminths", label: "Helminths", unit: "", normal: "Absent" },
    { key: "puscells", label: "Pus Cells", unit: "/HPF", normal: "0 - 2" },
  ],

  "Blood Sugar": [
    { key: "testType", label: "Test Type", unit: "", normal: "RBS / FBS / PPBS" },
    { key: "glucose", label: "Glucose Level", unit: "mmol/L", normal: "3.9 - 7.8" },
  ],

  LFT: [
    { key: "alt", label: "ALT", unit: "U/L", normal: "7 - 56" },
    { key: "ast", label: "AST", unit: "U/L", normal: "10 - 40" },
    { key: "alp", label: "ALP", unit: "U/L", normal: "44 - 147" },
    { key: "ggt", label: "GGT", unit: "U/L", normal: "9 - 48" },
    { key: "bilirubinTotal", label: "Total Bilirubin", unit: "umol/L", normal: "3 - 17" },
    { key: "bilirubinDirect", label: "Direct Bilirubin", unit: "umol/L", normal: "0 - 5" },
    { key: "albumin", label: "Albumin", unit: "g/L", normal: "35 - 50" },
    { key: "proteinTotal", label: "Total Protein", unit: "g/L", normal: "60 - 80" },
  ],

  KFT: [
    { key: "urea", label: "Urea", unit: "mmol/L", normal: "2.5 - 7.1" },
    { key: "creatinine", label: "Creatinine", unit: "umol/L", normal: "62 - 106" },
    { key: "sodium", label: "Sodium", unit: "mmol/L", normal: "135 - 145" },
    { key: "potassium", label: "Potassium", unit: "mmol/L", normal: "3.5 - 5.1" },
    { key: "chloride", label: "Chloride", unit: "mmol/L", normal: "98 - 107" },
    { key: "bicarbonate", label: "Bicarbonate", unit: "mmol/L", normal: "22 - 29" },
  ],

  "Pregnancy Test": [
    { key: "method", label: "Method", unit: "", normal: "Urine / Serum" },
    { key: "result", label: "Result", unit: "", normal: "Negative" },
  ],

  "HIV Test": [
    { key: "method", label: "Method", unit: "", normal: "Rapid Test" },
    { key: "result", label: "Result", unit: "", normal: "Negative" },
  ],

  "Hepatitis B": [
    { key: "marker", label: "Marker", unit: "", normal: "HBsAg" },
    { key: "result", label: "Result", unit: "", normal: "Negative" },
  ],

  "Hepatitis C": [
    { key: "marker", label: "Marker", unit: "", normal: "Anti-HCV" },
    { key: "result", label: "Result", unit: "", normal: "Negative" },
  ],

  "Widal Test": [
    { key: "to", label: "TO", unit: "", normal: "<1:80" },
    { key: "th", label: "TH", unit: "", normal: "<1:80" },
    { key: "ao", label: "AO", unit: "", normal: "<1:80" },
    { key: "bo", label: "BO", unit: "", normal: "<1:80" },
  ],

  CRP: [
    { key: "crp", label: "CRP", unit: "mg/L", normal: "< 10" },
  ],

  ESR: [
    { key: "esr", label: "ESR", unit: "mm/hr", normal: "0 - 20" },
  ],

  "Blood Grouping": [
    { key: "abo", label: "ABO Group", unit: "", normal: "A / B / AB / O" },
    { key: "rhesus", label: "Rhesus", unit: "", normal: "Positive / Negative" },
  ],
};

const TEST_OPTIONS = Object.keys(TEST_TEMPLATES);

function createEmptyResultForTest(testName) {
  const fields = TEST_TEMPLATES[testName] || [];
  const values = {};
  fields.forEach((field) => {
    values[field.key] = "";
  });
  return values;
}

function LabDashboard() {
  const printRef = useRef(null);

  const [tab, setTab] = useState("queue");
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedTestName, setSelectedTestName] = useState("Full Haemogram");
  const [formFields, setFormFields] = useState(createEmptyResultForTest("Full Haemogram"));

  const [patients, setPatients] = useState(() => loadLS(LS.patients, []));
  const [labResults, setLabResults] = useState(() => loadLS(LS.labResults, []));

  const [generalForm, setGeneralForm] = useState({
    labNumber: "",
    specimenType: "",
    reportStatus: "Final",
    technicianName: "Lab Technician",
    testDate: new Date().toISOString().split("T")[0],
    findings: "",
    interpretation: "",
    comments: "",
    recommendation: "",
  });

  const [selectedPrintRecord, setSelectedPrintRecord] = useState(null);

  useEffect(() => {
    saveLS(LS.labResults, labResults);
  }, [labResults]);

  useEffect(() => {
    setPatients(loadLS(LS.patients, []));
    setLabResults(loadLS(LS.labResults, []));
  }, []);

  const filteredPatients = useMemo(() => {
    const q = String(search || "").toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const blob = `${p.id || ""} ${p.fullName || ""} ${p.phone || ""} ${p.idNumber || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [patients, search]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const patientReports = useMemo(() => {
    if (!selectedPatientId) return [];
    return labResults.filter((r) => r.patientId === selectedPatientId);
  }, [labResults, selectedPatientId]);

  const todaysReports = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return labResults.filter((r) => String(r.testDate || "").startsWith(today));
  }, [labResults]);

  const pendingCount = useMemo(() => {
    return labResults.filter((r) => r.reportStatus === "Pending").length;
  }, [labResults]);

  const finalCount = useMemo(() => {
    return labResults.filter((r) => r.reportStatus === "Final").length;
  }, [labResults]);

  const openPatient = (patient) => {
    setSelectedPatientId(patient.id);
    setTab("test");

    const existing = labResults.find(
      (r) => r.patientId === patient.id && r.testName === selectedTestName
    );

    if (existing) {
      setGeneralForm({
        labNumber: existing.labNumber || "",
        specimenType: existing.specimenType || "",
        reportStatus: existing.reportStatus || "Final",
        technicianName: existing.technicianName || "Lab Technician",
        testDate: existing.testDate || new Date().toISOString().split("T")[0],
        findings: existing.findings || "",
        interpretation: existing.interpretation || "",
        comments: existing.comments || "",
        recommendation: existing.recommendation || "",
      });
      setFormFields(existing.results || createEmptyResultForTest(selectedTestName));
    } else {
      setGeneralForm({
        labNumber: "",
        specimenType: "",
        reportStatus: "Final",
        technicianName: "Lab Technician",
        testDate: new Date().toISOString().split("T")[0],
        findings: "",
        interpretation: "",
        comments: "",
        recommendation: "",
      });
      setFormFields(createEmptyResultForTest(selectedTestName));
    }
  };

  const changeTest = (testName) => {
    setSelectedTestName(testName);

    const existing = labResults.find(
      (r) => r.patientId === selectedPatientId && r.testName === testName
    );

    if (existing) {
      setGeneralForm({
        labNumber: existing.labNumber || "",
        specimenType: existing.specimenType || "",
        reportStatus: existing.reportStatus || "Final",
        technicianName: existing.technicianName || "Lab Technician",
        testDate: existing.testDate || new Date().toISOString().split("T")[0],
        findings: existing.findings || "",
        interpretation: existing.interpretation || "",
        comments: existing.comments || "",
        recommendation: existing.recommendation || "",
      });
      setFormFields(existing.results || createEmptyResultForTest(testName));
    } else {
      setGeneralForm((prev) => ({
        ...prev,
        findings: "",
        interpretation: "",
        comments: "",
        recommendation: "",
      }));
      setFormFields(createEmptyResultForTest(testName));
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldValueChange = (fieldKey, value) => {
    setFormFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const clearTestForm = () => {
    setGeneralForm({
      labNumber: "",
      specimenType: "",
      reportStatus: "Final",
      technicianName: "Lab Technician",
      testDate: new Date().toISOString().split("T")[0],
      findings: "",
      interpretation: "",
      comments: "",
      recommendation: "",
    });
    setFormFields(createEmptyResultForTest(selectedTestName));
  };

  const saveReport = (preparePrint = false) => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    const fields = TEST_TEMPLATES[selectedTestName] || [];
    const hasValue = fields.some((f) => String(formFields[f.key] || "").trim() !== "");

    if (!hasValue && !generalForm.findings.trim()) {
      alert("Please enter at least one result or finding.");
      return;
    }

    const existing = labResults.find(
      (r) => r.patientId === selectedPatient.id && r.testName === selectedTestName
    );

    const report = {
      id: existing?.id || uid("LABR"),
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientType: selectedPatient.patientType || "Outpatient",
      phone: selectedPatient.phone || "",
      labNumber: generalForm.labNumber || uid("LABNO"),
      specimenType: generalForm.specimenType,
      reportStatus: generalForm.reportStatus,
      technicianName: generalForm.technicianName,
      testDate: generalForm.testDate,
      testName: selectedTestName,
      results: formFields,
      findings: generalForm.findings,
      interpretation: generalForm.interpretation,
      comments: generalForm.comments,
      recommendation: generalForm.recommendation,
      sentToDoctor: true,
      createdAt: existing?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };

    setLabResults((prev) => {
      const exists = prev.some(
        (r) => r.patientId === selectedPatient.id && r.testName === selectedTestName
      );
      if (exists) {
        return prev.map((r) =>
          r.patientId === selectedPatient.id && r.testName === selectedTestName ? report : r
        );
      }
      return [report, ...prev];
    });

    if (preparePrint) {
      setSelectedPrintRecord(report);
      setTab("print");
    }

    alert(
      preparePrint
        ? "Lab report saved and prepared for print ✅"
        : "Lab report saved and sent to doctor ✅"
    );
  };

  const printReport = () => {
    window.print();
  };

  const Header = () => (
    <div className="lab-header">
      <div className="lab-brand">
        <img src={logo} alt="Anka Hospital" className="lab-logo" />
        <div>
          <div className="lab-title">Anka Hospital</div>
          <div className="lab-sub">Laboratory Desk</div>
        </div>
      </div>

      <div className="lab-header-right">
        <div className="lab-welcome">
          <div className="lab-welcome-title">Welcome, Lab Technician</div>
          <div className="lab-welcome-date">{todayText()}</div>
        </div>
        <button className="lab-btn">Refresh</button>
        <button className="lab-btn danger">Logout</button>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="lab-sidebar">
      <div className="lab-nav-title">Navigation</div>

      <div className={`lab-nav-item ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
        🧪 Patient Queue
      </div>

      <div className={`lab-nav-item ${tab === "test" ? "active" : ""}`} onClick={() => setTab("test")}>
        📋 Fill Test Results
      </div>

      <div className={`lab-nav-item ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
        📂 Report History
      </div>

      <div className={`lab-nav-item ${tab === "print" ? "active" : ""}`} onClick={() => setTab("print")}>
        🖨️ Print Report
      </div>

      <div className="lab-side-note">
        <p>
          This module receives patients from Reception, lets the lab technician fill structured
          results by test type, and sends finished reports to the doctor.
        </p>
      </div>
    </div>
  );

  const Panel = ({ title, right, children }) => (
    <div className="lab-panel">
      <div className="lab-panel-head">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div className="lab-field">
      <label className="lab-label">{label}</label>
      {children}
    </div>
  );

  const SummaryCard = ({ label, value }) => (
    <div className="lab-summary-card">
      <div className="lab-summary-label">{label}</div>
      <div className="lab-summary-value">{value}</div>
    </div>
  );

  const renderQueue = () => (
    <div className="lab-main">
      <div className="lab-page-title">Laboratory Queue</div>

      <div className="lab-summary-grid">
        <SummaryCard label="Patients from Reception" value={patients.length} />
        <SummaryCard label="Reports Today" value={todaysReports.length} />
        <SummaryCard label="Pending Reports" value={pendingCount} />
        <SummaryCard label="Final Reports" value={finalCount} />
      </div>

      <Panel
        title="Registered Patients"
        right={
          <input
            className="lab-input search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / phone / ID"
          />
        }
      >
        <div className="table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.fullName}</td>
                  <td>{patient.phone || "-"}</td>
                  <td>{patient.patientType || "Outpatient"}</td>
                  <td>
                    <button className="small-btn primary" onClick={() => openPatient(patient)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted-cell">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderTestForm = () => {
    const templateFields = TEST_TEMPLATES[selectedTestName] || [];

    return (
      <div className="lab-main">
        <div className="lab-page-title">Fill Laboratory Test Results</div>

        {!selectedPatient ? (
          <div className="empty-box">Select a patient from the queue first.</div>
        ) : (
          <>
            <div className="patient-banner">
              <div>
                <h2>{selectedPatient.fullName}</h2>
                <p>
                  Patient ID: <b>{selectedPatient.id}</b> | Phone: <b>{selectedPatient.phone || "-"}</b> | Type:{" "}
                  <b>{selectedPatient.patientType || "Outpatient"}</b>
                </p>
              </div>
              <div className="patient-banner-actions">
                <button className="lab-btn" onClick={() => setTab("queue")}>
                  Back to Queue
                </button>
                <button className="lab-btn danger" onClick={clearTestForm}>
                  Clear Form
                </button>
              </div>
            </div>

            <div className="lab-two-grid">
              <Panel title="Patient Information from Reception">
                <div className="info-grid">
                  <Info label="Full Name" value={selectedPatient.fullName} />
                  <Info label="Phone" value={selectedPatient.phone || "-"} />
                  <Info label="ID Number" value={selectedPatient.idNumber || "-"} />
                  <Info label="Gender" value={selectedPatient.gender || "-"} />
                  <Info label="DOB" value={selectedPatient.dob || "-"} />
                  <Info label="Patient Type" value={selectedPatient.patientType || "Outpatient"} />
                </div>
              </Panel>

              <Panel title="Report Setup">
                <div className="lab-form-grid">
                  <Field label="Test Name">
                    <select
                      className="lab-input"
                      value={selectedTestName}
                      onChange={(e) => changeTest(e.target.value)}
                    >
                      {TEST_OPTIONS.map((test) => (
                        <option key={test} value={test}>
                          {test}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Lab Number">
                    <input
                      className="lab-input"
                      name="labNumber"
                      value={generalForm.labNumber}
                      onChange={handleGeneralChange}
                      placeholder="Lab number"
                    />
                  </Field>

                  <Field label="Specimen Type">
                    <input
                      className="lab-input"
                      name="specimenType"
                      value={generalForm.specimenType}
                      onChange={handleGeneralChange}
                      placeholder="Blood / urine / stool / serum..."
                    />
                  </Field>

                  <Field label="Technician Name">
                    <input
                      className="lab-input"
                      name="technicianName"
                      value={generalForm.technicianName}
                      onChange={handleGeneralChange}
                      placeholder="Technician"
                    />
                  </Field>

                  <Field label="Test Date">
                    <input
                      className="lab-input"
                      type="date"
                      name="testDate"
                      value={generalForm.testDate}
                      onChange={handleGeneralChange}
                    />
                  </Field>

                  <Field label="Report Status">
                    <select
                      className="lab-input"
                      name="reportStatus"
                      value={generalForm.reportStatus}
                      onChange={handleGeneralChange}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Interim">Interim</option>
                      <option value="Final">Final</option>
                    </select>
                  </Field>
                </div>
              </Panel>
            </div>

            <Panel title={`${selectedTestName} Result Entry`}>
              <div className="dynamic-result-grid">
                {templateFields.map((field) => (
                  <div key={field.key} className="result-line">
                    <div className="result-title">{field.label}</div>
                    <input
                      className="lab-input"
                      value={formFields[field.key] || ""}
                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label}`}
                    />
                    <div className="result-unit">{field.unit || "-"}</div>
                    <div className="result-normal">{field.normal || "-"}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Narrative Findings & Interpretation">
              <div className="lab-form-grid single-column">
                <Field label="Findings">
                  <textarea
                    className="lab-input"
                    name="findings"
                    value={generalForm.findings}
                    onChange={handleGeneralChange}
                    rows="4"
                    placeholder="Enter laboratory findings..."
                  />
                </Field>

                <Field label="Interpretation">
                  <textarea
                    className="lab-input"
                    name="interpretation"
                    value={generalForm.interpretation}
                    onChange={handleGeneralChange}
                    rows="4"
                    placeholder="Interpret the results clinically..."
                  />
                </Field>

                <Field label="Comments">
                  <textarea
                    className="lab-input"
                    name="comments"
                    value={generalForm.comments}
                    onChange={handleGeneralChange}
                    rows="3"
                    placeholder="Additional comments..."
                  />
                </Field>

                <Field label="Recommendation">
                  <textarea
                    className="lab-input"
                    name="recommendation"
                    value={generalForm.recommendation}
                    onChange={handleGeneralChange}
                    rows="3"
                    placeholder="Recommendation to clinician / doctor..."
                  />
                </Field>
              </div>
            </Panel>

            <div className="action-bar">
              <button className="lab-btn primary" onClick={() => saveReport(false)}>
                Save & Send to Doctor
              </button>
              <button className="lab-btn success" onClick={() => saveReport(true)}>
                Save & Prepare Print
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="lab-main">
      <div className="lab-page-title">Laboratory Report History</div>

      <Panel title="Saved Lab Reports">
        <div className="table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Patient</th>
                <th>Test</th>
                <th>Date</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {labResults.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.patientName}</td>
                  <td>{report.testName}</td>
                  <td>{report.testDate}</td>
                  <td>{report.reportStatus}</td>
                  <td>{report.technicianName}</td>
                  <td>
                    <button
                      className="small-btn primary"
                      onClick={() => {
                        setSelectedPrintRecord(report);
                        setTab("print");
                      }}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
              {labResults.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted-cell">
                    No lab reports saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {selectedPatient && (
        <Panel title={`Reports for ${selectedPatient.fullName}`}>
          <div className="table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patientReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.testName}</td>
                    <td>{report.testDate}</td>
                    <td>{report.reportStatus}</td>
                  </tr>
                ))}
                {patientReports.length === 0 && (
                  <tr>
                    <td colSpan="3" className="muted-cell">
                      No reports for this patient yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );

  const renderPrint = () => {
    const report = selectedPrintRecord;

    return (
      <div className="lab-main">
        <div className="lab-page-title">Print Structured Laboratory Report</div>

        {!report ? (
          <div className="empty-box">Select or prepare a report first.</div>
        ) : (
          <>
            <div className="action-bar no-print">
              <button className="lab-btn" onClick={() => setTab("history")}>
                Back to History
              </button>
              <button className="lab-btn success" onClick={printReport}>
                Print Report
              </button>
            </div>

            <div className="print-sheet print-area" ref={printRef}>
              <div className="print-head">
                <div className="print-brand">
                  <img src={logo} alt="Anka Hospital Logo" className="print-logo" />
                  <div>
                    <div className="print-title">ANKA HOSPITAL</div>
                    <div className="print-subtitle">Laboratory Report</div>
                  </div>
                </div>
                <div className="print-meta">
                  <div><strong>Report ID:</strong> {report.id}</div>
                  <div><strong>Date:</strong> {report.testDate}</div>
                  <div><strong>Status:</strong> {report.reportStatus}</div>
                </div>
              </div>

              <hr />

              <section className="print-section">
                <h3>Patient Information</h3>
                <div className="print-grid">
                  <div><strong>Name:</strong> {report.patientName}</div>
                  <div><strong>Patient ID:</strong> {report.patientId}</div>
                  <div><strong>Phone:</strong> {report.phone || "-"}</div>
                  <div><strong>Patient Type:</strong> {report.patientType || "Outpatient"}</div>
                  <div><strong>Test Name:</strong> {report.testName}</div>
                  <div><strong>Specimen:</strong> {report.specimenType || "-"}</div>
                  <div><strong>Lab Number:</strong> {report.labNumber || "-"}</div>
                  <div><strong>Technician:</strong> {report.technicianName}</div>
                </div>
              </section>

              <section className="print-section">
                <h3>Structured Test Results</h3>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(TEST_TEMPLATES[report.testName] || []).map((field) => (
                      <tr key={field.key}>
                        <td>{field.label}</td>
                        <td>{report.results?.[field.key] || "-"}</td>
                        <td>{field.unit || "-"}</td>
                        <td>{field.normal || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>Findings & Interpretation</h3>
                <p><strong>Findings:</strong> {report.findings || "-"}</p>
                <p><strong>Interpretation:</strong> {report.interpretation || "-"}</p>
                <p><strong>Comments:</strong> {report.comments || "-"}</p>
                <p><strong>Recommendation:</strong> {report.recommendation || "-"}</p>
              </section>

              <section className="print-footer">
                <div>Lab Technician Signature: ________________________</div>
                <div>Report prepared and sent to Doctor.</div>
              </section>
            </div>
          </>
        )}
      </div>
    );
  };

  const Info = ({ label, value }) => (
    <div className="info-card">
      <div className="info-label">{label}</div>
      <div className="info-value">{String(value ?? "-")}</div>
    </div>
  );

  return (
    <div className="lab-page">
      <Header />

      <div className="lab-layout">
        <Sidebar />

        <div className="lab-content">
          {tab === "queue" && renderQueue()}
          {tab === "test" && renderTestForm()}
          {tab === "history" && renderHistory()}
          {tab === "print" && renderPrint()}
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default LabDashboard;