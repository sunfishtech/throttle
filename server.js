var http = require('http'),
    httpProxy = require('http-proxy');

var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(1, 1000);
var getRawBody = require('raw-body');
var request = require('superagent');
var plivo = require('plivo');
var url = require('url');


var sms = plivo.RestAPI({
  authId:process.env.PLIVO_AUTH_ID,
  authToken:process.env.PLIVO_AUTH_TOKEN
});

var params = {
  src:'13308463085',
  dst:'17074777548',
  text:'Well then. What gives?'
}

// sms.send_message(params,function(status,response){
//   console.log('Status: ',status);
//   console.log('API Response:\n',response);
//   for (uuid in response['message_uuid']){
//     console.log('Message UUID: ',uuid.toString());
//   }
// });



//
// Create a proxy server with latency
//
var proxy = httpProxy.createProxyServer();

console.log("here we go, listening on port 8000");

http.createServer(function (req,res){
  extractRequest(req).then(function(serialized){
    var parts = url.parse(req.url,true);
    var number = parts.query['number'];
    var message = parts.query['message'];
    if (number && message){
      sms.send_message(Object.assign(params,{dst:number,text:message}),function(status,response){
        console.log(response);
      });
    } else {
      console.log("no message");
    }
    res.write(JSON.stringify(serialized,true, 2));
    res.end();
  });
},function(err){
  console.log(err);
}).listen(8000);

//
// Create your server that makes an operation that waits a while
// and then proxies the request
//
http.createServer(function (req, res) {
  // This simulates an operation that takes 500ms to execute
  limiter.removeTokens(1, function(){
    proxy.web(req, res, {
      target: 'http://localhost:9008'
    });
  });
}).listen(8008);

//
// Create your target server
//
http.createServer(function (req, res) {
  console.log(new Date());
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('request successfully proxied to: ' + req.url + '\n' + JSON.stringify(req.headers, true, 2));
  res.end();
}).listen(9008);

function extractRequest(req){
  return new Promise(function(resolve,reject){
    getRawBody(req).then(function (buff){
      resolve({
        url:req.url,
        headers:req.headers,
        body:buff.toString(),
        method:req.method
      });
    });  
  });
}