import React from "react";
import sfdx from "sfdx-node";

const LoginRow = ({
  accessToken,
  alias,
  clientId,
  connectedStatus,
  instanceUrl,
  lastUsed,
  loginUrl,
  orgId,
  username
}) => {
  console.log({
    accessToken,
    alias,
    clientId,
    connectedStatus,
    instanceUrl,
    lastUsed,
    loginUrl,
    orgId,
    username
  });

  const openOrg = () => {
    console.log("opening", alias);
    window.sfdx = sfdx;
    sfdx.org
      .open({ targetusername: alias })
      .then(x => console.log("opened alias", x));
  };

  return (
    <tr className="login-row">
      <th scope="row" onClick={openOrg}>
        {alias}
      </th>
      <td>{username}</td>
    </tr>
  );
};

export default LoginRow;
