import React from 'react';
import sfdx from 'sfdx-node';

const LoginRow =
  ({ accessToken, alias, clientId, connectedStatus, instanceUrl, lastUsed, loginUrl, orgId, username }) => {

    console.log({ accessToken, alias, clientId, connectedStatus, instanceUrl, lastUsed, loginUrl, orgId, username })

    const openOrg = () => {
      console.log('opening', alias)
      window.sfdx = sfdx;
      sfdx.org.open({ targetusername: alias }).then(x => console.log('opened alias', x))
    }

    return (
      <tr className='login-row'>
        <th scope='row' onClick={openOrg} >{alias}</th>
        <td>{username}</td>
        <td>{instanceUrl}</td>
      </tr>
    );

    // https://cs3.salesforce.com/secur/frontdoor.jsp?sid=00DQ000000EebNu!ARsAQDmT2lEpHmQ_EOWJxctkcDvb0zcvIXWvHNr6iRfOqHZRw7u3aqotpweCMEsqKFsMAObpDzntD6l7swnJ9594Gk8Zs1jQ


    // accessToken: "cdc80e93e052fa74e5bb3c8fb5da6525e31339a2f60af9df4fb15ec1257400985980e7a6253a4625ebbc072a3b42ef94c322824734758d5c5208aea17c200f9b4e3fb7ddac6f7bc7564a63be3d3b683c94da688ed4ab2f3af3dec37f910eca5f209bcd12b27ced9941cf2aa6837d13179d946a3181eb:e78cc1baba3c8fb1fd174becc4e6f151"
    // alias: "coursera-gn2"
    // clientId: "PlatformCLI"
    // connectedStatus: "Connected"
    // instanceUrl: "https://cs3.salesforce.com"
    // lastUsed: Thu Mar 28 2019 18: 43: 12 GMT - 0700(Pacific Daylight Time) { }
    // loginUrl: "https://test.salesforce.com"
    // orgId: "00DQ000000EebNuMAJ"
    // username: "coursera@gonimbly.com.gonimbly2"
  }

export default LoginRow;
