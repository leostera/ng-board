window.app = angular.module('Dash',
  [
    'Dash.services'
  , 'Dash.widgets'
  ]);

window.services = angular.module('Dash.services',
  []);

window.directives = angular.module('Dash.widgets',
  []);

directives.directive('dashCounter',
  ['$io'
  , function ($io){
    var dirObj = {
      // Can be both an attribute and an element
      // I'd rather it'd be an element thou
      restrict: 'EA',
      
      link: function postLink(scope, iElement, iAttrs) {
        $io.$on(iAttrs.listenTo, function (data) {
          scope.count = data;
        });
      }
    };
    return dirObj;
  }]);

directives.directive('dashSmoothie',
  ['$io', '$timeout'
  , function ($io, $timeout){
    var dirObj = {
      // Can be both an attribute and an element
      // I'd rather it'd be an element thou
      restrict: 'EA',

      scope: {
        eventName: '@listenTo',
        height: '@height',
        width: '@width'
      },

      replace: false,
      template: '<canvas id="{{eventName}}_chart" height="{{height}}" width="{{width}}"></canvas>',
      
      link: {
        pre: function (scope, iElement, iAttrs) {
        },
        post: function (scope, iElement, iAttrs) {
          scope.smoothie = new SmoothieChart({
            millisPerPixel: iAttrs.speed || 20,
            interpolation: iAttrs.interpolation || 'bezier'
          });
          scope.time = new TimeSeries();

          console.log(iAttrs);
          
          $timeout(function () {
            scope.smoothie.streamTo($('#'+scope.eventName+'_chart')[0], 1000);
            scope.smoothie.addTimeSeries(scope.time, {
              strokeStyle: iAttrs.strokeStyle || '#00ff00',
              fillStyle: iAttrs.fillStyle,
              lineWidth: iAttrs.lineWidth || 2
            });
          },100);
          
          $io.$on(iAttrs.listenTo, function (data) {
            scope.time.append(new Date().getTime(),data);
          });
        }
      }
    };
    return dirObj;
  }]);


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
        if(message[0] != '{') {
          message = BSON.deserialize(message);
        }
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
    };

    return service;
  }]);