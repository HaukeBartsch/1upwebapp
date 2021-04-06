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
    this.shareWithABCD = this.shareWithABCD.bind(this);
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

  // we can do several downloads if we timeout in between to give the browser a chance to catch up
  saveAll(files) {
    /*var output_folder = "output/";
    for (i in files) {
      
    }*/
  }

  shareWithABCD() {
    if (typeof this.props.dashboard !== 'undefined') {
      var res = this.props.dashboard.resources;
      var resNames = Object.keys(this.props.dashboard.resources);
      // TODO: what if we have more than one patient here? Like a entry[0] and an entry[1]?

      // try to find some general descriptors from the Patient resource
      var patient = { lastname: "", given0: "", given1: "" };
      if (typeof this.props.dashboard.resources["Patient"] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0] !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].family !== 'undefined') {
          patient.lastname = this.props.dashboard.resources["Patient"].entry[0].resource.name[0].family;
      }
      if (typeof this.props.dashboard.resources["Patient"] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0] !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[0] !== 'undefined') {
          patient.given0 = this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[0];
      }
      if (typeof this.props.dashboard.resources["Patient"] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0] !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[1] !== 'undefined') {
          patient.given1 = this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[1];
      }

      // for each resource (Patient, ...) we can create one CSV file (array of arrays)
      var allData = [];
      for (var i = 0; i < resNames.length; i++) {
        var o = this.props.dashboard.resources[resNames[i]];
        if (this.props.dashboard.resources[resNames[i]].entry.length == 0) {
          continue;
        }
        // now flatten the structure
        var out = this.flattenObject(o);
        out = Object.assign({"user_email": this.props.user.email}, out);
        // we can convert this flat object into an array of arrays (CSV)
        var arrayRepresentation = new Array( Object.keys(out) );
        arrayRepresentation.push(Object.values(out));
        console.log(JSON.stringify(arrayRepresentation));
        var txtAsCsv = arrayRepresentation.map(function(a) { return a.map(function(a) { return JSON.stringify(a); }).join(","); }).join("\r\n");
        var file_path = "data:application/csv;charset=utf-8," + encodeURI(txtAsCsv);
        allData.push([ this.props.user.email.replace("@", "__") + "_" + patient.lastname + "_" + patient.given0 + "_" + patient.given1 + "_" + resNames[i] + ".csv", file_path]);
      }
      this.saveAll(allData);
      //console.log(JSON.stringify(res));  // we are in react.. but it works if we place a breakpoint in the browser
    }
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

  // we can do several downloads if we timeout in between to give the browser a chance to catch up
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
    // we need the current this in the next call as well
    setTimeout( function() { this.downloadAll(files); }.bind(this), 10);
  }

  convertToCSV(e) {
    //console.log(JSON.stringify(this.props));
    if (typeof this.props.dashboard !== 'undefined') {
      var res = this.props.dashboard.resources;
      var resNames = Object.keys(this.props.dashboard.resources);
      // TODO: what if we have more than one patient here? Like a entry[0] and an entry[1]?

      // try to find some general descriptors from the Patient resource
      var patient = { lastname: "", given0: "", given1: "" };
      if (typeof this.props.dashboard.resources["Patient"] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0] !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].family !== 'undefined') {
          patient.lastname = this.props.dashboard.resources["Patient"].entry[0].resource.name[0].family;
      }
      if (typeof this.props.dashboard.resources["Patient"] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0] !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[0] !== 'undefined') {
          patient.given0 = this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[0];
      }
      if (typeof this.props.dashboard.resources["Patient"] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0] !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0] !== 'undefined' && 
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given !== 'undefined' &&
          typeof this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[1] !== 'undefined') {
          patient.given1 = this.props.dashboard.resources["Patient"].entry[0].resource.name[0].given[1];
      }

      // for each resource (Patient, ...) we can create one CSV file (array of arrays)
      var allData = [];
      for (var i = 0; i < resNames.length; i++) {
        var o = this.props.dashboard.resources[resNames[i]];
        var file_path = "data:application/text;charset=utf-8," + encodeURI(JSON.stringify(this.props.dashboard.resources[resNames[i]]));
        //allData.push([ this.props.user.email.replace("@", "__") + "_" + patient.lastname + "_" + patient.given0 + "_" + patient.given1 + "_" + resNames[i] + ".csv", file_path]);
        allData.push([ this.props.user.email.replace("@", "__") + "_" + patient.lastname + "_" + patient.given0 + "_" + patient.given1 + "_" + resNames[i] + ".json", file_path]);  

        if (this.props.dashboard.resources[resNames[i]].entry.length == 0) {
          continue;
        }
        // now flatten the structure
        var out = this.flattenObject(o);
        out = Object.assign({"user_email": this.props.user.email}, out);
        // we can convert this flat object into an array of arrays (CSV)
        var arrayRepresentation = new Array( Object.keys(out) );
        arrayRepresentation.push(Object.values(out));
        console.log(JSON.stringify(arrayRepresentation));
        var txtAsCsv = arrayRepresentation.map(function(a) { return a.map(function(a) { return JSON.stringify(a); }).join(","); }).join("\r\n");
        file_path = "data:application/csv;charset=utf-8," + encodeURI(txtAsCsv);
        allData.push([ this.props.user.email.replace("@", "__") + "_" + patient.lastname + "_" + patient.given0 + "_" + patient.given1 + "_" + resNames[i] + ".csv", file_path]);
      }

      this.downloadAll(allData);
      //console.log(JSON.stringify(res));  // we are in react.. but it works if we place a breakpoint in the browser
    }
  }

  render() {
    return (
      <Layout>
        <Header user={this.props.user} />
        <div className="container">
          <br />
          <h1>Your medical information </h1>
          <p>You have a chance to review your data now. Agree below to share with ABCD.</p>
          <br />
          <div>
            {typeof this.props.dashboard.resources.Patient !== 'undefined' &&
              this.props.dashboard.resources.Patient.entry.length > 0 ? (
                <button class="btn btn-primary" id="ExportAsCSV" onClick={this.convertToCSV} title="Will download individual spreadsheets for all resources. Check with their file-size to find out if sufficient data was collected.">Review data as CSV/JSON</button>
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
          <div style={{ textAlign: 'left', height: '600px', "overflow-y": 'scroll', "background": "#EEE", "margin-top": "10px", "margin-bottom": "10px", padding: "5px" }}>
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
          { typeof this.props.dashboard.resources.Patient !== 'undefined' &&
              this.props.dashboard.resources.Patient.entry.length > 0 ?
          <button class="btn btn-primary" id="ShareWithABCD" onClick={this.shareWithABCD} title="Currently this function is not available as it needs a proper integration into the ABCD study data infrastructure." disabled>Share this data with ABCD</button>
          : ''
          }
          <div class="spacer"></div>
          <div class="spacer"></div>
          </div>
        </div>
      </Layout>
    );
  }
}
