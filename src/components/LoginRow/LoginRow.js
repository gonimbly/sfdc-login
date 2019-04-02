import React from "react";
import classnames from "classnames";
import "./styles.css";

const LoginRow = ({ alias, connectedStatus, username, logout, openOrg }) => {
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
