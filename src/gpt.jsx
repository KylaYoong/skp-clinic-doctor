import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase-config";
import "./Dashboard.css"; // Ensure this file maintains the original layout styling.

function DoctorDashboard() {
  const [tableData, setTableData] = useState([]);
  const [stats, setStats] = useState({
    newPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    avgWaitingTime: "0 min",
  });

  const [popupPatient, setPopupPatient] = useState(null);
  const [diagnosisList, setDiagnosisList] = useState([
    "Common Cold",
    "Flu",
    "Back Pain",
    "Migraine",
  ]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [mcYes, setMcYes] = useState(false);
  const [mcDates, setMcDates] = useState({ start: "", end: "" });
  const [mcAmount, setMcAmount] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      const statsSnapshot = await getDocs(collection(db, "stats"));
      if (!statsSnapshot.empty) {
        const statsData = statsSnapshot.docs[0].data();
        setStats(statsData);
      }
    };

    const fetchTableData = async () => {
      try {
        const queueSnapshot = await getDocs(collection(db, "queue"));
        const employeesSnapshot = await getDocs(collection(db, "employees"));

        const employeesMap = {};
        employeesSnapshot.docs.forEach((doc) => {
          const employeeData = doc.data();
          const employeeId = employeeData.employeeID;

          employeesMap[employeeId] = {
            name: employeeData.name,
            gender: employeeData.gender,
            dateOfBirth: employeeData.dob,
            empId: employeeData.employeeID,
          };
        });

        const patients = queueSnapshot.docs.map((doc) => {
          const queueData = doc.data();
          const employeeId = queueData.employeeID;
          const empData = employeesMap[employeeId] || {};

          return {
            id: doc.id, // Firebase document ID for updates
            queueNo: queueData.queueNumber || "N/A",
            name: empData.name || "N/A",
            empId: empData.empId || "N/A",
            gender: empData.gender || "N/A",
            age: calculateAge(empData.dateOfBirth),
            timeIn: queueData.timeIn || null,
            timeOut: queueData.timeOut || null,
            status: "Waiting", // Default status
          };
        });

        setTableData(patients);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchStats();
    fetchTableData();
  }, []);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleTimeIn = async (patient) => {
    const now = new Date().toLocaleTimeString();
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { timeIn: now });
      setTableData((prevData) =>
        prevData.map((item) =>
          item.id === patient.id ? { ...item, timeIn: now } : item
        )
      );
    } catch (error) {
      console.error("Error updating Time In:", error);
    }
  };

  const handleTimeOut = async (patient) => {
    const now = new Date().toLocaleTimeString();
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { timeOut: now });
      setTableData((prevData) =>
        prevData.map((item) =>
          item.id === patient.id ? { ...item, timeOut: now } : item
        )
      );
    } catch (error) {
      console.error("Error updating Time Out:", error);
    }
  };

  const handleConsultation = (patient) => {
    setPopupPatient(patient);
    setSelectedDiagnosis("");
    setAdditionalNotes("");
    setMcYes(false);
    setMcDates({ start: "", end: "" });
    setMcAmount("");
    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === patient.id ? { ...item, status: "Being Attended" } : item
      )
    );
  };

  const markAsCompleted = async (patient) => {
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { status: "Completed" });
      setTableData((prevData) =>
        prevData.map((item) =>
          item.id === patient.id ? { ...item, status: "Completed" } : item
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const closePopup = () => {
    setPopupPatient(null);
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0">Welcome to SKP Clinic Doctor</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-3 col-6">
              <div className="small-box bg-info">
                <div className="inner">
                  <h3>{stats.newPatients}</h3>
                  <p>New Patients</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Patient List</h3>
                </div>
                <div className="card-body table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Queue No.</th>
                        <th>Name</th>
                        <th>Emp ID</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row) => (
                        <tr key={row.id}>
                          <td>{row.queueNo}</td>
                          <td>{row.name}</td>
                          <td>{row.empId}</td>
                          <td>{row.gender}</td>
                          <td>{row.age}</td>
                          <td>{row.status}</td>
                          <td>
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => handleTimeIn(row)}
                            >
                              Time In
                            </button>
                            <button
                              className="btn btn-secondary btn-sm mx-2"
                              onClick={() => handleTimeOut(row)}
                            >
                              Time Out
                            </button>
                            <button
                              className="btn btn-primary btn-sm mx-2"
                              onClick={() => handleConsultation(row)}
                            >
                              Consult
                            </button>
                            {row.status !== "Completed" && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => markAsCompleted(row)}
                              >
                                ✓
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {popupPatient && (
        <div className="popup">
          <div className="popup-content">
            <h3>Consultation</h3>
            <p>
              You are consulting with: <strong>{popupPatient.name}</strong>
            </p>

            <div className="form-group">
              <label>Diagnosis:</label>
              <select
                value={selectedDiagnosis}
                onChange={(e) => setSelectedDiagnosis(e.target.value)}
                className="form-control"
              >
                <option value="" disabled>
                  Select Diagnosis
                </option>
                {diagnosisList.map((diag, index) => (
                  <option key={index} value={diag}>
                    {diag}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Additional Notes:</label>
              <textarea
                rows="3"
                className="form-control"
                placeholder="Enter any notes here..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>MC:</label>
              <div>
                <button
                  className={`btn ${mcYes ? "btn-success" : "btn-light"} mr-2`}
                  onClick={() => setMcYes(true)}
                >
                  Yes
                </button>
                <button
                  className={`btn ${!mcYes ? "btn-success" : "btn-light"}`}
                  onClick={() => setMcYes(false)}
                >
                  No
                </button>
              </div>
            </div>

            {mcYes && (
              <div className="form-group">
                <div>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={mcDates.start}
                    onChange={(e) =>
                      setMcDates((prev) => ({ ...prev, start: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>End Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={mcDates.end}
                    onChange={(e) =>
                      setMcDates((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label>Amount:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={mcAmount}
                    onChange={(e) => setMcAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button className="btn btn-secondary mt-3" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
