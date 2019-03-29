import React, { Component } from 'react';
import LoginRow from './LoginRow'
import './App.css';
const sfdx = require('sfdx-node');

const INSTANCE_TEST = 'test';
const INSTANCE_PROD = 'login';

class App extends Component {
  constructor() {
    super();
    this.state = {
      orgs: {},
      loading: true,
    }
  }

  componentDidMount() {
    window.sfdx = sfdx;
    this.getOrgList();
  }

  getOrgList = () => {
    this.setState({ alias: '' });
    sfdx.org.list().then(this.setOrgState);
  }

  setOrgState = res => {
    const orgs = [];

    if (Array.isArray(res.nonScratchOrgs)) {
      orgs.push(...res.nonScratchOrgs)
    }

    if (Array.isArray(res.scratchOrgs)) {
      orgs.push(...res.scratchOrgs)
    }

    const orgsById = orgs.reduce((obj, org) => ({ ...obj, [org.orgId]: org }), {});

    this.setState({ orgs: orgsById, loading: false });
  }

  displayLogins = () => {
    const { orgs } = this.state;

    window.orgs = orgs;

    const sortedOrgIds = Object.keys(orgs)
      .sort((a, b) => {
        if (orgs[a].alias.toLowerCase() < orgs[b].alias.toLowerCase()) { return -1; }
        if (orgs[a].alias.toLowerCase() > orgs[b].alias.toLowerCase()) { return 1; }
        return 0;
      });

    console.log({ sortedOrgIds })

    return sortedOrgIds.map(orgId => (<LoginRow {...orgs[orgId]} />));
  }

  onChangeAlias = e => {
    this.setState({
      alias: e.target.value
    })
  }

  createLogin = instance => {
    this.setState({ loading: true })
    const { alias } = this.state;
    if (!alias) {
      // TOOD: Need to give user feedback they must enter an alias
      return;
    }

    let instanceUrl = `https://login.salesforce.com`;
    if (instance === INSTANCE_TEST) {
      instanceUrl = `https://test.salesforce.com`
    }

    console.log({ instanceUrl, alias })

    sfdx.auth.webLogin({
      setalias: alias,
      instanceurl: instanceUrl,
      rejectOnError: true
    })
      .then(this.getOrgList)
      .catch((x, y) => console.error('error!', x, y));

  }

  addLogin = () => {
    return (
      <div className="form-row">
        <div className="form-group">
          <div className="col-md-6">

            <input
              ref={node => {
                this.inputRef = node;
              }}
              type="text"
              className='form-control'
              value={this.state.alias}
              onChange={this.onChangeAlias}
              placeholder="Add a new login"
            />
          </div>
          <div className="col-md-3">
            <button className="btn btn-inline btn-primary" onClick={() => this.createLogin(INSTANCE_TEST)}>Sandbox</button>
          </div>
          <div className="col-md-3">
            <button className="btn btn-inline btn-secondary" onClick={() => this.createLogin(INSTANCE_PROD)}>Dev or Production</button>
          </div>
        </div>
      </div>
    )
  }

  render() {

    const { loading } = this.state;

    return (
      <div className='container-fluid'>
        {loading && (
          <header className="loading">
            <h1>loading...</h1>
          </header>
        )}
        {!loading && this.addLogin()}
        <div className='row'>
          <div className='col-xs-12 col-md-12'>
            <table className='table'>
              <thead>
                <tr>
                  <th> Username Alias </th>
                  <th> Username </th>
                  <th> Instance URL </th>
                </tr>
              </thead>
              <tbody>
                {this.displayLogins()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
