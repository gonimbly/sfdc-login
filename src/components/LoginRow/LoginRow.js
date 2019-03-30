import React from "react";
import sfdx from "sfdx-node";
import classnames from "classnames";
import "./styles.css";

const LoginRow = ({ alias, connectedStatus, username, logout }) => {
  const openOrg = () => {
    console.log("opening", alias);
    window.sfdx = sfdx;
    sfdx.org
      .open({ targetusername: alias })
      .then(x => console.log("opened alias", x));
  };

  const connected = connectedStatus === "Connected";

  return (
    <tr className="login-row">
      <th
        scope="row"
        onClick={connected ? openOrg : () => {}}
        className={classnames({
          "text-danger": !connected,
          "not-connected": !connected
        })}
        alt={
          connected ? null : "Username no longer connected. Re-add this login."
        }
      >
        {alias}
        {connected ? null : (
          <small className="text-muted">&nbsp;(Not connected)</small>
        )}
      </th>
      <td>{username}</td>
      <td className="delete-login" onClick={logout}>
        🗑
      </td>
    </tr>
  );
};

export default LoginRow;
