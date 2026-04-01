import React, { useEffect, useMemo, useState } from "react";
import "./Nurse.css";
import logo from "../../assets/logo.png";

const LS = {
  patients: "anka_patients",
  nurseNotes: "anka_nurse_notes",
  triageQueue: "anka_triage_queue",
};

const loadLS = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const saveLS = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const nowISO = () => new Date().toISOString();
const todayText = () =>
  new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const uid = (prefix = "NRS") =>
  `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

const calcBMI = (weight, heightCm) => {
  const w = Number(weight || 0);
  const h = Number(heightCm || 0);
  if (!w || !h) return "";
  const meters = h / 100;
  const bmi = w / (meters * meters);
  return bmi.toFixed(1);
};

const bmiStatus = (bmi) => {
  const n = Number(bmi || 0);
  if (!n) return "-";
  if (n < 18.5) return "Underweight";
  if (n < 25) return "Normal";
  if (n < 30) return "Overweight";
  return "Obese";
};

export default function NurseDashboard() {
  const [patients, setPatients] = useState(() => loadLS(LS.patients, []));
  const [nurseNotes, setNurseNotes] = useState(() => loadLS(LS.nurseNotes, []));
  const [tab, setTab] = useState("queue");
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [triageForm, setTriageForm] = useState({
    temperature: "",
    bloodPressure: "",
    pulseRate: "",
    respirationRate: "",
    oxygenSaturation: "",
    weightKg: "",
    heightCm: "",
    bmi: "",
    bmiClass: "",
    urgency: "Normal",
    status: "Waiting for Doctor",
    painScore: "",
    glucose: "",
    allergies: "",
    triageNotes: "",
    nurseReport: "",
    inpatientSummary: "",
    outpatientSummary: "",
    nursingPlan: "",
    medicationGiven: "",
    fluidChart: "",
    admissionNotes: "",
    dischargeNotes: "",
    sentToDoctor: false,
  });

  useEffect(() => {
    saveLS(LS.nurseNotes, nurseNotes);
  }, [nurseNotes]);

  useEffect(() => {
    const bmi = calcBMI(triageForm.weightKg, triageForm.heightCm);
    const cls = bmiStatus(bmi);

    setTriageForm((prev) => {
      if (prev.bmi === bmi && prev.bmiClass === cls) return prev;
      return {
        ...prev,
        bmi,
        bmiClass: cls,
      };
    });
  }, [triageForm.weightKg, triageForm.heightCm]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(loadLS(LS.patients, []));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredPatients = useMemo(() => {
    const q = String(search || "").toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const blob =
        `${p.id || ""} ${p.fullName || ""} ${p.phone || ""} ${p.idNumber || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [patients, search]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const patientExistingNurseRecord = useMemo(() => {
    if (!selectedPatientId) return null;
    return nurseNotes.find((n) => n.patientId === selectedPatientId) || null;
  }, [nurseNotes, selectedPatientId]);

  const todaysCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return nurseNotes.filter((n) => String(n.createdAt || "").startsWith(today)).length;
  }, [nurseNotes]);

  const inpatientsCount = useMemo(() => {
    return patients.filter((p) => String(p.patientType || "").toLowerCase() === "inpatient")
      .length;
  }, [patients]);

  const outpatientsCount = useMemo(() => {
    return patients.filter((p) => String(p.patientType || "").toLowerCase() === "outpatient")
      .length;
  }, [patients]);

  const urgentCount = useMemo(() => {
    return nurseNotes.filter((n) => n.urgency === "Critical" || n.urgency === "High").length;
  }, [nurseNotes]);

  const selectPatient = (patient) => {
    setSelectedPatientId(patient.id);

    const existing = nurseNotes.find((n) => n.patientId === patient.id);

    if (existing) {
      setTriageForm({
        temperature: existing.temperature || "",
        bloodPressure: existing.bloodPressure || "",
        pulseRate: existing.pulseRate || "",
        respirationRate: existing.respirationRate || "",
        oxygenSaturation: existing.oxygenSaturation || "",
        weightKg: existing.weightKg || "",
        heightCm: existing.heightCm || "",
        bmi: existing.bmi || "",
        bmiClass: existing.bmiClass || "",
        urgency: existing.urgency || "Normal",
        status: existing.status || "Waiting for Doctor",
        painScore: existing.painScore || "",
        glucose: existing.glucose || "",
        allergies: existing.allergies || "",
        triageNotes: existing.triageNotes || "",
        nurseReport: existing.nurseReport || "",
        inpatientSummary: existing.inpatientSummary || "",
        outpatientSummary: existing.outpatientSummary || "",
        nursingPlan: existing.nursingPlan || "",
        medicationGiven: existing.medicationGiven || "",
        fluidChart: existing.fluidChart || "",
        admissionNotes: existing.admissionNotes || "",
        dischargeNotes: existing.dischargeNotes || "",
        sentToDoctor: existing.sentToDoctor || false,
      });
    } else {
      setTriageForm({
        temperature: "",
        bloodPressure: "",
        pulseRate: "",
        respirationRate: "",
        oxygenSaturation: "",
        weightKg: "",
        heightCm: "",
        bmi: "",
        bmiClass: "",
        urgency: "Normal",
        status: "Waiting for Doctor",
        painScore: "",
        glucose: "",
        allergies: patient?.allergies || "",
        triageNotes: "",
        nurseReport: "",
        inpatientSummary: "",
        outpatientSummary: "",
        nursingPlan: "",
        medicationGiven: "",
        fluidChart: "",
        admissionNotes: "",
        dischargeNotes: "",
        sentToDoctor: false,
      });
    }

    setTab("assessment");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setTriageForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearAssessment = () => {
    if (!selectedPatient) return;

    setTriageForm({
      temperature: "",
      bloodPressure: "",
      pulseRate: "",
      respirationRate: "",
      oxygenSaturation: "",
      weightKg: "",
      heightCm: "",
      bmi: "",
      bmiClass: "",
      urgency: "Normal",
      status: "Waiting for Doctor",
      painScore: "",
      glucose: "",
      allergies: selectedPatient?.allergies || "",
      triageNotes: "",
      nurseReport: "",
      inpatientSummary: "",
      outpatientSummary: "",
      nursingPlan: "",
      medicationGiven: "",
      fluidChart: "",
      admissionNotes: "",
      dischargeNotes: "",
      sentToDoctor: false,
    });
  };

  const saveAssessment = (sendToDoctor = false) => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    const record = {
      id: patientExistingNurseRecord?.id || uid("NR"),
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientPhone: selectedPatient.phone || "",
      patientType: selectedPatient.patientType || "Outpatient",
      temperature: triageForm.temperature,
      bloodPressure: triageForm.bloodPressure,
      pulseRate: triageForm.pulseRate,
      respirationRate: triageForm.respirationRate,
      oxygenSaturation: triageForm.oxygenSaturation,
      weightKg: triageForm.weightKg,
      heightCm: triageForm.heightCm,
      bmi: triageForm.bmi,
      bmiClass: triageForm.bmiClass,
      urgency: triageForm.urgency,
      status: sendToDoctor ? "Sent to Doctor" : triageForm.status,
      painScore: triageForm.painScore,
      glucose: triageForm.glucose,
      allergies: triageForm.allergies,
      triageNotes: triageForm.triageNotes,
      nurseReport: triageForm.nurseReport,
      inpatientSummary: triageForm.inpatientSummary,
      outpatientSummary: triageForm.outpatientSummary,
      nursingPlan: triageForm.nursingPlan,
      medicationGiven: triageForm.medicationGiven,
      fluidChart: triageForm.fluidChart,
      admissionNotes: triageForm.admissionNotes,
      dischargeNotes: triageForm.dischargeNotes,
      sentToDoctor: sendToDoctor ? true : triageForm.sentToDoctor,
      createdAt: patientExistingNurseRecord?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };

    setNurseNotes((prev) => {
      const exists = prev.some((n) => n.patientId === selectedPatient.id);
      if (exists) {
        return prev.map((n) => (n.patientId === selectedPatient.id ? record : n));
      }
      return [record, ...prev];
    });

    alert(sendToDoctor ? "Patient saved and sent to doctor ✅" : "Nurse notes saved ✅");
  };

  const renderQueue = () => (
    <div className="nurse-main">
      <div className="page-title">Patient Queue</div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Patients from Reception</div>
          <div className="summary-value">{patients.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Inpatients</div>
          <div className="summary-value">{inpatientsCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Outpatients</div>
          <div className="summary-value">{outpatientsCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Urgent Cases</div>
          <div className="summary-value">{urgentCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Reviewed Today</div>
          <div className="summary-value">{todaysCount}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Patients Registered from Reception</h3>
          <input
            className="nurse-input search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / phone / patient ID"
          />
        </div>

        <div className="table-wrap">
          <table className="nurse-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Last Visit</th>
                <th>Nurse Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const note = nurseNotes.find((n) => n.patientId === patient.id);
                return (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.fullName}</td>
                    <td>{patient.phone || "-"}</td>
                    <td>{patient.patientType || "Outpatient"}</td>
                    <td>{patient.lastVisit || "-"}</td>
                    <td>{note?.status || "Pending Nurse Review"}</td>
                    <td>
                      <button className="small-btn primary" onClick={() => selectPatient(patient)}>
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted-cell">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAssessment = () => (
    <div className="nurse-main">
      <div className="page-title">Nurse Assessment & Reporting</div>

      {!selectedPatient ? (
        <div className="empty-box">
          Select a patient from the queue first.
        </div>
      ) : (
        <>
          <div className="patient-banner">
            <div>
              <h2>{selectedPatient.fullName}</h2>
              <p>
                Patient ID: <b>{selectedPatient.id}</b> | Type:{" "}
                <b>{selectedPatient.patientType || "Outpatient"}</b> | Phone:{" "}
                <b>{selectedPatient.phone || "-"}</b>
              </p>
            </div>
            <div className="patient-banner-actions">
              <button className="nurse-btn" onClick={() => setTab("queue")}>
                Back to Queue
              </button>
              <button className="nurse-btn danger" onClick={clearAssessment}>
                Clear Form
              </button>
            </div>
          </div>

          <div className="assessment-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>Vitals</h3>
              </div>

              <div className="form-grid">
                <Field label="Temperature (°C)">
                  <input
                    className="nurse-input"
                    name="temperature"
                    value={triageForm.temperature}
                    onChange={handleChange}
                    placeholder="e.g 36.8"
                  />
                </Field>

                <Field label="Blood Pressure">
                  <input
                    className="nurse-input"
                    name="bloodPressure"
                    value={triageForm.bloodPressure}
                    onChange={handleChange}
                    placeholder="e.g 120/80"
                  />
                </Field>

                <Field label="Pulse Rate">
                  <input
                    className="nurse-input"
                    name="pulseRate"
                    value={triageForm.pulseRate}
                    onChange={handleChange}
                    placeholder="e.g 72"
                  />
                </Field>

                <Field label="Respiration Rate">
                  <input
                    className="nurse-input"
                    name="respirationRate"
                    value={triageForm.respirationRate}
                    onChange={handleChange}
                    placeholder="e.g 16"
                  />
                </Field>

                <Field label="Oxygen Saturation (%)">
                  <input
                    className="nurse-input"
                    name="oxygenSaturation"
                    value={triageForm.oxygenSaturation}
                    onChange={handleChange}
                    placeholder="e.g 98"
                  />
                </Field>

                <Field label="Pain Score /10">
                  <input
                    className="nurse-input"
                    name="painScore"
                    value={triageForm.painScore}
                    onChange={handleChange}
                    placeholder="e.g 4"
                  />
                </Field>

                <Field label="Random Blood Sugar">
                  <input
                    className="nurse-input"
                    name="glucose"
                    value={triageForm.glucose}
                    onChange={handleChange}
                    placeholder="e.g 6.2 mmol/L"
                  />
                </Field>

                <Field label="Weight (Kg)">
                  <input
                    className="nurse-input"
                    name="weightKg"
                    value={triageForm.weightKg}
                    onChange={handleChange}
                    placeholder="e.g 65"
                  />
                </Field>

                <Field label="Height (cm)">
                  <input
                    className="nurse-input"
                    name="heightCm"
                    value={triageForm.heightCm}
                    onChange={handleChange}
                    placeholder="e.g 170"
                  />
                </Field>

                <Field label="BMI">
                  <input
                    className="nurse-input"
                    name="bmi"
                    value={triageForm.bmi}
                    readOnly
                    placeholder="Auto calculated"
                  />
                </Field>

                <Field label="BMI Class">
                  <input
                    className="nurse-input"
                    name="bmiClass"
                    value={triageForm.bmiClass}
                    readOnly
                    placeholder="Auto calculated"
                  />
                </Field>

                <Field label="Urgency Level">
                  <select
                    className="nurse-input"
                    name="urgency"
                    value={triageForm.urgency}
                    onChange={handleChange}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </Field>

                <Field label="Current Status">
                  <select
                    className="nurse-input"
                    name="status"
                    value={triageForm.status}
                    onChange={handleChange}
                  >
                    <option value="Waiting for Doctor">Waiting for Doctor</option>
                    <option value="Under Nurse Review">Under Nurse Review</option>
                    <option value="Observation">Observation</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Ready for Doctor">Ready for Doctor</option>
                    <option value="Sent to Doctor">Sent to Doctor</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Nursing Notes</h3>
              </div>

              <div className="form-grid single-column">
                <Field label="Allergies">
                  <textarea
                    className="nurse-input"
                    name="allergies"
                    value={triageForm.allergies}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Drug / food / environmental allergies"
                  />
                </Field>

                <Field label="Triage Notes">
                  <textarea
                    className="nurse-input"
                    name="triageNotes"
                    value={triageForm.triageNotes}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Write triage observations, appearance, consciousness, complaints, symptoms..."
                  />
                </Field>

                <Field label="General Nurse Report">
                  <textarea
                    className="nurse-input"
                    name="nurseReport"
                    value={triageForm.nurseReport}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Write a professional nursing report for this patient..."
                  />
                </Field>

                <Field label="Nursing Plan">
                  <textarea
                    className="nurse-input"
                    name="nursingPlan"
                    value={triageForm.nursingPlan}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Monitoring plan, referrals, treatment support, reassessment plan..."
                  />
                </Field>

                <Field label="Medication / First Aid Given">
                  <textarea
                    className="nurse-input"
                    name="medicationGiven"
                    value={triageForm.medicationGiven}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Record medication, first aid, procedures, wound care, dressing..."
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="assessment-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>Outpatient Summary</h3>
              </div>

              <Field label="Outpatient Nursing Summary">
                <textarea
                  className="nurse-input"
                  name="outpatientSummary"
                  value={triageForm.outpatientSummary}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Short nursing summary for outpatient patient..."
                />
              </Field>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Inpatient Summary</h3>
              </div>

              <Field label="Inpatient Nursing Summary">
                <textarea
                  className="nurse-input"
                  name="inpatientSummary"
                  value={triageForm.inpatientSummary}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Detailed inpatient nursing summary, monitoring, fluid chart, progress..."
                />
              </Field>

              <Field label="Admission Notes">
                <textarea
                  className="nurse-input"
                  name="admissionNotes"
                  value={triageForm.admissionNotes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Admission observations and care notes..."
                />
              </Field>

              <Field label="Fluid / Intake Output Chart Notes">
                <textarea
                  className="nurse-input"
                  name="fluidChart"
                  value={triageForm.fluidChart}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Fluids, urine output, intake-output observations..."
                />
              </Field>

              <Field label="Discharge Notes">
                <textarea
                  className="nurse-input"
                  name="dischargeNotes"
                  value={triageForm.dischargeNotes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Discharge education, advice, return instructions..."
                />
              </Field>
            </div>
          </div>

          <div className="action-bar">
            <button className="nurse-btn primary" onClick={() => saveAssessment(false)}>
              Save Nurse Notes
            </button>
            <button className="nurse-btn success" onClick={() => saveAssessment(true)}>
              Save & Send to Doctor
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="nurse-main">
      <div className="page-title">Nurse Reports & Summaries</div>

      <div className="panel">
        <div className="panel-head">
          <h3>Saved Nursing Reports</h3>
        </div>

        <div className="table-wrap">
          <table className="nurse-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Patient</th>
                <th>Patient Type</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {nurseNotes.map((note) => (
                <tr key={note.id}>
                  <td>{note.id}</td>
                  <td>{note.patientName}</td>
                  <td>{note.patientType}</td>
                  <td>{note.urgency}</td>
                  <td>{note.status}</td>
                  <td>{new Date(note.updatedAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="small-btn primary"
                      onClick={() => {
                        const patient = patients.find((p) => p.id === note.patientId);
                        if (patient) {
                          selectPatient(patient);
                        }
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {nurseNotes.length === 0 && (
                <tr>
                  <td colSpan="7" className="muted-cell">
                    No nurse reports saved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ideas-panel">
        <h3>Ideas to improve Nurse Module</h3>
        <ul>
          <li>Add patient triage color system: green, yellow, red.</li>
          <li>Add automatic abnormal vitals warning.</li>
          <li>Add nurse shift handover notes.</li>
          <li>Add medication chart and administration timestamps.</li>
          <li>Add inpatient bed number and ward assignment.</li>
          <li>Add printable nursing report sheet.</li>
          <li>Add doctor acknowledgment after patient is sent.</li>
          <li>Add follow-up reminder for repeated vitals checks.</li>
        </ul>
      </div>
    </div>
  );

  const Header = () => (
    <div className="nurse-header">
      <div className="brand-box">
        <img src={logo} alt="Anka Hospital" className="brand-logo" />
        <div>
          <div className="brand-title">Anka Hospital</div>
          <div className="brand-subtitle">Nurse Desk</div>
        </div>
      </div>

      <div className="header-right">
        <div className="welcome-box">
          <div className="welcome-title">Welcome, Nurse</div>
          <div className="welcome-date">{todayText()}</div>
        </div>
        <button className="nurse-btn">Refresh</button>
        <button className="nurse-btn danger">Logout</button>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="nurse-sidebar">
      <div className="nav-title">Navigation</div>
      <div className={`nav-item ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
        👩‍⚕️ Patient Queue
      </div>
      <div
        className={`nav-item ${tab === "assessment" ? "active" : ""}`}
        onClick={() => setTab("assessment")}
      >
        🩺 Vitals & Assessment
      </div>
      <div
        className={`nav-item ${tab === "reports" ? "active" : ""}`}
        onClick={() => setTab("reports")}
      >
        📋 Reports & Summaries
      </div>

      <div className="sidebar-footnote">
        <p>
          This module receives patients from Reception, records vitals, writes nurse notes,
          and sends cases to the Doctor.
        </p>
      </div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div className="field-box">
      <label className="field-label">{label}</label>
      <input 
        className="nurse-input"
        name="temperature"
        value={triageForm.temperature}
        onChange={handleChange}
      />
      {children}
    </div>
  );

  return (
    <div className="nurse-page">
      <Header />

      <div className="nurse-layout">
        <Sidebar />

        <div className="nurse-content">
          {tab === "queue" && renderQueue()}
          {tab === "assessment" && renderAssessment()}
          {tab === "reports" && renderReports()}
        </div>
      </div>
    </div>
  );
}