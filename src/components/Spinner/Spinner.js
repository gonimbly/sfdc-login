import React from "react";
import "./style.css";

const Spinner = ({ message, loading }) => {
  if (!loading) {
    return null;
  }

  return (
    <div className="loading">
      <div className="dropdown-loading">
        <h2>{message}</h2>
        <div className="spinner">
          <div className="bounce1" />
          <div className="bounce2" />
          <div className="bounce3" />
        </div>
      </div>
    </div>
  );
};

export default Spinner;
