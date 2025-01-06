import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase-config";
import "./Dashboard.css"; // CSS for maintaining the original layout

function DoctorDashboard() {
  const [tableData, setTableData] = useState([]); // Patient data
  const [stats, setStats] = useState({
    newPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    avgWaitingTime: "0 min",
  });

  const [popupPatient, setPopupPatient] = useState(null); // Current patient in the popup
  const [diagnosisList] = useState([
    "Common Cold",
    "Flu",
    "Back Pain",
    "Migraine",
  ]); // Predefined list of diagnoses
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(""); // Selected diagnosis
  const [additionalNotes, setAdditionalNotes] = useState(""); // Notes from the doctor
  const [mcYes, setMcYes] = useState(false); // MC selection
  const [mcDates, setMcDates] = useState({ start: "", end: "" }); // MC dates
  const [mcAmount, setMcAmount] = useState(""); // MC amount
  const [medicines, setMedicines] = useState([{ name: "", dosage: "" }]); // Medicines list


  useEffect(() => {
    // Fetch statistics and patient data on component load
    const fetchStats = async () => {
      const statsSnapshot = await getDocs(collection(db, "stats"));
      if (!statsSnapshot.empty) {
        setStats(statsSnapshot.docs[0].data());
      }
    };

    const fetchTableData = async () => {
      try {
        const queueSnapshot = await getDocs(collection(db, "queue"));
        const employeesSnapshot = await getDocs(collection(db, "employees"));

        const employeesMap = {};
        employeesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          employeesMap[data.employeeID] = {
            name: data.name,
            gender: data.gender,
            dateOfBirth: data.dob,
            empId: data.employeeID,
          };
        });

        const patients = queueSnapshot.docs.map((doc) => {
          const queueData = doc.data();
          const empData = employeesMap[queueData.employeeID] || {};
          return {
            id: doc.id,
            queueNo: queueData.queueNumber || "N/A",
            name: empData.name || "N/A",
            empId: empData.empId || "N/A",
            gender: empData.gender || "N/A",
            age: calculateAge(empData.dateOfBirth),
            timeIn: queueData.timeIn || null,
            timeOut: queueData.timeOut || null,
            status: queueData.status || "Waiting",
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

  // Calculate patient's age based on DOB
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Mark patient's time-in
  const handleTimeIn = async (patient) => {
    const now = new Date().toLocaleTimeString();
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { timeIn: now });
      setTableData((prev) =>
        prev.map((item) => (item.id === patient.id ? { ...item, timeIn: now } : item))
      );
    } catch (error) {
      console.error("Error updating Time In:", error);
    }
  };

  // Mark patient's time-out
  const handleTimeOut = async (patient) => {
    const now = new Date().toLocaleTimeString();
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { timeOut: now });
      setTableData((prev) =>
        prev.map((item) => (item.id === patient.id ? { ...item, timeOut: now } : item))
      );
    } catch (error) {
      console.error("Error updating Time Out:", error);
    }
  };

  // Save consultation details
  const handleSave = async () => {
    if (!popupPatient) return;

    const dataToSave = {
      diagnosis: selectedDiagnosis,
      notes: additionalNotes,
      mc: mcYes ? { start: mcDates.start, end: mcDates.end } : null,
      amount: mcAmount,
      medicines,
    };

    try {
      const patientDoc = doc(db, "queue", popupPatient.id);
      await updateDoc(patientDoc, { consultationData: dataToSave, status: "Completed" });

      setTableData((prev) =>
        prev.map((item) =>
          item.id === popupPatient.id ? { ...item, status: "Completed" } : item
        )
      );

      closePopup();
    } catch (error) {
      console.error("Error saving consultation data:", error);
    }
  };

  // Close the consultation popup
  const closePopup = () => {
    setPopupPatient(null);
    setSelectedDiagnosis("");
    setAdditionalNotes("");
    setMcYes(false);
    setMcDates({ start: "", end: "" });
    setMcAmount("");
    setMedicines([{ name: "", dosage: "" }]);
  };

  // Add a new medicine field
  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "" }]);
  };

  // Remove a medicine field
  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  // Update medicine details
  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  // Mark patient as Completed using the tick icon
  const handleTick = async (patient) => {
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { status: "Completed" });
      setTableData((prev) =>
        prev.map((item) =>
          item.id === patient.id ? { ...item, status: "Completed" } : item
        )
      );
    } catch (error) {
      console.error("Error marking patient as Completed:", error);
    }
  };
  
  
  return (
    // must have this style={{ marginLeft: "0", paddingLeft: "0" }} to remain original layout
    <div className="content-wrapper" style={{ marginLeft: "0", paddingLeft: "0" }}>
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0" style={{ marginBottom: "20px" }}>
            Welcome to SKP Clinic Doctor
          </h1>
        </div>
      </div>

      {/* Statistics Section */}
      <section className="content">
        <div className="container-fluid">
          {/* Widgets Row */}
          <div className="row">
            <div className="col-lg-3 col-6">
              <div className="small-box bg-info">
                <div className="inner">
                  <h3>{stats.newPatients}</h3>
                  <p>New Patients</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="small-box bg-success">
                <div className="inner">
                  <h3>{stats.completedAppointments}</h3>
                  <p>Completed Appointments</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="small-box bg-warning">
                <div className="inner">
                  <h3>{stats.pendingAppointments}</h3>
                  <p>Pending Appointments</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="small-box bg-secondary">
                <div className="inner">
                  <h3>{stats.avgWaitingTime}</h3>
                  <p>Average Waiting Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Table Section */}
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
                            {row.timeIn ? (
                              <span className="text-success">{`In: ${row.timeIn}`}</span>
                            ) : (
                              <button
                                className="btn btn-info btn-sm"
                                onClick={() => handleTimeIn(row)}
                              >
                                Time In
                              </button>
                            )}
                            {row.timeOut ? (
                              <span className="text-danger ml-2">{`Out: ${row.timeOut}`}</span>
                            ) : (
                              <button
                                className="btn btn-secondary btn-sm ml-2"
                                onClick={() => handleTimeOut(row)}
                              >
                                Time Out
                              </button>
                            )}
                            <button
                              className="btn btn-primary btn-sm ml-2"
                              onClick={() => setPopupPatient(row)}
                            >
                              Consult
                            </button>
                            {row.status !== "Completed" && (
                              <button
                                className="btn btn-success btn-sm ml-2"
                                onClick={() => handleTick(row)}
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

      {/* Popup Window */}
      {popupPatient && (
        <div className="popup">
          <div className="popup-content">
            <h3>Consultation</h3>
            <p>
              You are consulting with: <strong>{popupPatient.name}</strong>
            </p>
            {/* Diagnosis */}
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

            {/* Medicines */}
            <div className="form-group">
              <label>Medicines:</label>
              {medicines.map((med, index) => (
                <div key={index} className="d-flex mb-2">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={med.name}
                    onChange={(e) =>
                      handleMedicineChange(index, "name", e.target.value)
                    }
                    className="form-control mr-2"
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) =>
                      handleMedicineChange(index, "dosage", e.target.value)
                    }
                    className="form-control mr-2"
                  />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveMedicine(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddMedicine}
              >
                Add Medicine
              </button>
            </div>

            {/* Additional Notes */}
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

            {/* MC */}
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

            {/* MC Dates */}
            {mcYes && (
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={mcDates.start}
                  onChange={(e) =>
                    setMcDates((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
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
            )}

            {/* Amount */}
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="number"
                className="form-control"
                value={mcAmount}
                onChange={(e) => setMcAmount(e.target.value)}
              />
            </div>

            {/* Save and Close Buttons */}
            <button className="btn btn-primary mt-3" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary mt-3 ml-2" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
