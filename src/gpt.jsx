{/* Popup Window */}
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
  
        {/* Medicines */}
        <div className="form-group">
          <label>Medicines:</label>
          {medicines.map((med, index) => (
            <div key={index} className="d-flex mb-2">
              <input
                type="text"
                placeholder="Medicine Name"
                value={med.name}
                onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                className="form-control mr-2"
              />
              <input
                type="text"
                placeholder="Dosage"
                value={med.dosage}
                onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
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
          <button className="btn btn-secondary btn-sm" onClick={handleAddMedicine}>
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
        <div>
          <button className="btn btn-primary mt-3" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary mt-3 ml-2" onClick={closePopup}>
            Close
          </button>
        </div>
      </div>
    </div>
  )}
  