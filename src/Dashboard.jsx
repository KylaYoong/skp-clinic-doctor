import React from "react";

function Dashboard() {
  return (
    <div className="content">
      <div className="content-header">
        <h1>Doctor Dashboard</h1>
      </div>
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className="small-box bg-info">
              <div className="inner">
                <h3>20</h3>
                <p>Patients Today</p>
              </div>
              <div className="icon">
                <i className="ion ion-person"></i>
              </div>
              <a href="#" className="small-box-footer">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className="small-box bg-success">
              <div className="inner">
                <h3>10</h3>
                <p>Appointments Completed</p>
              </div>
              <div className="icon">
                <i className="ion ion-checkmark"></i>
              </div>
              <a href="#" className="small-box-footer">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
