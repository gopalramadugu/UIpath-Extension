var path = require('path');
var tl = require('vso-task-lib');
const extension = '.nupkg';

var authenticateurl = tl.getInput('authenticateurl', true);
var username = tl.getInput('username', true);
var password = tl.getInput('password', true);
var tenancy = tl.getInput('tenancyName', false);
var publishurl = tl.getInput('publishurl', true);
var artifactname = tl.getInput('artifactname',false);
var artifactdirectory = tl.getInput('artifactdirectory',true);


function run() {
  try {
    const axios = require('axios');
    var FormData = require('form-data');
    var fs = require('fs');
 

    var readartifactPromise = readartifact(fs, artifactdirectory, artifactname);

    readartifactPromise.then(function (artifact) {
      try {

        var authenticatePromise = authenticate(axios, authenticateurl, tenancy, username, password);
        authenticatePromise.then(function (authtoken) {
          publish(FormData, fs, artifact, axios, publishurl, authtoken);
        });
      } catch (error) {
        console.log(error);
        tl.setResult(tl.TaskResult.Failed, error);
        tl.exit(1);
      }
    }).catch( (err) => {
      tl.setResult(tl.TaskResult.Failed, err.message);
      tl.exit(1);
    }
);

  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

function readartifact(fs, artifactdirectory, artifactname) {

  let artifact;
  let count = 0;
  console.log(artifactdirectory);
  return new Promise(function (resolve, reject) {

    
    fs.readdir(artifactdirectory, (err, files) => {

      try {
        files.forEach(file => {
          if (typeof artifactname !== 'undefined' && artifactname !== null) {
            if (file.includes(extension)) {
              artifact = artifactdirectory +'/'+ file;
              count = count + 1;
            }
          }
          else if (file.includes(artifactname) && file.includes(extension)) {
            artifact =  artifactdirectory +'/'+ file;
            count = count + 1;
          }
        });

        if(count > 1){
          console.log('Multiple Artifacts found please mention artifact name');
          reject(new Error('Multiple Artifacts found please mention artifact name'));
        } 

        if (typeof err !== 'undefined' && err !== null) {
          reject(err)
        }
        resolve(artifact);

      } catch (error) {
        console.log(error);
        tl.setResult(tl.TaskResult.Failed, error);
        tl.exit(1);
      }
    });
  });
}

function authenticate(axios, authenticateurl, tenancy, username, password) {

  return new Promise(function (resolve, reject) {
    axios.post(authenticateurl, {
      tenancyName: tenancy,
      usernameOrEmailAddress: username,
      password: password,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })
      .then(response => {
        if (response.data.unAuthorizedRequest === true) {
          tl.setResult(tl.TaskResult.Failed, 'Unauthroized Access to RPA AUthenticate');
          tl.exit(1);
        }

        authtoken = response.data.result


        if (!authtoken) {
          tl.setResult(tl.TaskResult.Failed, 'Got Empty Access token from RPA AUthenticate');
          tl.exit(1);
        }

        resolve(authtoken);
      }).catch(error => {
        console.log(error);
        tl.setResult(tl.TaskResult.Failed, error);
        tl.exit(1);
      });
  });
}

function publish(FormData, fs, artifact, axios, publishurl, authtoken) {


  var formData = new FormData();
  formData.append('file', fs.createReadStream(artifact));
  var headers = formData.getHeaders();
  var contenttype = headers['content-type'];

  axios({
    method: 'post',
    url: publishurl,
    headers: {
      'Authorization': `Bearer ${authtoken}`,
      'Content-Type': contenttype
    },
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
    .then(response => {
      if (response.data.unAuthorizedRequest === true) {
        tl.setResult(tl.TaskResult.Failed, 'Unauthroized Access to RPA AUthenticate');
        tl.exit(1);
      }

      console.log(response.status);

    })
    .catch(error => {
      console.log(error);
      tl.setResult(tl.TaskResult.Failed, error);
      tl.exit(1);
    });

}

module.exports.run = run;