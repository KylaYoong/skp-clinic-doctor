import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase-config";
import "./Dashboard.css"; // CSS for maintaining the original layout


function DoctorDashboard() {
  const [tableData, setTableData] = useState([]); // Patient data
  const [currentCalledPatient, setCurrentCalledPatient] = useState(null); // Track the current called patient

  const [stats, setStats] = useState({
    newPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    avgWaitingTime: "0 min",
  });

  const [popupPatient, setPopupPatient] = useState(null); // Current patient in the popup

  const [diagnoses, setDiagnoses] = useState([{ name: "" }]); // Diagnoses list
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState([]); // Suggestions for diagnoses
  const [diagnosisList, setDiagnosisList] = useState([]); // Loaded diagnoses from Firestore  
  
  const [medicines, setMedicines] = useState([{ name: "", dosage: "" }]); // Medicines list
  const [medicineSuggestions, setMedicineSuggestions] = useState([]);
  const [medicineList, setMedicineList] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState(""); // Notes from the doctor
  const [mcYes, setMcYes] = useState(false); // MC selection
  const [mcDates, setMcDates] = useState({ start: "", end: "" }); // MC dates
  const [mcAmount, setMcAmount] = useState(""); // MC amount


  const updateWidgets = (updatedTableData) => {
    const newPatients = updatedTableData.filter((p) => p.isToday).length;
    const completedAppointments = updatedTableData.filter((p) => p.status === "Completed").length;
    const pendingAppointments = updatedTableData.filter(
      (p) => p.status === "Waiting"
    ).length;

    setStats((prev) => ({
      ...prev,
      newPatients,
      completedAppointments,
      pendingAppointments,
      avgWaitingTime: calculateAverageWaitingTime(updatedTableData),
    }));
  };

  // Listen to stats document for real-time updates
  useEffect(() => {
    const statsDocRef = doc(db, "stats", "statsDocID"); // Replace with your stats document ID
    const unsubscribe = onSnapshot(statsDocRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data());
      } else {
        console.error("Stats document not found");
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Fetch patient data and synchronize widgets
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const queueSnapshot = await getDocs(collection(db, "queue"));
        const employeesSnapshot = await getDocs(collection(db, "employees"));

        // Create a map of employee data
        const employeesMap = {};
        employeesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          employeesMap[data.employeeID] = {
            name: data.name || "N/A",
            gender: data.gender || "N/A",
            dateOfBirth: data.dob || null,
            empId: data.employeeID || "N/A",
          };
        });

        const today = new Date();
        const patients = queueSnapshot.docs.map((doc) => {
          const data = doc.data();
          const empData = employeesMap[data.employeeID] || {};
          const timestamp = data.timestamp?.toDate();
          const isToday =
            timestamp &&
            timestamp.getDate() === today.getDate() &&
            timestamp.getMonth() === today.getMonth() &&
            timestamp.getFullYear() === today.getFullYear();

          return {
            id: doc.id,
            queueNo: data.queueNumber || "N/A",
            name: empData.name || "N/A",
            empId: empData.empId || "N/A",
            gender: empData.gender || "N/A",
            age: calculateAge(empData.dateOfBirth),
            status: data.status || "Waiting",
            timeIn: data.timeIn || null,
            timeOut: data.timeOut || null,
            timestamp,
            isToday,
          };
        });

        const todayPatients = patients
          .filter((p) => p.isToday)
          .sort((a, b) => {
            const queueA = parseInt(a.queueNo, 10);
            const queueB = parseInt(b.queueNo, 10);
            return queueA - queueB; // Ascending order
          });

        setTableData(todayPatients);        
        updateWidgets(todayPatients); // Dynamically update widgets
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    };


    fetchTableData();

    const intervalId = setInterval(() => {
      fetchTableData();
    }, 86400000); // Refresh daily

    return () => clearInterval(intervalId); // Cleanup interval
  }, []);

  // Calculate average waiting time
  const calculateAverageWaitingTime = (patients) => {
    const waitingTimes = patients
      .filter((p) => p.timeIn && p.timeOut)
      .map((p) => {
        try {
          const timeIn = new Date(`1970-01-01T${p.timeIn}`);
          const timeOut = new Date(`1970-01-01T${p.timeOut}`);
          return (timeOut - timeIn) / (60 * 1000); // Difference in minutes
        } catch {
          return null;
        }
      })
      .filter((time) => time !== null); // Filter out invalid times

    if (waitingTimes.length === 0) return "0 min";

    const avg = waitingTimes.reduce((sum, time) => sum + time, 0) / waitingTimes.length;
    return `${Math.round(avg)} min`;
  };

    // Announce the queue number
  const announceQueueNumber = (queueNumber) => {
    if ("speechSynthesis" in window) {
      // Format the queue number as "zero zero seven"
      const formattedQueueNumber = queueNumber
        .toString()
        .split("")
        .map((digit) => {
          if (digit === "0") return "zero";
          return digit;
        })
        .join(" ");

      // Play "ding dong" sound
      const audio = new Audio('/sounds/minimalist-ding-dong.wav');
      // const audio = new Audio('/sounds/ding-dong.wav');
      audio.play();

      // Wait for the sound to finish before speaking
      audio.onended = () => {
        // English announcement
        // const englishUtterance = new SpeechSynthesisUtterance(`Now serving ${formattedQueueNumber}`);
        const englishUtterance = new SpeechSynthesisUtterance(`${formattedQueueNumber}`);
        englishUtterance.lang = "en-US";
        englishUtterance.rate = 0.3; // Slower pace

        // Malay announcement
        // const malayUtterance = new SpeechSynthesisUtterance(`Sekarang nombor ${queueNumber}`);
        const malayUtterance = new SpeechSynthesisUtterance(`${queueNumber}`);
        malayUtterance.lang = "ms-MY";
        malayUtterance.rate = 0.3; // Slower pace

        // Queue announcements
        window.speechSynthesis.speak(englishUtterance);
        window.speechSynthesis.speak(malayUtterance);
      };
    }
  };


  // It fetches a list of diagnoses from the "diagnoses" collection in Firestore.
  // The fetched data (diagnoses names) is stored in the diagnosisList state using setDiagnosisList.
  useEffect(() => {
    const fetchDiagnoses = async () => {
      try {
        const diagnosesSnapshot = await getDocs(collection(db, "diagnoses"));
        const diagnosesData = diagnosesSnapshot.docs.map((doc) => doc.data().name);
        setDiagnosisList(diagnosesData); // Store fetched diagnoses
      } catch (error) {
        console.error("Error fetching diagnoses:", error);
      }
    };
    fetchDiagnoses();
  }, []);
  
  // provides real-time suggestions for diagnoses based on a query.
  // filtered list is stored in the diagnosisSuggestions state using setDiagnosisSuggestions
  const fetchDiagnosisSuggestions = (query) => {
    if (!query) {
      setDiagnosisSuggestions([]);
      return;
    }
    const filteredSuggestions = diagnosisList
      .filter((diag) => diag.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10); // Limit suggestions to 10
    setDiagnosisSuggestions(filteredSuggestions);
  };
  
  const handleDiagnosisChange = (index, field, value) => {
    setDiagnoses((prev) =>
      prev.map((diag, i) => (i === index ? { ...diag, [field]: value } : diag))
    );
  };
  
  const handleAddDiagnosis = () => {
    setDiagnoses([...diagnoses, { name: "" }]);
  };
  
  const handleRemoveDiagnosis = (index) => {
    setDiagnoses((prev) => prev.filter((_, i) => i !== index));
  };
  
  // Fetches a list of medicines from the "medicines" collection in Firestore.
  // Stores the fetched medicine names in the medicineList state using setMedicineList
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const medicinesSnapshot = await getDocs(collection(db, "medicines"));
        const medicinesData = medicinesSnapshot.docs.map((doc) => doc.data().name);
        setMedicineList(medicinesData);
        if (process.env.NODE_ENV === "development") {
          console.log("Medicines fetched for doctor side:", medicinesData);
        }
      } catch (error) {
        console.error("Error fetching medicines:", error);
      }
    };

    fetchMedicines();
  }, []);  

  // Provides real-time medicine suggestions based on the user's query
  // Filters medicineList to include medicines whose names start with the query (case-insensitive) and limits the suggestions to 10
  // Updates the filtered suggestions in the medicineSuggestions state using setMedicineSuggestions
  const fetchMedicineSuggestions = (query) => {
    if (!query) {
      setMedicineSuggestions([]);
      return;
    }
    const filteredSuggestions = medicineList
      .filter((medicine) => medicine.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10);
    setMedicineSuggestions(filteredSuggestions);
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "" }]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };



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

  const handleConsult = (patient) => {
    console.log("Consulting Patient:", patient);
    setPopupPatient(patient);
  };

  const handleCallNextPatient = async () => {
    const nextPatient = tableData.find((patient) => patient.status.toLowerCase() === "waiting");
  
    if (!nextPatient) {
      alert("No patients are waiting.");
      return;
    }
  
    try {
      // Set the current called patient
      setCurrentCalledPatient(nextPatient);
  
      // Announce the queue number
      announceQueueNumber(nextPatient.queueNo);
  
      alert(`Calling Patient ${nextPatient.name} (Queue No: ${nextPatient.queueNo}).`);
    } catch (error) {
      console.error("Error during call next patient:", error);
      alert("Failed to call the next patient. Please try again.");
    }
  };
  

  const handleRepeatCall = async () => {
    // Find the current patient in consultation
    const inConsultationPatient = tableData.find(
      (patient) => patient.status.toLowerCase() === "waiting"
    );

    if (!inConsultationPatient) {
      alert("No patient is currently in consultation to repeat the call.");
      return;
    }

    try {
      // Announce the queue number
      announceQueueNumber(inConsultationPatient.queueNo);

      alert(`Repeating call for Patient ${inConsultationPatient.name} (Queue No: ${inConsultationPatient.queueNo}).`);
    } catch (error) {
      console.error("Error during repeat call:", error);
      alert("Failed to repeat the call. Please try again.");
    }
  };
  
  const handleTimeIn = async (patient) => {
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { status: "In Consultation", timeIn: new Date().toLocaleTimeString() });
  
      setTableData((prev) =>
        prev.map((item) =>
          item.id === patient.id ? { ...item, status: "In Consultation", timeIn: new Date().toLocaleTimeString() } : item
        )
      );
  
      alert(`Patient ${patient.name} (Queue No: ${patient.queueNo}) has started consultation.`);
    } catch (error) {
      console.error("Error during time in:", error);
      alert("Failed to mark time in. Please try again.");
    }
  };
  
  const handleTimeOut = async (patient) => {
    try {
      const now = new Date().toLocaleTimeString();
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { status: "Completed", timeOut: now });
  
      setTableData((prev) =>
        prev.map((item) =>
          item.id === patient.id ? { ...item, status: "Completed", timeOut: now } : item
        )
      );
  
      // Reset the current called patient if their status is now completed
      if (currentCalledPatient?.id === patient.id) {
        setCurrentCalledPatient(null);
      }
  
      alert(`Patient ${patient.name} (Queue No: ${patient.queueNo}) has completed consultation.`);
    } catch (error) {
      console.error("Error during time out:", error);
      alert("Failed to mark time out. Please try again.");
    }
  };
  
  
  const isCallNextEnabled = tableData.some((patient) => patient.status.toLowerCase() === "waiting");
  const isRepeatCallEnabled = isCallNextEnabled;
  const isTimeInEnabled = (patient) => patient.status.toLowerCase() === "waiting";
  const isTimeOutEnabled = (patient) => patient.status.toLowerCase() === "in consultation";
  

  // Save consultation details
  const handleSave = async () => {
    if (!popupPatient) return;

    const dataToSave = {
      // diagnosis: selectedDiagnosis,
      diagnosis: diagnoses,
      notes: additionalNotes,
      mc: mcYes ? { start: mcDates.start, end: mcDates.end } : null,
      amount: mcAmount,
      medicines,
    };

    try {
      const patientDoc = doc(db, "queue", popupPatient.id);
      await updateDoc(patientDoc, { consultationData: dataToSave, status: "Completed" });
  
      const updatedTableData = tableData.map((item) =>
        item.id === popupPatient.id ? { ...item, status: "Completed" } : item
      );
  
      setTableData(updatedTableData);
      updateWidgets(updatedTableData);
      closePopup();
    } catch (error) {
      console.error("Error saving consultation data:", error);
      alert("Failed to save consultation details. Please try again.");
    }
  };


  // Close the consultation popup
  const closePopup = () => {
    setPopupPatient(null);
    // setSelectedDiagnosis("");
    setDiagnoses([{ name: "" }]);
    setAdditionalNotes("");
    setMcYes(false);
    setMcDates({ start: "", end: "" });
    setMcAmount("");
    setMedicines([{ name: "", dosage: "" }]);
  };

  // Mark patient as Completed using the tick icon
  const handleTick = async (patient) => {
    try {
      const patientDoc = doc(db, "queue", patient.id);
      await updateDoc(patientDoc, { status: "Completed" });

      const updatedTableData = tableData.map((item) =>
        item.id === patient.id ? { ...item, status: "Completed" } : item
      );

      setTableData(updatedTableData);
      updateWidgets(updatedTableData); // Dynamically recalculate widgets
    } catch (error) {
      console.error("Error marking patient as Completed:", error);
      alert("Failed to update the patient status. Please try again.");
    }
  };



  return (
    // must have this style={{ marginLeft: "0", paddingLeft: "0" }} to remain original layout
    <div className="content-wrapper" style={{ marginLeft: "0", paddingLeft: "0" }}>
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0" style={{ marginBottom: "20px" }}>
          Your Doctor Dashboard for SKP Clinic
          </h1>
        </div>
      </div>

      {/* Statistics Section */}
      <section className="content">
        <div className="container-fluid">
          {/* Widgets Row */}
          <div className="row">
            {/* New Patients Widget */}
            <div className="col-lg-3 col-6">
              <div className="small-box" style={{ backgroundColor: "#17a2b8", color: "#fff" }}>
                <div className="inner">
                  <h3>{stats.newPatients}</h3>
                  <p>New Patients</p>
                </div>
                <div className="icon">
                  <i className="fas fa-user-plus"></i> {/* New Patient Icon */}
                </div>
              </div>
            </div>

            {/* Completed Appointments Widget */}
            <div className="col-lg-3 col-6">
              <div className="small-box" style={{ backgroundColor: "#28a745", color: "#fff" }}>
                <div className="inner">
                  <h3>{stats.completedAppointments}</h3>
                  <p>Completed</p>
                </div>
                <div className="icon">
                  <i className="fas fa-check-circle"></i> {/* Completed Icon */}
                </div>
              </div>
            </div>

            {/* Pending Widget */}
            <div className="col-lg-3 col-6">
              <div className="small-box bg-warning"> {/* Retain bg-warning */}
                <div className="inner">
                  <h3>{stats.pendingAppointments}</h3>
                  <p>Pending Patients</p>
                </div>
                <div className="icon">
                  <i className="fas fa-clock"></i> {/* Pending Icon */}
                </div>
              </div>
            </div>

            {/* Average Waiting Time Widget */}
            <div className="col-lg-3 col-6">
              <div className="small-box bg-secondary"> {/* Retain bg-secondary */}
                <div className="inner">
                  <h3>{stats.avgWaitingTime}</h3>
                  <p>Average Waiting Time</p>
                </div>
                <div className="icon">
                  <i className="fas fa-hourglass-half"></i> {/* Average Time Icon */}
                </div>
              </div>
            </div>
          </div>

          {/* Patient Table Section */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                Patient List
              </h3>

                {/* Call Next Patient button */}
                <div style={{ flex: "1", textAlign: "right" }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleCallNextPatient}
                    disabled={!!currentCalledPatient || !isCallNextEnabled}  // Button is disabled if a patient is being called
                  >
                    Call Next Patient
                  </button>
                </div>

                {/* Repeat Call button */}
                <div style={{ flex: "0.15", textAlign: "right" }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleRepeatCall}
                    disabled={!currentCalledPatient} // Button is enabled only if a patient is being called
                  >
                    Repeat Call
                  </button>
                </div>
              </div>

                <div className="card-body table-responsive">

                  <table className="table table-hover">
                    <thead>
                      <tr>
                        {/* <th>Queue No.</th>
                        <th>Name</th>
                        <th>Emp ID</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Status</th>
                        <th>Actions</th> */}
                        <th style={{ width: "8%" }}>Queue No.</th>
                        <th style={{ width: "17%" }}>Name</th>
                        <th style={{ width: "7%" }}>Emp ID</th>
                        <th style={{ width: "7%" }}>Gender</th>
                        <th style={{ width: "6%" }}>Age</th>
                        <th style={{ width: "11%" }}>Status</th>
                        <th style={{ width: "28%" }}>Actions</th>
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
                                // disabled={!isTimeInEnabled(row)}
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
                              onClick={() => handleConsult(row)}
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
              {diagnoses.map((diag, index) => (
                <div key={index} className="d-flex mb-2 position-relative">
                  <div style={{ width: "100%", position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Diagnosis Name"
                      value={diag.name}
                      onChange={(e) => {
                        handleDiagnosisChange(index, "name", e.target.value);
                        fetchDiagnosisSuggestions(e.target.value); // Fetch suggestions
                      }}
                      className="form-control"
                    />
                    {/* Render suggestions */}
                    {diagnosisSuggestions.length > 0 && (
                      <div className="suggestions">
                        {diagnosisSuggestions.map((suggestion, i) => (
                          <div
                            key={i}
                            className="suggestion-item"
                            onClick={() => {
                              handleDiagnosisChange(index, "name", suggestion);
                              setDiagnosisSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveDiagnosis(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAddDiagnosis}
              >
                Add Diagnosis
              </button>
            </div>


            {/* Medicines */}
            <div className="form-group">
              <label>Medicines:</label>
              {medicines.map((med, index) => (
                <div key={index} className="d-flex mb-2 position-relative">
                  <div style={{ width: "100%", position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Medicine Name"
                      value={med.name}
                      onChange={(e) => {
                        handleMedicineChange(index, "name", e.target.value);
                        fetchMedicineSuggestions(e.target.value); // Fetch suggestions
                      }}
                      className="form-control"
              />

            {console.log("Current Suggestions:", medicineSuggestions)}
            {/* Render suggestions */}
            {medicineSuggestions.length > 0 && (
              <div className="suggestions">
                {medicineSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="suggestion-item"
                    onClick={() => {
                      handleMedicineChange(index, "name", suggestion);
                      setMedicineSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            </div>
            {/* Dosage */}
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