import React, { Component, Fragment } from "react";
import LoginRow from "components/LoginRow";
import Spinner from "components/Spinner";
import AddLogin from "components/AddLogin";

import img from "../../img/key-logo.png";

const sfdx = require("sfdx-node");

let tray = new nw.Tray({
  tooltip: "SFDC Login Manager",
  title: "🔑",
  icon: "../../img/key-logo.png",
  altIcon: "../../img/key-logo.png",
  iconsAreTemplates: false
});

const INSTANCE_TEST = "test";
const INSTANCE_PROD = "login";

class App extends Component {
  constructor() {
    super();
    this.state = {
      orgs: {},
      loading: true,
      loadingMsg: "Loading connected usernames..."
    };
  }

  componentDidMount() {
    window.sfdx = sfdx;
    this.getOrgList();
  }

  getOrgList = () => {
    this.setState({ alias: "" });
    sfdx.org.list().then(this.setOrgState);
  };

  setOrgState = res => {
    const orgs = [];

    if (Array.isArray(res.nonScratchOrgs)) {
      orgs.push(...res.nonScratchOrgs);
    }

    if (Array.isArray(res.scratchOrgs)) {
      orgs.push(...res.scratchOrgs);
    }

    const orgsById = orgs.reduce(
      (obj, org) => ({ ...obj, [org.orgId]: org }),
      {}
    );

    this.setState({ orgs: orgsById, loading: false, loadingMsg: "" });
    this.setOrgMenu(orgs);
  };

  setOrgMenu = orgs => {
    tray.remove();
    tray = null;
    tray = new nw.Tray({
      tooltip: "SFDC Login Manager",
      title: "🔑",
      icon: "../../img/key-logo.png",
      altIcon: "../../img/key-logo.png",
      iconsAreTemplates: false
    });
    window.img = img;
    const menu = new nw.Menu();
    orgs.forEach(org => {
      if (!org.alias || org.connectedStatus !== "Connected") return;
      menu.append(
        new nw.MenuItem({
          type: "normal",
          label: org.alias,
          click: () => {
            this.openOrg(org.alias);
          }
        })
      );
    });
    tray.menu = menu;
  };

  displayLogins = () => {
    const { orgs } = this.state;

    window.orgs = orgs;

    const sortedOrgIds = Object.keys(orgs)
      .filter(orgId => Boolean(orgs[orgId].alias))
      .sort((a, b) => {
        if (orgs[a].alias.toLowerCase() < orgs[b].alias.toLowerCase()) {
          return -1;
        }
        if (orgs[a].alias.toLowerCase() > orgs[b].alias.toLowerCase()) {
          return 1;
        }
        return 0;
      });

    return sortedOrgIds.map(orgId => (
      <LoginRow
        key={orgId}
        {...orgs[orgId]}
        openOrg={() => this.openOrg(orgs[orgId].alias)}
        logout={() => this.logout(orgs[orgId].alias)}
      />
    ));
  };

  openOrg = alias => {
    sfdx.org
      .open({ targetusername: alias })
      .then(x => console.log("opened alias", x));
  };

  logout = targetusername => {
    console.log("logging out of ", targetusername);
    this.setState({
      loading: true,
      loadingMsg: `Logging out of ${targetusername}...`
    });
    sfdx.auth
      .logout({ targetusername, rejectOnError: true, noprompt: true })
      .then(this.getOrgList)
      .catch(err => {
        console.log("Error logging out", err);
        this.setState({ loading: false, loadingMsg: "" });
      });
  };

  onChangeAlias = e => {
    this.setState({
      alias: e.target.value
    });
  };

  createLogin = instance => {
    const { alias } = this.state;
    this.setState({
      loading: true,
      loadingMsg: `Creating ${alias}. Please login in your browser and allow SFDX to access your org.`
    });
    if (!alias) {
      // TODO: Need to give user feedback they must enter an alias
      return;
    }

    let instanceUrl = `https://login.salesforce.com`;
    if (instance === INSTANCE_TEST) {
      instanceUrl = `https://test.salesforce.com`;
    }

    console.log({ instanceUrl, alias });

    sfdx.auth
      .webLogin({
        setalias: alias,
        instanceurl: instanceUrl,
        rejectOnError: true
      })
      .then(this.getOrgList)
      .catch((x, y) => console.error("error!", x, y));
  };

  addLogin = () => {
    return (
      <AddLogin
        forTestUrl={() => this.createLogin(INSTANCE_TEST)}
        forLoginUrl={() => this.createLogin(INSTANCE_PROD)}
        alias={this.state.alias}
        onChangeAlias={this.onChangeAlias}
      />
    );
  };

  render() {
    const { loading, loadingMsg } = this.state;

    return (
      <Fragment>
        <Spinner message={loadingMsg} loading={loading} />
        <div className="container-fluid">
          {this.addLogin()}
          <div className="row">
            <div className="col-xs-12 col-md-12">
              <table className="table">
                <thead>
                  <tr>
                    <th> Username Alias </th>
                    <th> Username </th>
                    <th />
                  </tr>
                </thead>
                <tbody>{this.displayLogins()}</tbody>
              </table>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default App;
