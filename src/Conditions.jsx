import React from "react";

function Conditions() {
  return (
    <div className="content">
      <div className="content-header">
        <h1>Conditions & Medicine</h1>
      </div>
      <div className="container-fluid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Manage Conditions</h3>
          </div>
          <div className="card-body">
            <p>This section allows doctors to manage conditions and prescribed medicines.</p>
            <ul>
              <li>Condition: Fever</li>
              <li>Medicine: Paracetamol</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conditions;
