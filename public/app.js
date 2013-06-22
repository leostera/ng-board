window.app = angular.module('Dash',
  [
    'Dash.services'
  ]);

window.services = angular.module('Dash.services',
  []);


services.service('$io', [
  '$rootScope'
  , function ($rootScope) {
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
        message = JSON.parse(message);
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
      console.log(listeners[eventName]);
    };

    return service;
  }]);


app.controller('WidgetTest',
  ['$scope', '$io'
  , function ($scope, $io) {
    $io.$on('Johnny Label', function (data) {
      console.log("Johnny Label got something!", data);
    });

    $io.$on('Other Label', function (data) {
      console.log("Other Label got something!", data);
    });
  }]);