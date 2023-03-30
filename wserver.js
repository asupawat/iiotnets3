var express = require('express');
var expressWs = require('express-ws');
var expressWs = expressWs(express());

var app = expressWs.app;

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

app.ws('/*', function(ws, req) {
  ws.id = req.headers['sec-websocket-key'];
  ws.group =  req.url.split("/.websocket")[0];
  var info = ws.group.split("@");
  ws.device = "";
  if(info[1] == "iiotnet") {
    ws.group =  info[0];
    ws.device = info[1];
  }
  ws.session = Date.now();
  console.log(ws.group+'/'+ws.device+'['+ws.id+'] connected from '+ws._socket.remoteAddress);
  //console.log(ws);
  ws.on('close', () => console.log(ws.group+'/'+ws.device+'['+ws.id+'] has disconnected! '+ws._socket.remoteAddress))
  ws.onmessage = function(msg) {
    if(isJson(msg.data)) {
        console.log(ws.group+'/'+ws.device+'['+ws.id+'] => '+msg.data);
        var obj = JSON.parse(msg.data);
        Array.from(expressWs.getWss().clients).filter((sock)=>{
            //console.log(sock.group+sock.device+"["+sock.id+"] "+sock._socket.remoteAddress+" => "+sock.session);
            if(ws.group == sock.group && sock.session != ws.session) {
                // browser -> iiotnet
                if(ws.device == "" && sock.device == "iiotnet") {
                    obj.session = ws.session;
                    return true;
                }
                // iiotnet -> browser
                if(ws.device == "iiotnet" && sock.device == "" && (obj.session == sock.session || obj.session == "all")) {
                    return true;
                }
            }
            return false;
        }).forEach(function (client) {
            var message = JSON.stringify(obj);
            client.send(message);
            //console.log(message);
        });
    }
  };
});

app.listen(8080);