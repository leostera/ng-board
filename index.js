var io = require('engine.io')
  , _  = require('underscore');

// module.exports
var dasboard = {
  clients: [],

  use: function ( server ) {
    io = io.attach(server);
    io.on('connection', function ( socket ) {
      console.log("Connected client with id:", socket.id);
      this.clients.push(socket);

      this.clients.forEach(function (c) {
        c.on('close', function ( ) {
          console.log("Disconnected client with id:", c.id);
          this.clients.splice(clients.indexOf(c));
        }.bind(this));
      }.bind(this));
      
    }.bind(this));
  },

  send: function ( label, data ) {
    this.clients.forEach(function (c) {
      console.log("Sending", data, "(", label, ") to", c.id);
      var json_obj = JSON.stringify({ label: label, id:c.id, data: data });
      c.send(json_obj);
    });
  }
};

var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

dasboard.use(server);

setInterval(function () {
  dasboard.send("Johnny Label", new Date() );
}, 500);

app.use(express.static('public'));
app.get('/', function(req, res, next){
  res.sendfile('public/index.html');
});

server.listen(process.env.PORT || 3000, function(){
  console.log('\033[96mlistening on localhost:3000 \033[39m');
});