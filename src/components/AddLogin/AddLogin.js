import React from "react";
import "./style.css";

const AddLogin = ({ forTestUrl, forLoginUrl, onChangeAlias, alias }) => {
  return (
    <div className="form-row">
      <div className="col-sm-12">
        <h4>Add a New Login</h4>

        <small>
          Enter a nickname and click the button corresponding to the edition
          (you can enter a namespace from the login page)
        </small>
        <br />
        <br />
      </div>

      <div className="form-inline add-login">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={alias}
            onChange={onChangeAlias}
            placeholder="Add a new login"
          />
          <span className="input-group-btn">
            <button
              type="button"
              className="btn btn-inline btn-primary"
              onClick={forTestUrl}
            >
              Sandbox
            </button>
            <button
              type="button"
              className="btn btn-inline btn-secondary"
              onClick={forLoginUrl}
            >
              Production
            </button>
          </span>
        </div>
        <div className="form-group" />
        <div className="form-group" />
      </div>
    </div>
  );
};

export default AddLogin;
