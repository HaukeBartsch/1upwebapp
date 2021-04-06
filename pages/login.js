import React from 'react';
import 'isomorphic-fetch';
import Header from '../components/Header.js';
import Layout from '../components/layouts/Layout';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitted: false,
      email: '',
    };
  }

  onSubmit = e => {
    e.preventDefault();
    this.setState({
      submitted: true,
    });

    window.fetch('/sendtoken', {
      method: 'POST',
      body: JSON.stringify({ user: this.state.email }),
      headers: new window.Headers({
        'Content-Type': 'application/json',
      }),
    });
  };

  onEmailChange = e => {
    this.setState({
      email: e.target.value,
    });
  };

  welcomeText = () => {
    return (
      <div className="container">
        <div className="jumbotron bg-light">
          <h1>
            Welcome to the <a href="https://localhost:3000">ABCD Donate Your Data</a> Demo App.
          </h1>
          <p>
            This service is for ABCD participants only. You can sign in, connect your health systems, and view and donate your medical
            record. Learn more about ABCD{' '}
            <a href="https://abcd-study.ucsd.edu">here</a>. This application uses the 1UpHealth API for data transfers.
            Data is cached on servers of 1UpHealth before the user decides to shared with the ABCD study.
          </p>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.submitted) {
      return (
        <Layout>
          <Header />
          <div className="container">
            <br />
            <br />
            <div className="row">
              {this.welcomeText()}
              <div className="container  text-center">
                <h1>
                  Check your email. <br />
                  We sent a magic link to log into your account. By showing that you have access to this email address we will verify that its you who shares data with ABCD.
                </h1>
              </div>
            </div>
          </div>
          <br />
          <br />
          <br />
        </Layout>
      );
    }

    return (
      <Layout className="cent">
        <Header />
        <div className="container">
          <br />
          <br />
          <div className="row text-center">
            {this.welcomeText()}
            <div className="container">
              <form onSubmit={this.onSubmit}>
                <h3>Login using your email</h3>
                <input
                  onChange={this.onEmailChange}
                  value={this.state.email}
                  type="email"
                  className="form-control col-sm-4"
                  required
                  placeholder="email@domain.org"
                  autoFocus
                  style={{ display: 'unset' }}
                />
                <br />
                <input
                  type="submit"
                  className="btn btn-primary col-sm-4 mt-2"
                  value="Login"
                />
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}
