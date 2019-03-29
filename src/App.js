import React, { Component, Fragment } from "react";
import LoginRow from "./LoginRow";
import Spinner from "components/Spinner";
import AddLogin from "components/AddLogin";
import "./App.css";
const sfdx = require("sfdx-node");

const INSTANCE_TEST = "test";
const INSTANCE_PROD = "login";

class App extends Component {
  constructor() {
    super();
    this.state = {
      orgs: {},
      loading: true
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

    this.setState({ orgs: orgsById, loading: false });
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

    return sortedOrgIds.map(orgId => <LoginRow {...orgs[orgId]} />);
  };

  onChangeAlias = e => {
    this.setState({
      alias: e.target.value
    });
  };

  createLogin = instance => {
    this.setState({ loading: true });
    const { alias } = this.state;
    if (!alias) {
      // TOOD: Need to give user feedback they must enter an alias
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
    const { loading } = this.state;

    return (
      <Fragment>
        {loading && (
          <div className="loading">
            <div className="dropdown-loading">
              <Spinner />
            </div>
          </div>
        )}
        <div className="container-fluid">
          {this.addLogin()}
          <div className="row">
            <div className="col-xs-12 col-md-12">
              <table className="table">
                <thead>
                  <tr>
                    <th> Username Alias </th>
                    <th> Username </th>
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
