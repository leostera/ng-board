window.app = angular.module('Dash',
  [
    'Dash.services'
  ]);

window.services = angular.module('Dash.services',
  []);


services.service('$io', [
  '$rootScope'
  , function ($rootScope) {
    var BSON = bson().BSON;
    var socket = new eio.Socket(); 
    var listeners = {};

    socket.on('open', function () {
      $rootScope.$broadcast('io:open');
      console.log("Connected!");

      socket.on('close', function () {
        $rootScope.$broadcast('io:close');
        console.log("Disconnected!");
        // socket.open();
      });

      socket.on('message', function (message) {
        console.log("RAW:",message);
        if(message[0] != '{') {
          message = BSON.deserialize(message);
          console.log("BSON:",message);
        }
        message = JSON.parse(message);  
        console.log("JSON:",message);

        if(listeners.hasOwnProperty(message.label)) {
          $rootScope.$apply(function () {
            listeners[message.label].forEach(
              function (cb) {
                cb(message.data); 
            });
          });
        }
      });
    });

    var service = {};

    service.$on = function (eventName, callback) {
      if(!listeners[eventName]) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(callback);
    };

    return service;
  }]);


app.controller('WidgetTest',
  ['$scope', '$io'
  , function ($scope, $io) {
    $io.$on('Johnny Label', function (data) {
      $scope.johnny = data;
    });

    $io.$on('Other Label', function (data) {
      $scope.another = data;
    });
  }]);