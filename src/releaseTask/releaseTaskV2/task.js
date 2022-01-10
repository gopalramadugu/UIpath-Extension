var path = require('path');
var tl = require('vso-task-lib');
const extension = '.nupkg';

function run() {
  try {

     
    var authenticateurl = tl.getInput('authenticateurl', true);
    var username = tl.getInput('username', true);
    var password = tl.getInput('password', true);
    var tenancy = tl.getInput('tenancy', false);
    var updatepackageurl = tl.getInput('updatepackageurl', true);
    var artifactdirectory = tl.getInput('artifactdirectory', true);
    var artifactname = tl.getInput('artifactname', false);


    const axios = require('axios');
    var fs = require('fs'); 
    let packageversion = '';
    var packageNm;

    var readartifactPromise = readartifact(fs, artifactdirectory, artifactname);

    readartifactPromise.then(function (artifact) {

      try {
        if (!artifact) {
          tl.setResult(tl.TaskResult.Failed, 'No Package found in Artifacts folder');
          tl.exit(1);
        }

        packageNm = artifact.split('.');
        
        packageNm.forEach((value, i) => {
          if (i != 0 && i < packageNm.length - 1) {
              if(i === packageNm.length - 2){
              packageversion = packageversion + value ;
              }
              else{
              packageversion = packageversion + value + '.';
            }
          }
        });

        var authenticatePromise = authenticate(axios, authenticateurl, tenancy, username, password);
        authenticatePromise.then(function (authtoken) {

          //axios.defaults.headers.common['Authorization'] = 'Bearer '+authtoken;
          release(axios, authtoken, updatepackageurl, packageversion, updatepackageurl, authtoken); 

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
    tl.exit(1);
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
              artifact =  file;
              count = count + 1;
            }
          }
          else if (file.includes(artifactname) && file.includes(extension)) {
            artifact =  file;
            count = count + 1;
          }
        });

        if(count > 1){
          console.log('MUltiple Artifacts found please mention artifact name');
          reject(new Error('MUltiple Artifacts found please mention artifact name'));
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

function release(axios, authtoken, updatepackageurl, packageversion, updatepackageurl, authtoken) {
  const axiosInstance = axios.create({

    headers: {
      'Authorization': `Bearer ${authtoken}`,
      'Content-Type': 'application/json'
    }
  });

  axiosInstance.post(updatepackageurl, {
    packageVersion: packageversion,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
    .then(response => {
      if (response.data.unAuthorizedRequest === false) {
        tl.setResult(tl.TaskResult.Failed, 'Unauthroized Access to RPA AUthenticate');
        tl.exit(1);
      }


      if (!authtoken) {
        tl.setResult(tl.TaskResult.Failed, 'Got Empty Access token from RPA AUthenticate');
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