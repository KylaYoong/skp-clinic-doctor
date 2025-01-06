import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase-config";

function DoctorDashboard() {
  const [tableData, setTableData] = useState([]);
  const [stats, setStats] = useState({
    newPatients: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    avgWaitingTime: "0 min",
  });

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
            queueNo: queueData.queueNumber || "N/A",
            name: empData.name || "N/A",
            empId: empData.empId || "N/A",
            gender: empData.gender || "N/A",
            age: calculateAge(empData.dateOfBirth),
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

  const handleConsultation = (patient) => {
    alert(`Consulting with: ${patient.name}`);
  };

  return (
    <div className="content-wrapper" style={{ marginLeft: "0", paddingLeft: "0" }}>
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0" style={{ marginBottom: "20px" }}>
            Welcome to SKP Clinic Doctor
          </h1>
        </div>
      </div>

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
                        <th>Consultation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.queueNo}</td>
                          <td>{row.name}</td>
                          <td>{row.empId}</td>
                          <td>{row.gender}</td>
                          <td>{row.age}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleConsultation(row)}
                            >
                              Consult
                            </button>
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
    </div>
  );
}

export default DoctorDashboard;
