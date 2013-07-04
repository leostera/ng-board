window.dashboard = {};

angular.module('-',
  [
    '-.services'
  , '-.widgets'
  ]);

window.dashboard.services = angular.module('-.services', []);

window.dashboard.widgets = angular.module('-.widgets',  []);

dashboard.widgets.directive('dashList',
  ['$io', '$timeout'
  , function ($io, $timeout){
    var dirObj = {
      restrict: 'EA',
      scope: {
        eventName: '@listenTo',
        limit: '@limit'
      },

      replace: false,
      template: '<ul id="list"><li ng-repeat="item in items">{{item}}</li></ul>',

      link: {
        pre: function (scope, iElement, iAttrs) {},
        post: function (scope, iElement, iAttrs) {
          var items = [];
          $io.$on(iAttrs.listenTo, function (data) {
            items.unshift(data);
            items.splice(scope.limit, 1);
            scope.items = items;
          });
        }
      }
    };
    return dirObj;
  }]);

dashboard.services.service('$io', [
  '$rootScope'
  , function ($rootScope) {

    // I don't like this
    // I feel it should be encapsulated
    // in it's own service
    var bson = bson || false;
    if(!bson) {
      console.warn("ng-board: No BSON Support!");
    }
    var BSON = !!bson ? bson().BSON : null;


    var listeners = {};
    var socket; 
    var options;

    // Binding function
    var bind = function (opts) {
      socket.on('open', function () {
        options = opts;

        $rootScope.$broadcast('io:open');

        console.log("ng-board: Connected to", opts.url);

        if(opts.open) {
          $rootScope.$apply(opts.open());
        }

        socket.on('close', function () {
          $rootScope.$broadcast('io:close');

          console.log("ng-board: Disconnected from", opts.url);

          if(opts.close) {
            $rootScope.$apply(opts.close());
          }
        });

        socket.on('message', function (message) {
          if(opts.preMessage) {
            $rootScope.$apply(opts.preMessage());
          }

          if(message[0] != '{' && BSON) {
            message = BSON.deserialize(message);
          }

          message = JSON.parse(message);  
          console.info('ng-board:', message);

          console.log("ng-board: widget", message.label);
          console.log("ng-board: data", message.data);
          if(listeners.hasOwnProperty(message.label)) {
            $rootScope.$apply(function () {
              listeners[message.label].forEach(
                function (cb) {
                  cb(message.data); 
              });
            });
          }

          if(opts.postMessage) {
            $rootScope.$apply(opts.postMessage());
          }
        });
      });
    }

    var service = {};

    service.$connect = function (url, opts) {
      if(!opts && typeof(url) === 'object') {
        opts = url;
        url = opts.url;
      } else {
        opts.url = url;
      }
      console.log(opts);

      if(socket && !opts.reconnect) {
        console.warn('ng-board: Already connected to', options.url);
        console.warn('ng-board: Pass in a \'replace\' flag in your options to reconnect.');
        return;
      }

      if(socket && opts.reconnect) {
        service.disconnect();
        socket = null;
      }

      socket = new eio.Socket(opts.url);

      // Yuk
      bind(opts);
    };

    service.$disconnect = function () {
      socket.close();
    };

    service.$on = function (eventName, callback) {
      if(!listeners[eventName]) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(callback);
    };

    return service;
  }]);