import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Doctor.css";
import logo from "../../assets/logo.png";

const LS = {
  patients: "anka_patients",
  nurseNotes: "anka_nurse_notes",
  doctorNotes: "anka_doctor_notes",
  labResults: "anka_lab_results",
  radiologyResults: "anka_radiology_results",
  ultrasoundResults: "anka_ultrasound_results",
  prescriptions: "anka_prescriptions",
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

const uid = (prefix = "DOC") =>
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

const KES = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const MEDICINE_SUGGESTIONS = [
  "Paracetamol 500mg",
  "Ibuprofen 400mg",
  "Amoxicillin 500mg",
  "Ciprofloxacin 500mg",
  "Metronidazole 400mg",
  "Omeprazole 20mg",
  "Cetirizine 10mg",
  "Salbutamol Inhaler",
  "Benylin Cough Syrup",
  "Vitamin C 500mg",
  "ORS Sachets",
  "Folic Acid",
  "Ferrous Sulphate",
  "Coartem",
  "Ceftriaxone 1g",
  "Normal Saline 500ml",
  "Amlodipine 5mg",
  "Metformin 500mg",
  "Clotrimazole Cream",
  "Eye Drops Chloramphenicol",
];

const emptyDoctorForm = {
  complaintHistory: "",
  clinicalFindings: "",
  provisionalDiagnosis: "",
  finalDiagnosis: "",
  treatmentPlan: "",
  doctorReport: "",
  outpatientSummary: "",
  inpatientSummary: "",
  admissionPlan: "",
  dischargeNotes: "",
  followUpPlan: "",
  doctorInstructions: "",
  reviewStatus: "Under Review",
  admitPatient: false,
  referLab: false,
  referRadiology: false,
  referUltrasound: false,
  doctorName: "Dr Felix",
  consultationDate: new Date().toISOString().split("T")[0],
};

const emptyPrescriptionLine = {
  id: "",
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  route: "",
  notes: "",
};

export default function DoctorDashboard() {
  const printRef = useRef(null);

  const [tab, setTab] = useState("queue");
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [patients, setPatients] = useState(() => loadLS(LS.patients, []));
  const [nurseNotes, setNurseNotes] = useState(() => loadLS(LS.nurseNotes, []));
  const [doctorNotes, setDoctorNotes] = useState(() => loadLS(LS.doctorNotes, []));
  const [labResults, setLabResults] = useState(() => loadLS(LS.labResults, []));
  const [radiologyResults, setRadiologyResults] = useState(() => loadLS(LS.radiologyResults, []));
  const [ultrasoundResults, setUltrasoundResults] = useState(() => loadLS(LS.ultrasoundResults, []));
  const [prescriptions, setPrescriptions] = useState(() => loadLS(LS.prescriptions, []));

  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [prescriptionLines, setPrescriptionLines] = useState([
    { ...emptyPrescriptionLine, id: uid("RXLINE") },
  ]);

  const [selectedPrintRecord, setSelectedPrintRecord] = useState(null);

  useEffect(() => saveLS(LS.doctorNotes, doctorNotes), [doctorNotes]);
  useEffect(() => saveLS(LS.prescriptions, prescriptions), [prescriptions]);

useEffect(() => {
  setPatients(loadLS(LS.patients, []));
  setNurseNotes(loadLS(LS.nurseNotes, []));
  setLabResults(loadLS(LS.labResults, []));
  setRadiologyResults(loadLS(LS.radiologyResults, []));
  setUltrasoundResults(loadLS(LS.ultrasoundResults, []));
  setDoctorNotes(loadLS(LS.doctorNotes, []));
  setPrescriptions(loadLS(LS.prescriptions, []));
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

  const selectedNurseNote = useMemo(() => {
    if (!selectedPatientId) return null;
    return nurseNotes.find((n) => n.patientId === selectedPatientId) || null;
  }, [nurseNotes, selectedPatientId]);

  const selectedDoctorNote = useMemo(() => {
    if (!selectedPatientId) return null;
    return doctorNotes.find((d) => d.patientId === selectedPatientId) || null;
  }, [doctorNotes, selectedPatientId]);

  const selectedPrescription = useMemo(() => {
    if (!selectedPatientId) return null;
    return prescriptions.find((p) => p.patientId === selectedPatientId) || null;
  }, [prescriptions, selectedPatientId]);

  const patientLabResults = useMemo(() => {
    if (!selectedPatientId) return [];
    return labResults.filter((r) => r.patientId === selectedPatientId);
  }, [labResults, selectedPatientId]);

  const patientRadiologyResults = useMemo(() => {
    if (!selectedPatientId) return [];
    return radiologyResults.filter((r) => r.patientId === selectedPatientId);
  }, [radiologyResults, selectedPatientId]);

  const patientUltrasoundResults = useMemo(() => {
    if (!selectedPatientId) return [];
    return ultrasoundResults.filter((r) => r.patientId === selectedPatientId);
  }, [ultrasoundResults, selectedPatientId]);

  const awaitingDoctorCount = useMemo(() => {
    return nurseNotes.filter(
      (n) => n.status === "Sent to Doctor" || n.status === "Ready for Doctor"
    ).length;
  }, [nurseNotes]);

  const reviewedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return doctorNotes.filter((d) => String(d.updatedAt || "").startsWith(today)).length;
  }, [doctorNotes]);

  const inpatientCount = useMemo(() => {
    return patients.filter((p) => String(p.patientType || "").toLowerCase() === "inpatient")
      .length;
  }, [patients]);

  const outpatientCount = useMemo(() => {
    return patients.filter((p) => String(p.patientType || "").toLowerCase() === "outpatient")
      .length;
  }, [patients]);

  const openPatient = (patient) => {
    setSelectedPatientId(patient.id);

    const existingDoctor = doctorNotes.find((d) => d.patientId === patient.id);
    const existingRx = prescriptions.find((p) => p.patientId === patient.id);

    if (existingDoctor) {
      setDoctorForm({
        complaintHistory: existingDoctor.complaintHistory || "",
        clinicalFindings: existingDoctor.clinicalFindings || "",
        provisionalDiagnosis: existingDoctor.provisionalDiagnosis || "",
        finalDiagnosis: existingDoctor.finalDiagnosis || "",
        treatmentPlan: existingDoctor.treatmentPlan || "",
        doctorReport: existingDoctor.doctorReport || "",
        outpatientSummary: existingDoctor.outpatientSummary || "",
        inpatientSummary: existingDoctor.inpatientSummary || "",
        admissionPlan: existingDoctor.admissionPlan || "",
        dischargeNotes: existingDoctor.dischargeNotes || "",
        followUpPlan: existingDoctor.followUpPlan || "",
        doctorInstructions: existingDoctor.doctorInstructions || "",
        reviewStatus: existingDoctor.reviewStatus || "Under Review",
        admitPatient: existingDoctor.admitPatient || false,
        referLab: existingDoctor.referLab || false,
        referRadiology: existingDoctor.referRadiology || false,
        referUltrasound: existingDoctor.referUltrasound || false,
        doctorName: existingDoctor.doctorName || "Dr Felix",
        consultationDate:
          existingDoctor.consultationDate || new Date().toISOString().split("T")[0],
      });
    } else {
      setDoctorForm({
        ...emptyDoctorForm,
        doctorName: "Dr Felix",
        consultationDate: new Date().toISOString().split("T")[0],
      });
    }

    if (existingRx && existingRx.items?.length) {
      setPrescriptionLines(
        existingRx.items.map((item) => ({
          id: item.id || uid("RXLINE"),
          medicineName: item.medicineName || "",
          dosage: item.dosage || "",
          frequency: item.frequency || "",
          duration: item.duration || "",
          route: item.route || "",
          notes: item.notes || "",
        }))
      );
    } else {
      setPrescriptionLines([{ ...emptyPrescriptionLine, id: uid("RXLINE") }]);
    }

    setTab("consultation");
  };

  const handleDoctorFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDoctorForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addPrescriptionLine = () => {
    setPrescriptionLines((prev) => [
      ...prev,
      { ...emptyPrescriptionLine, id: uid("RXLINE") },
    ]);
  };

  const updatePrescriptionLine = (id, field, value) => {
    setPrescriptionLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const removePrescriptionLine = (id) => {
    setPrescriptionLines((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((line) => line.id !== id);
    });
  };

  const clearConsultation = () => {
    setDoctorForm({
      ...emptyDoctorForm,
      doctorName: "Dr Felix",
      consultationDate: new Date().toISOString().split("T")[0],
    });
    setPrescriptionLines([{ ...emptyPrescriptionLine, id: uid("RXLINE") }]);
  };

  const saveDoctorReport = (preparePrint = false) => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    if (!doctorForm.finalDiagnosis.trim() && !doctorForm.doctorReport.trim()) {
      alert("Please enter at least diagnosis or doctor report.");
      return;
    }

    const record = {
      id: selectedDoctorNote?.id || uid("DR"),
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientPhone: selectedPatient.phone || "",
      patientType: selectedPatient.patientType || "Outpatient",
      complaintHistory: doctorForm.complaintHistory,
      clinicalFindings: doctorForm.clinicalFindings,
      provisionalDiagnosis: doctorForm.provisionalDiagnosis,
      finalDiagnosis: doctorForm.finalDiagnosis,
      treatmentPlan: doctorForm.treatmentPlan,
      doctorReport: doctorForm.doctorReport,
      outpatientSummary: doctorForm.outpatientSummary,
      inpatientSummary: doctorForm.inpatientSummary,
      admissionPlan: doctorForm.admissionPlan,
      dischargeNotes: doctorForm.dischargeNotes,
      followUpPlan: doctorForm.followUpPlan,
      doctorInstructions: doctorForm.doctorInstructions,
      reviewStatus: doctorForm.reviewStatus,
      admitPatient: doctorForm.admitPatient,
      referLab: doctorForm.referLab,
      referRadiology: doctorForm.referRadiology,
      referUltrasound: doctorForm.referUltrasound,
      doctorName: doctorForm.doctorName,
      consultationDate: doctorForm.consultationDate,
      createdAt: selectedDoctorNote?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };

    const prescriptionRecord = {
      id: selectedPrescription?.id || uid("RX"),
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientType: selectedPatient.patientType || "Outpatient",
      doctorName: doctorForm.doctorName,
      date: doctorForm.consultationDate,
      items: prescriptionLines.filter((line) => line.medicineName.trim()),
      createdAt: selectedPrescription?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };

    setDoctorNotes((prev) => {
      const exists = prev.some((d) => d.patientId === selectedPatient.id);
      if (exists) {
        return prev.map((d) => (d.patientId === selectedPatient.id ? record : d));
      }
      return [record, ...prev];
    });

    setPrescriptions((prev) => {
      const exists = prev.some((p) => p.patientId === selectedPatient.id);
      if (exists) {
        return prev.map((p) => (p.patientId === selectedPatient.id ? prescriptionRecord : p));
      }
      return [prescriptionRecord, ...prev];
    });

    if (preparePrint) {
      setSelectedPrintRecord({
        patient: selectedPatient,
        nurse: selectedNurseNote,
        doctor: record,
        prescription: prescriptionRecord,
        lab: patientLabResults,
        radiology: patientRadiologyResults,
        ultrasound: patientUltrasoundResults,
      });
      setTab("print");
    }

    alert(preparePrint ? "Doctor report saved and prepared for print ✅" : "Doctor report saved ✅");
  };

  const printReport = () => {
    window.print();
  };

  const Header = () => (
    <div className="doc-header">
      <div className="doc-brand">
        <img src={logo} alt="Anka Hospital" className="doc-logo" />
        <div>
          <div className="doc-title">Anka Hospital</div>
          <div className="doc-sub">Doctor Desk</div>
        </div>
      </div>

      <div className="doc-header-right">
        <div className="doc-welcome">
          <div className="doc-welcome-title">Welcome, Doctor</div>
          <div className="doc-welcome-date">{todayText()}</div>
        </div>
        <button className="doc-btn">Refresh</button>
        <button className="doc-btn danger">Logout</button>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className="doc-sidebar">
      <div className="doc-nav-title">Navigation</div>

      <div className={`doc-nav-item ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
        🧑‍⚕️ Patient Queue
      </div>

      <div
        className={`doc-nav-item ${tab === "consultation" ? "active" : ""}`}
        onClick={() => setTab("consultation")}
      >
        📋 Consultation & Report
      </div>

      <div
        className={`doc-nav-item ${tab === "print" ? "active" : ""}`}
        onClick={() => setTab("print")}
      >
        🖨️ Print Report
      </div>

      <div className="doc-side-note">
        <p>
          This module lets the doctor receive patient details from Reception, review nurse notes,
          read lab / ultrasound / radiology reports, write diagnosis, and create prescription.
        </p>
      </div>
    </div>
  );

  const Panel = ({ title, right, children }) => (
    <div className="doc-panel">
      <div className="doc-panel-head">
        <h3>{title}</h3>
        <div>{right}</div>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div className="doc-field">
      <label className="doc-label">{label}</label>
      {children}
    </div>
  );

  const SummaryCard = ({ label, value }) => (
    <div className="doc-summary-card">
      <div className="doc-summary-label">{label}</div>
      <div className="doc-summary-value">{value}</div>
    </div>
  );

  const renderQueue = () => (
    <div className="doc-main">
      <div className="doc-page-title">Doctor Queue</div>

      <div className="doc-summary-grid">
        <SummaryCard label="Patients from Reception" value={patients.length} />
        <SummaryCard label="Awaiting Doctor" value={awaitingDoctorCount} />
        <SummaryCard label="Reviewed Today" value={reviewedTodayCount} />
        <SummaryCard label="Inpatients" value={inpatientCount} />
        <SummaryCard label="Outpatients" value={outpatientCount} />
      </div>

      <Panel
        title="Patient List"
        right={
          <input
            className="doc-input search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient by name / phone / ID"
          />
        }
      >
        <div className="table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Nurse Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const nurse = nurseNotes.find((n) => n.patientId === patient.id);
                return (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.fullName}</td>
                    <td>{patient.phone || "-"}</td>
                    <td>{patient.patientType || "Outpatient"}</td>
                    <td>{nurse?.status || "Pending Nurse Review"}</td>
                    <td>
                      <button className="small-btn primary" onClick={() => openPatient(patient)}>
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted-cell">
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

  const renderConsultation = () => (
    <div className="doc-main">
      <div className="doc-page-title">Consultation & Doctor Report</div>

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
              <button className="doc-btn" onClick={() => setTab("queue")}>
                Back to Queue
              </button>
              <button className="doc-btn danger" onClick={clearConsultation}>
                Clear Form
              </button>
            </div>
          </div>

          <div className="doc-two-grid">
            <Panel title="Patient Details from Reception">
              <div className="info-grid">
                <Info label="Full Name" value={selectedPatient.fullName} />
                <Info label="Phone" value={selectedPatient.phone || "-"} />
                <Info label="ID Number" value={selectedPatient.idNumber || "-"} />
                <Info label="DOB" value={selectedPatient.dob || "-"} />
                <Info label="Gender" value={selectedPatient.gender || "-"} />
                <Info label="Blood Group" value={selectedPatient.bloodGroup || "-"} />
                <Info label="Address" value={selectedPatient.address || "-"} />
                <Info label="Next of Kin" value={selectedPatient.nextOfKinName || "-"} />
              </div>
            </Panel>

            <Panel title="Nurse Assessment">
              {selectedNurseNote ? (
                <div className="notes-box">
                  <p><strong>Vitals:</strong> Temp {selectedNurseNote.temperature || "-"}°C, BP {selectedNurseNote.bloodPressure || "-"}, Pulse {selectedNurseNote.pulseRate || "-"}, RR {selectedNurseNote.respirationRate || "-"}, SPO2 {selectedNurseNote.oxygenSaturation || "-"}</p>
                  <p><strong>BMI:</strong> {selectedNurseNote.bmi || "-"} ({selectedNurseNote.bmiClass || "-"})</p>
                  <p><strong>Urgency:</strong> {selectedNurseNote.urgency || "-"}</p>
                  <p><strong>Triage Notes:</strong> {selectedNurseNote.triageNotes || "-"}</p>
                  <p><strong>Nurse Report:</strong> {selectedNurseNote.nurseReport || "-"}</p>
                  <p><strong>Outpatient Summary:</strong> {selectedNurseNote.outpatientSummary || "-"}</p>
                  <p><strong>Inpatient Summary:</strong> {selectedNurseNote.inpatientSummary || "-"}</p>
                </div>
              ) : (
                <div className="empty-box">No nurse report yet.</div>
              )}
            </Panel>
          </div>

          <div className="doc-two-grid">
            <Panel title="Laboratory Reports">
              {patientLabResults.length > 0 ? (
                patientLabResults.map((item) => (
                  <div key={item.id || uid("LABV")} className="report-card">
                    <p><strong>Test:</strong> {item.testName || item.name || "-"}</p>
                    <p><strong>Result:</strong> {item.result || item.findings || "-"}</p>
                    <p><strong>Remarks:</strong> {item.remarks || "-"}</p>
                  </div>
                ))
              ) : (
                <div className="empty-box">No lab report found.</div>
              )}
            </Panel>

            <Panel title="Radiology / Ultrasound Reports">
              {patientRadiologyResults.length === 0 && patientUltrasoundResults.length === 0 ? (
                <div className="empty-box">No radiology or ultrasound reports found.</div>
              ) : (
                <>
                  {patientRadiologyResults.map((item) => (
                    <div key={item.id || uid("RADV")} className="report-card">
                      <p><strong>Radiology:</strong> {item.testName || item.name || "-"}</p>
                      <p><strong>Report:</strong> {item.result || item.findings || "-"}</p>
                      <p><strong>Impression:</strong> {item.impression || item.remarks || "-"}</p>
                    </div>
                  ))}
                  {patientUltrasoundResults.map((item) => (
                    <div key={item.id || uid("USV")} className="report-card">
                      <p><strong>Ultrasound:</strong> {item.testName || item.name || "-"}</p>
                      <p><strong>Report:</strong> {item.result || item.findings || "-"}</p>
                      <p><strong>Impression:</strong> {item.impression || item.remarks || "-"}</p>
                    </div>
                  ))}
                </>
              )}
            </Panel>
          </div>

          <Panel title="Doctor Clinical Report">
            <div className="doc-form-grid">
              <Field label="Doctor Name">
                <select
                  className="doc-input"
                  name="doctorName"
                  value={doctorForm.doctorName}
                  onChange={handleDoctorFormChange}
                >
                  <option value="Dr Felix">Dr Felix</option>
                  <option value="Dr Ahmed">Dr Ahmed</option>
                </select>
              </Field>

              <Field label="Consultation Date">
                <input
                  className="doc-input"
                  type="date"
                  name="consultationDate"
                  value={doctorForm.consultationDate}
                  onChange={handleDoctorFormChange}
                />
              </Field>

              <Field label="Review Status">
                <select
                  className="doc-input"
                  name="reviewStatus"
                  value={doctorForm.reviewStatus}
                  onChange={handleDoctorFormChange}
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Treatment Started">Treatment Started</option>
                  <option value="Admitted">Admitted</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                </select>
              </Field>

              <Field label="Presenting Complaint / History">
                <textarea
                  className="doc-input"
                  name="complaintHistory"
                  value={doctorForm.complaintHistory}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="Patient complaint, history of presenting illness..."
                />
              </Field>

              <Field label="Clinical Findings / Examination">
                <textarea
                  className="doc-input"
                  name="clinicalFindings"
                  value={doctorForm.clinicalFindings}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="General examination, system review, observations..."
                />
              </Field>

              <Field label="Provisional Diagnosis">
                <textarea
                  className="doc-input"
                  name="provisionalDiagnosis"
                  value={doctorForm.provisionalDiagnosis}
                  onChange={handleDoctorFormChange}
                  rows="3"
                  placeholder="Provisional diagnosis..."
                />
              </Field>

              <Field label="Final Diagnosis">
                <textarea
                  className="doc-input"
                  name="finalDiagnosis"
                  value={doctorForm.finalDiagnosis}
                  onChange={handleDoctorFormChange}
                  rows="3"
                  placeholder="Final diagnosis..."
                />
              </Field>

              <Field label="Treatment Plan">
                <textarea
                  className="doc-input"
                  name="treatmentPlan"
                  value={doctorForm.treatmentPlan}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="Treatment plan and management..."
                />
              </Field>

              <Field label="Doctor Report">
                <textarea
                  className="doc-input"
                  name="doctorReport"
                  value={doctorForm.doctorReport}
                  onChange={handleDoctorFormChange}
                  rows="6"
                  placeholder="Write the main structured doctor report here..."
                />
              </Field>

              <Field label="Outpatient Summary">
                <textarea
                  className="doc-input"
                  name="outpatientSummary"
                  value={doctorForm.outpatientSummary}
                  onChange={handleDoctorFormChange}
                  rows="5"
                  placeholder="Summary for outpatient case..."
                />
              </Field>

              <Field label="Inpatient Summary">
                <textarea
                  className="doc-input"
                  name="inpatientSummary"
                  value={doctorForm.inpatientSummary}
                  onChange={handleDoctorFormChange}
                  rows="5"
                  placeholder="Summary for inpatient case..."
                />
              </Field>

              <Field label="Admission Plan">
                <textarea
                  className="doc-input"
                  name="admissionPlan"
                  value={doctorForm.admissionPlan}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="Admission instructions, ward plan, monitoring..."
                />
              </Field>

              <Field label="Discharge Notes">
                <textarea
                  className="doc-input"
                  name="dischargeNotes"
                  value={doctorForm.dischargeNotes}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="Discharge notes, education, review instructions..."
                />
              </Field>

              <Field label="Follow-Up Plan">
                <textarea
                  className="doc-input"
                  name="followUpPlan"
                  value={doctorForm.followUpPlan}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="Follow-up date, tests, review clinic..."
                />
              </Field>

              <Field label="Doctor Instructions">
                <textarea
                  className="doc-input"
                  name="doctorInstructions"
                  value={doctorForm.doctorInstructions}
                  onChange={handleDoctorFormChange}
                  rows="4"
                  placeholder="Instructions to nurse / lab / radiology / pharmacy..."
                />
              </Field>
            </div>

            <div className="checkbox-row">
              <label><input type="checkbox" name="admitPatient" checked={doctorForm.admitPatient} onChange={handleDoctorFormChange} /> Admit Patient</label>
              <label><input type="checkbox" name="referLab" checked={doctorForm.referLab} onChange={handleDoctorFormChange} /> Refer to Lab</label>
              <label><input type="checkbox" name="referRadiology" checked={doctorForm.referRadiology} onChange={handleDoctorFormChange} /> Refer to Radiology</label>
              <label><input type="checkbox" name="referUltrasound" checked={doctorForm.referUltrasound} onChange={handleDoctorFormChange} /> Refer to Ultrasound</label>
            </div>
          </Panel>

          <Panel
            title="Prescription"
            right={
              <button className="doc-btn primary" onClick={addPrescriptionLine}>
                + Add Medicine
              </button>
            }
          >
            {prescriptionLines.map((line, index) => (
              <div key={line.id} className="rx-line">
                <Field label={`Medicine ${index + 1}`}>
                  <input
                    className="doc-input"
                    list="medicine-suggestions"
                    value={line.medicineName}
                    onChange={(e) => updatePrescriptionLine(line.id, "medicineName", e.target.value)}
                    placeholder="Medicine name"
                  />
                </Field>

                <Field label="Dosage">
                  <input
                    className="doc-input"
                    value={line.dosage}
                    onChange={(e) => updatePrescriptionLine(line.id, "dosage", e.target.value)}
                    placeholder="e.g 500mg"
                  />
                </Field>

                <Field label="Frequency">
                  <input
                    className="doc-input"
                    value={line.frequency}
                    onChange={(e) => updatePrescriptionLine(line.id, "frequency", e.target.value)}
                    placeholder="e.g 1 x 3 daily"
                  />
                </Field>

                <Field label="Duration">
                  <input
                    className="doc-input"
                    value={line.duration}
                    onChange={(e) => updatePrescriptionLine(line.id, "duration", e.target.value)}
                    placeholder="e.g 5 days"
                  />
                </Field>

                <Field label="Route">
                  <input
                    className="doc-input"
                    value={line.route}
                    onChange={(e) => updatePrescriptionLine(line.id, "route", e.target.value)}
                    placeholder="Oral / IV / IM / Topical"
                  />
                </Field>

                <Field label="Notes">
                  <input
                    className="doc-input"
                    value={line.notes}
                    onChange={(e) => updatePrescriptionLine(line.id, "notes", e.target.value)}
                    placeholder="Special instructions"
                  />
                </Field>

                <div className="rx-remove-wrap">
                  <button className="small-btn danger" onClick={() => removePrescriptionLine(line.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <datalist id="medicine-suggestions">
              {MEDICINE_SUGGESTIONS.map((med) => (
                <option key={med} value={med} />
              ))}
            </datalist>
          </Panel>

          <div className="action-bar">
            <button className="doc-btn primary" onClick={() => saveDoctorReport(false)}>
              Save Doctor Report
            </button>
            <button className="doc-btn success" onClick={() => saveDoctorReport(true)}>
              Save & Prepare Print
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderPrint = () => (
    <div className="doc-main">
      <div className="doc-page-title">Print Structured Doctor Report</div>

      {!selectedPrintRecord ? (
        <div className="empty-box">
          Save a doctor report first, then prepare print.
        </div>
      ) : (
        <>
          <div className="action-bar no-print">
            <button className="doc-btn" onClick={() => setTab("consultation")}>
              Back to Consultation
            </button>
            <button className="doc-btn success" onClick={printReport}>
              Print Report
            </button>
          </div>

          <div className="print-sheet print-area" ref={printRef}>
            <div className="print-head">
              <div className="print-brand">
                <img src={logo} alt="Anka Hospital Logo" className="print-logo" />
                <div>
                  <div className="print-title">ANKA HOSPITAL</div>
                  <div className="print-subtitle">Doctor Clinical Report & Prescription</div>
                </div>
              </div>
              <div className="print-meta">
                <div><strong>Date:</strong> {selectedPrintRecord.doctor.consultationDate}</div>
                <div><strong>Doctor:</strong> {selectedPrintRecord.doctor.doctorName}</div>
              </div>
            </div>

            <hr />

            <section className="print-section">
              <h3>Patient Information</h3>
              <div className="print-grid">
                <div><strong>Name:</strong> {selectedPrintRecord.patient.fullName}</div>
                <div><strong>Patient ID:</strong> {selectedPrintRecord.patient.id}</div>
                <div><strong>Phone:</strong> {selectedPrintRecord.patient.phone || "-"}</div>
                <div><strong>Type:</strong> {selectedPrintRecord.patient.patientType || "Outpatient"}</div>
                <div><strong>Gender:</strong> {selectedPrintRecord.patient.gender || "-"}</div>
                <div><strong>DOB:</strong> {selectedPrintRecord.patient.dob || "-"}</div>
              </div>
            </section>

            <section className="print-section">
              <h3>Nurse Report Summary</h3>
              {selectedPrintRecord.nurse ? (
                <>
                  <p><strong>Vitals:</strong> Temp {selectedPrintRecord.nurse.temperature || "-"}°C, BP {selectedPrintRecord.nurse.bloodPressure || "-"}, Pulse {selectedPrintRecord.nurse.pulseRate || "-"}, RR {selectedPrintRecord.nurse.respirationRate || "-"}, SPO2 {selectedPrintRecord.nurse.oxygenSaturation || "-"}</p>
                  <p><strong>Triage Notes:</strong> {selectedPrintRecord.nurse.triageNotes || "-"}</p>
                  <p><strong>Nurse Report:</strong> {selectedPrintRecord.nurse.nurseReport || "-"}</p>
                </>
              ) : (
                <p>No nurse report available.</p>
              )}
            </section>

            <section className="print-section">
              <h3>Lab / Radiology / Ultrasound Reports</h3>
              {selectedPrintRecord.lab.length === 0 &&
              selectedPrintRecord.radiology.length === 0 &&
              selectedPrintRecord.ultrasound.length === 0 ? (
                <p>No reports available.</p>
              ) : (
                <>
                  {selectedPrintRecord.lab.map((item, index) => (
                    <p key={`lab-${index}`}><strong>Lab:</strong> {item.testName || item.name || "-"} — {item.result || item.findings || "-"}</p>
                  ))}
                  {selectedPrintRecord.radiology.map((item, index) => (
                    <p key={`rad-${index}`}><strong>Radiology:</strong> {item.testName || item.name || "-"} — {item.result || item.findings || "-"}</p>
                  ))}
                  {selectedPrintRecord.ultrasound.map((item, index) => (
                    <p key={`us-${index}`}><strong>Ultrasound:</strong> {item.testName || item.name || "-"} — {item.result || item.findings || "-"}</p>
                  ))}
                </>
              )}
            </section>

            <section className="print-section">
              <h3>Doctor Clinical Report</h3>
              <p><strong>Complaint / History:</strong> {selectedPrintRecord.doctor.complaintHistory || "-"}</p>
              <p><strong>Clinical Findings:</strong> {selectedPrintRecord.doctor.clinicalFindings || "-"}</p>
              <p><strong>Provisional Diagnosis:</strong> {selectedPrintRecord.doctor.provisionalDiagnosis || "-"}</p>
              <p><strong>Final Diagnosis:</strong> {selectedPrintRecord.doctor.finalDiagnosis || "-"}</p>
              <p><strong>Treatment Plan:</strong> {selectedPrintRecord.doctor.treatmentPlan || "-"}</p>
              <p><strong>Doctor Report:</strong> {selectedPrintRecord.doctor.doctorReport || "-"}</p>
              <p><strong>Outpatient Summary:</strong> {selectedPrintRecord.doctor.outpatientSummary || "-"}</p>
              <p><strong>Inpatient Summary:</strong> {selectedPrintRecord.doctor.inpatientSummary || "-"}</p>
              <p><strong>Admission Plan:</strong> {selectedPrintRecord.doctor.admissionPlan || "-"}</p>
              <p><strong>Discharge Notes:</strong> {selectedPrintRecord.doctor.dischargeNotes || "-"}</p>
              <p><strong>Follow-Up Plan:</strong> {selectedPrintRecord.doctor.followUpPlan || "-"}</p>
              <p><strong>Doctor Instructions:</strong> {selectedPrintRecord.doctor.doctorInstructions || "-"}</p>
            </section>

            <section className="print-section">
              <h3>Prescription</h3>
              {selectedPrintRecord.prescription?.items?.length ? (
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Route</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrintRecord.prescription.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.medicineName}</td>
                        <td>{item.dosage}</td>
                        <td>{item.frequency}</td>
                        <td>{item.duration}</td>
                        <td>{item.route}</td>
                        <td>{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No prescription added.</p>
              )}
            </section>

            <section className="print-footer">
              <div>Doctor Signature: ________________________</div>
              <div>Thank you for choosing Anka Hospital.</div>
            </section>
          </div>
        </>
      )}
    </div>
  );

  const Info = ({ label, value }) => (
    <div className="info-card">
      <div className="info-label">{label}</div>
      <div className="info-value">{String(value ?? "-")}</div>
    </div>
  );

  return (
    <div className="doc-page">
      <Header />

      <div className="doc-layout">
        <Sidebar />

        <div className="doc-content">
          {tab === "queue" && renderQueue()}
          {tab === "consultation" && renderConsultation()}
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