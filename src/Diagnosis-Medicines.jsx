import React, { useState, useEffect } from "react";
import { db } from "./firebase-config"; // Your Firebase config
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
} from "firebase/firestore";
import "./Diagnosis-Medicines.css";

function DiagnosisMedicines() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const [medicines, setMedicines] = useState([]);
  const [newMedicine, setNewMedicine] = useState("");

  // Fetch Diagnoses
  const fetchDiagnoses = async () => {
    const diagnosesSnapshot = await getDocs(collection(db, "diagnoses"));
    const diagnosesData = diagnosesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDiagnoses(diagnosesData);
  };

  // Fetch Medicines
  const fetchMedicines = async () => {
    const medicinesSnapshot = await getDocs(collection(db, "medicines"));
    const medicinesData = medicinesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMedicines(medicinesData);
  };


  const addMedicine = async () => {
    if (!newMedicine) return;
    await addDoc(collection(db, "medicines"), { name: newMedicine });
    setNewMedicine("");
    fetchMedicines();
  };

  const addDiagnosis = async () => {
    if (!newDiagnosis) return;
      await addDoc(collection(db, "diagnoses"), { name: newDiagnosis });
      setNewDiagnosis("");
      fetchDiagnoses();
  };
  

  const updateMedicine = async (id, name) => {
    const medicineDoc = doc(db, "medicines", id);
    await updateDoc(medicineDoc, { name });
    fetchMedicines();
  };

  const updateDiagnosis = async (id, name) => {
    const diagnosisDoc = doc(db, "diagnoses", id);
    await updateDoc(diagnosisDoc, { name });
    fetchDiagnoses();
  };

  const deleteMedicine = async (id) => {
    const medicineDoc = doc(db, "medicines", id);
    await deleteDoc(medicineDoc);
    fetchMedicines();
  };

  const deleteDiagnosis = async (id) => {
    const diagnosisDoc = doc(db, "diagnoses", id);
    await deleteDoc(diagnosisDoc);
    fetchDiagnoses();
  };

  useEffect(() => {
    fetchMedicines();
    fetchDiagnoses();
  }, []);

  return (
    <div className="diag-med">
      <div className="manage-container">

        {/* Diagnoses Section */}
        <div className="manage-section">
          <h1>Manage Diagnoses</h1>
          <div>
            <input
              type="text"
              placeholder="New Diagnosis"
              value={newDiagnosis}
              onChange={(e) => setNewDiagnosis(e.target.value)}
            />
            <button onClick={addDiagnosis}>Add Diagnosis</button>
          </div>
          <ul className="manage-list">
            {diagnoses.map((diagnosis) => (
              <li key={diagnosis.id}>
                <input
                  type="text"
                  value={diagnosis.name}
                  onChange={(e) => updateDiagnosis(diagnosis.id, e.target.value)}
                />
                <button onClick={() => deleteDiagnosis(diagnosis.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>

      {/* Medicines Section */}
      <div className="manage-section">
        <h1>Manage Medicines</h1>
        <div>
          <input
            type="text"
            placeholder="New Medicine"
            value={newMedicine}
            onChange={(e) => setNewMedicine(e.target.value)}
          />
          <button onClick={addMedicine}>Add Medicine</button>
        </div>
        <ul className="manage-list">
          {medicines.map((medicine) => (
            <li key={medicine.id}>
              <input
                type="text"
                value={medicine.name}
                onChange={(e) => updateMedicine(medicine.id, e.target.value)}
              />
              <button onClick={() => deleteMedicine(medicine.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </div>
  );
}

export default DiagnosisMedicines;
