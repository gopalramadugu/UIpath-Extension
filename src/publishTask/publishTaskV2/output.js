function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

axios({
  method: 'post',
  url: publishurl,
  headers: _objectSpread({
    'Content-Type': 'multipart/form-data'
  }, headers),
  data: formData,
  maxContentLength: Infinity,
  maxBodyLength: Infinity
}).then(response => {
  if (response.data.unAuthorizedRequest === true) {
    tl.setResult(tl.TaskResult.Failed, 'Unauthroized Access to RPA AUthenticate');
    tl.exit(1);
  }

  console.log(response.status);
}).catch(error => {
  console.log(error);
  tl.setResult(tl.TaskResult.Failed, error);
  tl.exit(1);
});