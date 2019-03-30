import React, { Component, Fragment } from "react";
import LoginRow from "components/LoginRow";
import Spinner from "components/Spinner";
import AddLogin from "components/AddLogin";
const sfdx = require("sfdx-node");

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

    console.log({ orgsById });

    this.setState({ orgs: orgsById, loading: false, loadingMsg: "" });
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
        logout={() => this.logout(orgs[orgId].alias)}
      />
    ));
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
