var io = require('engine.io')
  , _  = require('underscore')
  , async = require('async')
  , bson  = require('bson').pure().BSON;

// module.exports
var dasboard = {
  useBSON: false,
  clients: [],

  use: function ( server ) {
    io = io.attach(server);
    io.on('connection', function ( socket ) {
      console.log("Connected client with id:", socket.id);
      this.clients.push(socket);

      this.clients.forEach(function (c) {
        c.on('close', function ( ) {
          console.log("Disconnected client with id:", c.id);
          this.clients.splice(this.clients.indexOf(c));
        }.bind(this));
      }.bind(this));
      
    }.bind(this));
  },

  send: function ( label, object, useBSON ) {
    if(this.clients.length<1) {
      // console.warn('Can\'t send message to nobody');
      return;
    }

    if(this.arguments < 3) {
      var useBSON = false;
    }

    async.forEach(this.clients, function (c, cb) {
      var obj; 

      if(this.useBSON || useBSON) {
        obj = bson.serialize({
              label: label
            , data: object
          }, false, true, false);
      } else {
        obj = JSON.stringify({
            label: label
          , data: object
        });
      }

      console.log(obj);
      c.send(obj);
      cb(null);
    }, function (errors) {
      if(errors) {
        console.error(errors);
      }
    });
  }
};

var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

var c = 0;

dasboard.use(server);

setInterval(function () {
  dasboard.send("volume", 7+(Math.sin(c)*3) );
  c+=1;
}, 100);

setInterval(function () {
  dasboard.send("messageCount", c);
  c+=1;
}, 50);


app.use(express.static('public'));
app.get('/', function(req, res, next){
  res.sendfile('public/index.html');
});

server.listen(process.env.PORT || 3000, function(){
  console.log('\033[96mlistening on localhost:3000 \033[39m');
});