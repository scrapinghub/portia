import Ember from 'ember';
import config from '../config/environment';

/* global URI */

var DEFAULT_COMMANDS = Object.freeze({
    heartbeat: function() {},
});

var defaultUrl = function() {
    var uri = URI.parse(config.SLYD_URL || window.location.protocol + '//' + window.location.host);
    if (!/wss?/.test(uri.protocol)) {
        uri.protocol = uri.protocol === 'https' ? 'wss' : 'ws';
    }
    uri.path = '/ws';
    return URI.build(uri);
};

var FerryWebsocket = function(options) {
    options = options || {};
    this.commands = options.commands || {};
    this.url = options.url || defaultUrl();
    this.cleanup = options.cleanup || function() {};
    this.init = options.init || function() {};
    this.protocols = options.protocols;
    this.commands = this._buildCommands(options.commands || {});
    this.ws = null;
    this.closed = true;
};

FerryWebsocket.prototype.connect = function() {
    return this._createWebsocket();
};

FerryWebsocket.prototype._createWebsocket = function() {
    var ws, deferred = new Ember.RSVP.defer();
    try {
        ws = new WebSocket(this.url);
    } catch (err) {
        Ember.Logger.log('Error connecting to server: ' + err);
    }
    ws.onclose = function() {
        this.cleanup();
        this.closed = true;
        Ember.Logger.log('<Closed Websocket>');
        Ember.run.later(this, function() {
            this._createWebsocket();
        }.bind(this), 5000);
    }.bind(this);
    ws.onmessage = function(e) {
        var data;
        try {
            data = JSON.parse(e.data);
        } catch (err) {
            Ember.Logger.warn('Error parsing data returned by server: ' + err + '\n' + data);
            return;
        }
        var command = data._command;
        if (!command) {
            Ember.Logger.warn('Received response with no command: ' + e.data);
            return;
        }
        if (command in this.commands) {
            if (Object.keys(data).length > 1) {
                console.log(data)
            }
            this.commands[command](data);
        } else {
            Ember.Logger.warn('Received unknown command: ' + command);
        }
    }.bind(this);
    ws.onopen = function() {
        Ember.Logger.log('<Opened Websocket>');
        deferred.resolve(this);
        this.closed = false;
        setInterval(function() {
            this.send({_command: 'heartbeat'});
        }.bind(this), 20000);
    }.bind(this);
    this.ws = ws;
    return deferred.promise;
};

FerryWebsocket.prototype._buildCommands = function(commands) {
    var key,
        result = {};
    for (key in DEFAULT_COMMANDS) {
        result[key] = DEFAULT_COMMANDS[key];
    }
    for (key in commands) {
        result[key] = commands[key];
    }
    return result;
};

FerryWebsocket.prototype.addCommand = function(command, func) {
    this.commands[command] = func;
};

FerryWebsocket.prototype.close = function(code, reason) {
    code = code || 1000;
    reason = reason || 'application called close';
    return this.ws.close();
};

FerryWebsocket.prototype.send = function(data) {
    if (!this.closed && data) {
        if (typeof data !== 'string') {
            try {
                data = JSON.stringify(data);
            } catch (err) {
                Ember.Logger.warn('Error sending data to server: ' +  err);
                return;
            }
        }
        return this.ws.send(data);
    }
};


export default FerryWebsocket;