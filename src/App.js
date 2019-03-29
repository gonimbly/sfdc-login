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
    return Object.keys(this.state.orgs).map(orgId => <LoginRow {...this.state.orgs[orgId]} />);
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
    console.log(this.state.alias)
    return (
      <div>

        <input value={this.state.alias} name="alias" placeholder="enter org alias" onChange={this.onChangeAlias}></input>
        <button onClick={() => this.createLogin(INSTANCE_TEST)}>Sandbox</button>
        <button onClick={() => this.createLogin(INSTANCE_PROD)}>Dev or Production</button>
      </div>
    )
  }

  render() {

    const { loading } = this.state;

    return (
      <div className="App">
        {loading && (
          <header className="App-header">
            <h1>loading...</h1>
          </header>
        )}
        {!loading && this.addLogin()}
        <ul>
          {this.displayLogins()}
        </ul>
      </div>
    );
  }
}

export default App;
