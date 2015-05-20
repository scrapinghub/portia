import Ember from 'ember';
import config from '../config/environment';

/* global URI */

const DEFAULT_RECONNECT_TIMEOUT = 5000;
const DEFAULT_MAX_RECONNECT_TIMEOUT = 60000;
const DEFAULT_COMMANDS = Object.freeze({
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

export default Ember.Object.extend({
    init: function(options) {
        options = options || {};
        this.set('commands', options.commands || {});
        this.set('url', options.url || defaultUrl());
        this.set('cleanup', options.cleanup || function() {});
        this.set('init', options.init || function() {});
        this.set('protocols', options.protocols);
        this.set('commands', this._buildCommands(options.commands || {}));
        this.set('ws', null);
        this.set('reconnectTimeout', DEFAULT_RECONNECT_TIMEOUT);
        this.set('closed', true);
        this.set('opened', false);
        this.set('connecting', false);
        this.set('nextConnect', null);
        this.heartbeat = null;
    },

    connect: function() {
        return this._createWebsocket();
    },

    _createWebsocket: function() {
        var ws, deferred = new Ember.RSVP.defer();
        if (this.get('nextConnect')) {
            Ember.run.cancel(this.get('nextConnect'));
            this.set('nextConnect', null);
        }
        try {
            this.set('connecting', true);
            this.notifyPropertyChange('connecting');
            ws = new WebSocket(this.get('url'));
        } catch (err) {
            Ember.Logger.log('Error connecting to server: ' + err);
        } finally {
            this.set('connecting', false);
            this.notifyPropertyChange('connecting');
        }
        ws.onclose = function() {
            this.get('cleanup')();
            if (this.heartbeat) {
                clearInterval(this.heartbeat);
            }
            this.set('closed', true);
            this.notifyPropertyChange('closed');
            this.set('opened', false);
            Ember.Logger.log('<Closed Websocket>');
            var next = Ember.run.later(this, function() {
                if (this.get('ws').readyState === WebSocket.CLOSED) {
                    this._createWebsocket();
                }
            }.bind(this), this._connectTimeout());
            this.set('nextConnect', next);
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
            if (command in this.get('commands')) {
                this.get('commands')[command](data);
            } else {
                Ember.Logger.warn('Received unknown command: ' + command);
            }
        }.bind(this);
        ws.onopen = function() {
            Ember.Logger.log('<Opened Websocket>');
            this.set('closed', false);
            this.set('opened', true);
            this.notifyPropertyChange('opened');
            this.set('reconnectTimeout', DEFAULT_RECONNECT_TIMEOUT);
            this.heartbeat = setInterval(function() {
                this.send({_command: 'heartbeat'});
            }.bind(this), 20000);
            deferred.resolve(this);
        }.bind(this);
        this.set('ws', ws);
        return deferred.promise;
    },

    _connectTimeout: function() {
        var timeout = Math.max(this.get('reconnectTimeout'), DEFAULT_RECONNECT_TIMEOUT);
        this.set('reconnectTimeout', Math.min(timeout*2, DEFAULT_MAX_RECONNECT_TIMEOUT));
        return this.get('reconnectTimeout');
    },

    _buildCommands: function(commands) {
        var key,
            result = {};
        for (key in DEFAULT_COMMANDS) {
            result[key] = DEFAULT_COMMANDS[key];
        }
        for (key in commands) {
            result[key] = commands[key];
        }
        return result;
    },

    addCommand: function(command, func) {
        this.get('commands')[command] = func;
    },

    close:function(code, reason) {
        code = code || 1000;
        reason = reason || 'application called close';
        return this.get('ws').close();
    },

    send: function(data) {
        if (!this.get('closed') && data) {
            if (typeof data !== 'string') {
                try {
                    data = JSON.stringify(data);
                } catch (err) {
                    Ember.Logger.warn('Error sending data to server: ' +  err);
                    return;
                }
            }
            return this.get('ws').send(data);
        }
    },
});