import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Radiology.css";
import logo from "../../assets/logo.png";

const STORAGE_KEYS = {
  patients: "anka_patients",
  radiologyReports: "anka_radiology_reports",
  doctorFeed: "anka_doctor_reports",
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

const uid = (prefix = "RAD") =>
  `${prefix}-${Math.random().toString(16).slice(2, 8).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const TEST_OPTIONS = [
  "X-Ray Chest",
  "X-Ray Abdomen",
  "X-Ray Pelvis",
  "X-Ray Spine",
  "X-Ray Knee",
  "X-Ray Wrist",
  "Ultrasound Abdomen",
  "Ultrasound Pelvis",
  "Ultrasound Obstetric",
  "Ultrasound KUB",
  "CT Scan Head",
  "CT Scan Chest",
  "MRI Brain",
  "MRI Spine",
  "Doppler Ultrasound",
];

const AUTO_TEMPLATES = {
  "X-Ray Chest": {
    findings:
      "Cardiomediastinal silhouette is within normal limits. No focal air-space consolidation. No pleural effusion or pneumothorax. Visualized bony thorax shows no acute abnormality.",
    impression: "No acute cardiopulmonary abnormality on this chest radiograph.",
  },
  "X-Ray Abdomen": {
    findings:
      "Bowel gas pattern is non-obstructive. No abnormal calcifications identified. No evidence of free intraperitoneal air. Visualized osseous structures show no acute abnormality.",
    impression: "Non-obstructive abdominal radiographic appearance with no acute abnormality seen.",
  },
  "X-Ray Pelvis": {
    findings:
      "Pelvic ring is intact. Hip joints are aligned. No acute fracture or dislocation identified on this examination.",
    impression: "No acute osseous abnormality identified on pelvic radiograph.",
  },
  "X-Ray Spine": {
    findings:
      "Alignment is maintained. Vertebral body heights are preserved. No acute compression deformity identified. Intervertebral disc spaces appear maintained.",
    impression: "No acute radiographic abnormality of the spine seen on this examination.",
  },
  "X-Ray Knee": {
    findings:
      "Joint alignment is preserved. No acute fracture or dislocation identified. No obvious joint effusion seen on this view.",
    impression: "No acute osseous abnormality of the knee on this radiograph.",
  },
  "X-Ray Wrist": {
    findings:
      "Carpal alignment is preserved. No acute fracture or dislocation identified on the submitted views.",
    impression: "No acute osseous abnormality of the wrist on this radiograph.",
  },
  "Ultrasound Abdomen": {
    findings:
      "Liver is normal in size and echotexture. Gallbladder is unremarkable with no calculi seen. Pancreas is grossly unremarkable. Spleen is normal in size. Both kidneys are normal in size and cortical echogenicity with no hydronephrosis.",
    impression: "Unremarkable abdominal ultrasound examination.",
  },
  "Ultrasound Pelvis": {
    findings:
      "Urinary bladder is adequately distended. Uterus is normal in size and echotexture. No adnexal mass seen. No free pelvic fluid identified.",
    impression: "No significant sonographic abnormality detected on pelvic ultrasound.",
  },
  "Ultrasound Obstetric": {
    findings:
      "Single intrauterine gestation is identified. Fetal cardiac activity is present. Placenta location and amniotic fluid appear within expected limits for gestational age.",
    impression: "Single live intrauterine pregnancy. Correlate gestational age clinically.",
  },
  "Ultrasound KUB": {
    findings:
      "Both kidneys are normal in size and echogenicity. No hydronephrosis or renal calculus identified sonographically. Urinary bladder appears unremarkable.",
    impression: "No sonographic evidence of hydronephrosis or obvious renal calculus.",
  },
  "CT Scan Head": {
    findings:
      "No acute intracranial hemorrhage. No mass effect or midline shift. Ventricular system is normal in size. Gray-white matter differentiation is preserved.",
    impression: "No acute intracranial abnormality on CT head.",
  },
  "CT Scan Chest": {
    findings:
      "No focal lung consolidation. No pleural effusion or pneumothorax. Mediastinal structures are unremarkable on this examination.",
    impression: "No acute intrathoracic abnormality detected on CT chest.",
  },
  "MRI Brain": {
    findings:
      "No diffusion restriction. No acute intracranial hemorrhage. Ventricles and sulci are within normal limits. No focal mass lesion identified on this study.",
    impression: "No acute intracranial abnormality on MRI brain.",
  },
  "MRI Spine": {
    findings:
      "Alignment is maintained. Spinal cord signal is preserved. No acute compression deformity or significant canal compromise identified on this examination.",
    impression: "No acute abnormality identified on MRI spine.",
  },
  "Doppler Ultrasound": {
    findings:
      "Color and spectral Doppler interrogation demonstrates preserved flow in the examined vessels. No definite occlusive thrombus identified in the scanned segments.",
    impression: "No definite Doppler evidence of occlusive vascular abnormality in the examined region.",
  },
};

const emptyForm = {
  patientId: "",
  testName: "",
  clinicalInfo: "",
  findings: "",
  impression: "",
  recommendation: "",
  status: "Pending",
  urgency: "Normal",
  radiologistName: "Radiology Technician",
  reportDate: todayISO(),
};

function Field({ label, children }) {
  return (
    <div className="rad-field">
      <label className="rad-label">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rad-empty">{text}</div>;
}

export default function RadiologyDashboard() {
  const printRef = useRef(null);

  const [tab, setTab] = useState("queue");
  const [patients, setPatients] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [imagePreview, setImagePreview] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const syncData = () => {
    setPatients(loadLS(STORAGE_KEYS.patients, []));
    setReports(loadLS(STORAGE_KEYS.radiologyReports, []));
  };

  useEffect(() => {
    syncData();

    const onFocus = () => syncData();
    const onStorage = () => syncData();

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
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
    if (!form.patientId) return null;
    return patients.find((p) => p.id === form.patientId) || null;
  }, [patients, form.patientId]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === "Pending").length,
    [reports]
  );

  const completedCount = useMemo(
    () => reports.filter((r) => r.status === "Completed").length,
    [reports]
  );

  const openPatient = (patient) => {
    setForm({
      ...emptyForm,
      patientId: patient.id,
      clinicalInfo: patient.notes || "",
      radiologistName: "Radiology Technician",
      reportDate: todayISO(),
    });
    setImagePreview([]);
    setTab("report");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "testName") {
        const template = AUTO_TEMPLATES[value];
        if (template) {
          next.findings = template.findings;
          next.impression = template.impression;
        }
      }

      return next;
    });
  };

  const handleUploadImage = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview((prev) => [
          ...prev,
          {
            id: uid("IMG"),
            name: file.name,
            url: ev.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (id) => {
    setImagePreview((prev) => prev.filter((img) => img.id !== id));
  };

  const clearForm = () => {
    setForm(emptyForm);
    setImagePreview([]);
  };

  const saveReport = () => {
    if (!form.patientId) return alert("Select a patient first.");
    if (!form.testName) return alert("Select a test.");
    if (!form.findings.trim()) return alert("Enter findings.");
    if (!form.impression.trim()) return alert("Enter impression.");

    const report = {
      id: uid("RPT"),
      patientId: form.patientId,
      patientName: selectedPatient?.fullName || "",
      patientPhone: selectedPatient?.phone || "",
      patientType: selectedPatient?.patientType || "Outpatient",
      testName: form.testName,
      clinicalInfo: form.clinicalInfo,
      findings: form.findings,
      impression: form.impression,
      recommendation: form.recommendation,
      status: form.status,
      urgency: form.urgency,
      radiologistName: form.radiologistName,
      reportDate: form.reportDate,
      images: imagePreview,
      createdAt: new Date().toISOString(),
      sentToDoctor: true,
    };

    const updatedReports = [report, ...reports];
    setReports(updatedReports);
    saveLS(STORAGE_KEYS.radiologyReports, updatedReports);

    const existingDoctorFeed = loadLS(STORAGE_KEYS.doctorFeed, []);
    const doctorEntry = {
      id: uid("DOCFEED"),
      source: "Radiology",
      patientId: report.patientId,
      patientName: report.patientName,
      title: `${report.testName} Report`,
      content: report.impression,
      fullReport: report,
      date: report.reportDate,
      createdAt: report.createdAt,
    };
    saveLS(STORAGE_KEYS.doctorFeed, [doctorEntry, ...existingDoctorFeed]);

    setSelectedReportId(report.id);
    alert("Radiology report saved and sent to doctor ✅");
    setTab("history");
  };

  const openReportForPrint = (report) => {
    setSelectedReportId(report.id);
    setTab("print");
  };

  const printReport = () => {
    window.print();
  };

  const QueueView = () => (
    <div className="rad-main">
      <div className="rad-page-title">Radiology Patient Queue</div>

      <div className="rad-summary-grid">
        <div className="rad-summary-card">
          <div className="rad-summary-label">Patients from Reception</div>
          <div className="rad-summary-value">{patients.length}</div>
        </div>
        <div className="rad-summary-card">
          <div className="rad-summary-label">Reports Pending</div>
          <div className="rad-summary-value">{pendingCount}</div>
        </div>
        <div className="rad-summary-card">
          <div className="rad-summary-label">Reports Completed</div>
          <div className="rad-summary-value">{completedCount}</div>
        </div>
      </div>

      <div className="rad-work-grid">
        <div className="rad-panel">
          <div className="rad-panel-head">
            <h3>Patient Queue</h3>
            <input
              className="rad-input search-box"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name / phone / ID"
            />
          </div>

          <div className="rad-patient-list">
            {filteredPatients.length === 0 ? (
              <EmptyState text="No patients found from reception." />
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="rad-patient-card">
                  <div className="rad-patient-top">
                    <div>
                      <h4>{patient.fullName}</h4>
                      <p>Patient ID: {patient.id}</p>
                    </div>
                    <span
                      className={`badge ${
                        patient.patientType === "Inpatient" ? "orange" : "blue"
                      }`}
                    >
                      {patient.patientType || "Outpatient"}
                    </span>
                  </div>

                  <div className="rad-patient-meta">
                    <div>Phone: {patient.phone || "-"}</div>
                    <div>Gender: {patient.gender || "-"}</div>
                  </div>

                  <button className="rad-btn primary" onClick={() => openPatient(patient)}>
                    Open Patient
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rad-panel">
          <div className="rad-panel-head">
            <h3>Suggestions</h3>
          </div>

          <ul className="rad-idea-list">
            <li>Use templates to speed up reporting.</li>
            <li>Upload image evidence with each report.</li>
            <li>Mark urgent studies clearly before sending to doctor.</li>
            <li>Use print view for patient file copies.</li>
            <li>Later you can add zoom, annotations, and PDF download.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const ReportView = () => (
    <div className="rad-main">
      <div className="rad-page-title">Radiology Report Workspace</div>

      {!selectedPatient ? (
        <EmptyState text="Select a patient from the queue first." />
      ) : (
        <>
          <div className="rad-banner">
            <div>
              <h2>{selectedPatient.fullName}</h2>
              <p>
                Patient ID: <b>{selectedPatient.id}</b> | Phone: <b>{selectedPatient.phone || "-"}</b> | Type:{" "}
                <b>{selectedPatient.patientType || "Outpatient"}</b>
              </p>
            </div>

            <div className="rad-banner-actions">
              <button className="rad-btn" onClick={() => setTab("queue")}>
                Back to Queue
              </button>
              <button className="rad-btn danger" onClick={clearForm}>
                Clear Form
              </button>
            </div>
          </div>

          <div className="rad-work-grid">
            <div className="rad-panel">
              <div className="rad-panel-head">
                <h3>Patient & Test Details</h3>
              </div>

              <div className="rad-form-grid">
                <Field label="Patient Name">
                  <input className="rad-input" value={selectedPatient.fullName} readOnly />
                </Field>

                <Field label="Patient ID">
                  <input className="rad-input" value={selectedPatient.id} readOnly />
                </Field>

                <Field label="Test Name">
                  <select
                    className="rad-input"
                    name="testName"
                    value={form.testName}
                    onChange={handleChange}
                  >
                    <option value="">Select test</option>
                    {TEST_OPTIONS.map((test) => (
                      <option key={test} value={test}>
                        {test}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    className="rad-input"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </Field>

                <Field label="Urgency">
                  <select
                    className="rad-input"
                    name="urgency"
                    value={form.urgency}
                    onChange={handleChange}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </Field>

                <Field label="Report Date">
                  <input
                    className="rad-input"
                    type="date"
                    name="reportDate"
                    value={form.reportDate}
                    onChange={handleChange}
                  />
                </Field>

                <Field label="Radiologist / Technician">
                  <input
                    className="rad-input"
                    name="radiologistName"
                    value={form.radiologistName}
                    onChange={handleChange}
                    placeholder="Enter radiologist name"
                  />
                </Field>

                <Field label="Clinical Info">
                  <textarea
                    className="rad-input rad-textarea small"
                    name="clinicalInfo"
                    value={form.clinicalInfo}
                    onChange={handleChange}
                    placeholder="Reason for test / brief clinical history"
                  />
                </Field>
              </div>
            </div>

            <div className="rad-panel">
              <div className="rad-panel-head">
                <h3>Image Upload & Preview</h3>
              </div>

              <div className="upload-box">
                <label className="upload-label">
                  <span>Upload X-ray / CT / MRI / Ultrasound image</span>
                  <input type="file" accept="image/*" multiple onChange={handleUploadImage} hidden />
                </label>
              </div>

              {imagePreview.length === 0 ? (
                <EmptyState text="No images uploaded yet." />
              ) : (
                <div className="image-grid">
                  {imagePreview.map((img) => (
                    <div key={img.id} className="image-card">
                      <img src={img.url} alt={img.name} />
                      <div className="image-name">{img.name}</div>
                      <button className="rad-btn danger small" onClick={() => removeImage(img.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rad-panel">
            <div className="rad-panel-head">
              <h3>Radiology Findings</h3>
            </div>

            <div className="rad-form-grid single-column">
              <Field label="Findings">
                <textarea
                  className="rad-input rad-textarea large"
                  name="findings"
                  value={form.findings}
                  onChange={handleChange}
                  placeholder="Write detailed radiology findings here..."
                />
              </Field>

              <Field label="Impression">
                <textarea
                  className="rad-input rad-textarea medium"
                  name="impression"
                  value={form.impression}
                  onChange={handleChange}
                  placeholder="Write final impression / diagnosis here..."
                />
              </Field>

              <Field label="Recommendation">
                <textarea
                  className="rad-input rad-textarea small"
                  name="recommendation"
                  value={form.recommendation}
                  onChange={handleChange}
                  placeholder="Recommendations to doctor..."
                />
              </Field>
            </div>

            <div className="action-row">
              <button className="rad-btn primary" onClick={saveReport}>
                Save & Send to Doctor
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const HistoryView = () => (
    <div className="rad-main">
      <div className="rad-page-title">Radiology Report History</div>

      <div className="rad-panel">
        <div className="rad-panel-head">
          <h3>Saved Reports</h3>
        </div>

        {reports.length === 0 ? (
          <EmptyState text="No radiology reports saved yet." />
        ) : (
          <div className="table-wrap">
            <table className="rad-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Status</th>
                  <th>Urgency</th>
                  <th>Date</th>
                  <th>Radiologist</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.patientName}</td>
                    <td>{report.testName}</td>
                    <td>{report.status}</td>
                    <td>{report.urgency}</td>
                    <td>{report.reportDate}</td>
                    <td>{report.radiologistName}</td>
                    <td>
                      <button className="rad-btn small primary" onClick={() => openReportForPrint(report)}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const PrintView = () => (
    <div className="rad-main">
      <div className="rad-page-title">Print Radiology Report</div>

      {!selectedReport ? (
        <EmptyState text="Open a report from history first." />
      ) : (
        <>
          <div className="action-row no-print">
            <button className="rad-btn" onClick={() => setTab("history")}>
              Back to History
            </button>
            <button className="rad-btn primary" onClick={printReport}>
              Print Report
            </button>
          </div>

          <div ref={printRef} className="print-sheet print-area">
            <div className="print-head">
              <div className="print-brand">
                <img src={logo} alt="logo" className="print-logo" />
                <div>
                  <div className="print-title">ANKA HOSPITAL</div>
                  <div className="print-subtitle">Radiology Report</div>
                </div>
              </div>

              <div className="print-meta">
                <div><strong>Report Date:</strong> {selectedReport.reportDate}</div>
                <div><strong>Radiologist:</strong> {selectedReport.radiologistName}</div>
                <div><strong>Status:</strong> {selectedReport.status}</div>
              </div>
            </div>

            <hr />

            <div className="print-section">
              <h3>Patient Information</h3>
              <div className="print-grid">
                <div><strong>Name:</strong> {selectedReport.patientName}</div>
                <div><strong>Patient ID:</strong> {selectedReport.patientId}</div>
                <div><strong>Phone:</strong> {selectedReport.patientPhone || "-"}</div>
                <div><strong>Type:</strong> {selectedReport.patientType || "-"}</div>
                <div><strong>Test:</strong> {selectedReport.testName}</div>
                <div><strong>Urgency:</strong> {selectedReport.urgency}</div>
              </div>
            </div>

            <div className="print-section">
              <h3>Clinical Information</h3>
              <p>{selectedReport.clinicalInfo || "-"}</p>
            </div>

            <div className="print-section">
              <h3>Findings</h3>
              <p>{selectedReport.findings || "-"}</p>
            </div>

            <div className="print-section">
              <h3>Impression</h3>
              <p>{selectedReport.impression || "-"}</p>
            </div>

            <div className="print-section">
              <h3>Recommendation</h3>
              <p>{selectedReport.recommendation || "-"}</p>
            </div>

            {selectedReport.images?.length > 0 && (
              <div className="print-section">
                <h3>Attached Images</h3>
                <div className="print-image-grid">
                  {selectedReport.images.map((img) => (
                    <div key={img.id} className="print-image-card">
                      <img src={img.url} alt={img.name} />
                      <div>{img.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="print-footer">
              <div>Radiologist Signature: ____________________</div>
              <div>Report generated: {formatDateTime(selectedReport.createdAt)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="rad-page">
      <div className="rad-header">
        <div className="rad-brand">
          <img src={logo} alt="Anka Hospital" className="rad-logo" />
          <div>
            <div className="rad-title">ANKA HOSPITAL</div>
            <div className="rad-sub">Radiology Department</div>
          </div>
        </div>

        <div className="rad-header-actions no-print">
          <button className="rad-btn" onClick={syncData}>
            Sync
          </button>
          <button className="rad-btn danger">Logout</button>
        </div>
      </div>

      <div className="rad-layout">
        <aside className="rad-sidebar no-print">
          <div className="rad-nav-title">Navigation</div>

          <div className={`rad-nav-item ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
            👥 Patient Queue
          </div>
          <div className={`rad-nav-item ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>
            📝 Write Report
          </div>
          <div className={`rad-nav-item ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            📂 Report History
          </div>
          <div className={`rad-nav-item ${tab === "print" ? "active" : ""}`} onClick={() => setTab("print")}>
            🖨️ Print Report
          </div>

          <div className="rad-side-note">
            Radiology receives patients from reception, prepares reports, uploads photos, and sends completed reports to doctor.
          </div>
        </aside>

        <main className="rad-content">
          {tab === "queue" && <QueueView />}
          {tab === "report" && <ReportView />}
          {tab === "history" && <HistoryView />}
          {tab === "print" && <PrintView />}
        </main>
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