var https = require('https');
var fs = require('fs');

var phoneModels = fs.readFileSync('./ph_modelsql.xml','utf-8');
var reqopts = {
  host : '10.27.0.21',
  path : '/axl/',
  port : 8443,
  method : 'POST',
  rejectUnauthorized : false,
  auth : 'womacks:7r4nC3nDenc3!!',
  headers : {
    'Content-Type' : 'text/xml',
    'SOAPAction' : 'CUCM:DB ver=9.1'
  }
};
var r = https.request(reqopts, function(res) {
  console.log(res.statusCode);
  res.setEncoding('utf8');
  res.on('data', function(chunk) {
    console.log('Response: ' + chunk);
  });
  res.on('error', function(err) {
    console.log(err);
  });
});
r.write(phoneModels);
r.end();
