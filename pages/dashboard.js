import React from 'react';
import Link from 'next/link';
import fetch from 'isomorphic-fetch';
import { authenticate } from '../utils';
import Header from '../components/Header.js';
import Layout from '../components/layouts/Layout';
import { FhirResource } from 'fhir-react';
const {
  displayInOrder: resourcesListToDisplayInOrder,
} = require('../resourcesConfig');

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.convertToCSV = this.convertToCSV.bind(this);
  }


  static async getInitialProps({ req, res }) {
    const user = await authenticate(req, res);
    if (typeof req === 'undefined') {
      let dashboard = await fetch(`http://localhost:3000/api/dashboard`, {
        credentials: 'include',
      }).then(r => r.json());
      return { dashboard, user };
    } else {
      let authHeader = {
        Authorization: 'Bearer ' + req.session.oneup_access_token,
      };
      let dashboard = await fetch(`http://localhost:3000/api/dashboard`, {
        headers: authHeader,
      }).then(r => r.json());
      return { dashboard, user };
    }
  }

  componentDidMount() {
    if (this.props.user) {
      try {
        window.localStorage.setItem('email', this.props.user.email);
        window.localStorage.setItem(
          'oneup_access_token',
          this.props.user.oneup_access_token,
        );
      } catch (err) { }
    } else {
      window.localStorage.remove('email');
      window.localStorage.remove('oneup_access_token');
    }
    this.documentLink = document;
  }

  shareWithABCD() {

  }

  flattenObject(ob) {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = this.flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
  }

  downloadAll(files){
    if (files.length == 0) 
       return;
    var file = files.pop();
    var a = this.documentLink.createElement("A");
    a.href = file[1];
    a.download = file[0];
    this.documentLink.body.appendChild(a);
    a.click();
    this.documentLink.body.removeChild(a);
    setTimeout( function() { this.downloadAll(files); }.bind(this), 10);
  }

  convertToCSV(e) {
    console.log(JSON.stringify(this.props));
    if (typeof this.props.dashboard !== 'undefined') {
      var res = this.props.dashboard.resources;
      var resNames = Object.keys(this.props.dashboard.resources);
      // for each resource (Patient, ...) we can create one CSV file (array of arrays)
      var allData = [];
      for (var i = 0; i < resNames.length; i++) {
        var o = this.props.dashboard.resources[resNames[i]];
        if (this.props.dashboard.resources[resNames[i]].entry.length == 0) {
          continue;
        }
        // now flatten the structure
        var out = this.flattenObject(o);
        // we can convert this flat object into an array of arrays (CSV)
        var arrayRepresentation = new Array( Object.keys(out) );
        arrayRepresentation.push(Object.values(out));
        console.log(JSON.stringify(arrayRepresentation));
        var txtAsCsv = arrayRepresentation.map(function(a) { return a.map(function(a) { return JSON.stringify(a); }).join(","); }).join("\r\n");
        var file_path = "data:application/csv;charset=utf-8," + encodeURI(txtAsCsv);
        allData.push([ resNames[i] + ".csv", file_path]);
        /*
        var a = this.documentLink.createElement("A");
        a.href = file_path; // "/exported_" + resNames[i] + "/" + resNames[i] + ".csv";
        a.download = resNames[i] + ".csv";
        this.documentLink.body.appendChild(a);
        a.click();
        this.documentLink.body.removeChild(a);
        */
      }
      this.downloadAll(allData);
      console.log(JSON.stringify(res));  // we are in react.. but it works if we place a breakpoint in the browser
    }
  }

  render() {
    return (
      <Layout>
        <Header user={this.props.user} />
        <div className="container">
          <br />
          <h1>Your medical information </h1>
          <p>Review your data and agree below to share with ABCD. You may review the content of the shared data as a spreadsheet (Review data as CSV).</p>
          <br />
          <button class="btn btn-primary" id="ExportAsCSV" onClick={this.convertToCSV} title="Will download individual spreadsheets for all resources. Check with their file-size to find out if sufficient data was collected.">Review data as CSV</button>
          <br />
          <div>
            {typeof this.props.dashboard.resources.Patient !== 'undefined' &&
              this.props.dashboard.resources.Patient.entry.length > 0 ? (
                ''
              ) : (
                <div>
                  <br />
                  <br />
                  <br />
                Looks like you have no patient data
                  <br />
                  <Link>
                    <a href="/">Connect some health systems (requires your email and password with the provider)</a>
                  </Link>
                </div>
              )}
          </div>
          <div style={{ textAlign: 'left', height: '600px', "overflow-y": 'scroll', "background": "#EEE", "margin-top": "10px", "margin-bottom": "10px" }}>
            {resourcesListToDisplayInOrder.map(
              function (resourceType) {
                return (
                  <div>
                    {typeof this.props.dashboard.resources[resourceType] !=
                      'undefined' &&
                      this.props.dashboard.resources[resourceType].entry.length >
                      0 ? (
                        <h1>{resourceType}</h1>
                      ) : (
                        ''
                      )}
                    {typeof this.props.dashboard.resources[resourceType] !=
                      'undefined'
                      ? this.props.dashboard.resources[resourceType].entry.map(
                        function (resourceContainer) {
                          return (
                            <FhirResource
                              fhirResource={resourceContainer.resource}
                              fhirVersion={resourceContainer.fhirVersion}
                            />
                          );
                        },
                      )
                      : ''}
                    <br />
                  </div>
                );
              }.bind(this),
            )}
          </div>
          <div>
          <button class="btn btn-primary" id="ShareWithABCD" onClick={this.shareWithABCD} title="Currently this function is not available as it needs a proper integration into the ABCD study data infrastructure." disabled>Share this data with ABCD</button>&nbsp;
          <div class="spacer"></div>
          <div class="spacer"></div>
          </div>
        </div>
      </Layout>
    );
  }
}
