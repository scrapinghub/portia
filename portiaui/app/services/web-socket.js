import Ember from 'ember';
import config from '../config/environment';
import { logError, shortGuid } from '../utils/utils';

const APPLICATION_UNLOADING_CODE = 4001;
const DEFAULT_RECONNECT_TIMEOUT = 5000;
const DEFAULT_MAX_RECONNECT_TIMEOUT = 60000;

var defaultUrl = function() {
    var uri = URI.parse(config.SLYD_URL || window.location.protocol + '//' + window.location.host);
    if (!/wss?/.test(uri.protocol)) {
        uri.protocol = uri.protocol === 'https' ? 'wss' : 'ws';
    }
    uri.path = '/ws';
    return URI.build(uri);
};

export default Ember.Service.extend(Ember.Evented, {

    closed: true,
    opened: Ember.computed.not('closed'),
    connecting: false,
    ws: null,
    heartbeat: null,
    nextConnect: null,
    reconnectTimeout: DEFAULT_RECONNECT_TIMEOUT,
    deferreds: {},
    url: defaultUrl(),
    secondsUntilReconnect: 0,
    reconnectImminent: Ember.computed.lt('secondsUntilReconnect', 2),

    init: function(options) {
        this._super(...arguments);
        if(options) { this.setProperties(options); }

        window.addEventListener('beforeunload', () => {
            if(this.get('opened')) {
                this.close(APPLICATION_UNLOADING_CODE);
            }
        });
        this.connect();
    },

    connect: function() {
        if(this.get('closed')) {
            return this._createWebsocket();
        }
    },

    _updateCountdownTimer: function() {
        if(this.secondsUntilReconnect === 0 && this.get('countdownTid')) {
            clearInterval(this.get('countdownTid'));
            this.set('countdownTid', null);
        } else if (this.secondsUntilReconnect > 0 && !this.get('countdownTid')) {
            this.set('countdownTid', setInterval(() => {
                this.decrementProperty('secondsUntilReconnect');
            }, 1000));
        }
    }.observes('secondsUntilReconnect'),

    _onclose(e) {
        if (this.heartbeat) {
            clearInterval(this.heartbeat);
        }
        this.set('closed', true);
        if (this.get('connecting')) {
            this.set('connecting', false);
        }
        Ember.Logger.log('<Closed Websocket>');
        if(e.code !== APPLICATION_UNLOADING_CODE && e.code !== 1000) {
            var timeout = this._connectTimeout();
            this.set('secondsUntilReconnect', Math.round(timeout/1000));
            var next = Ember.run.later(this, this.connect, timeout);
            this.set('reconnectTid', next);
        }
    },

    _onmessage({data}) {
        try {
            data = JSON.parse(data);
        } catch (err) {
            return logError('Error parsing data returned by server: ' + err + '\n' + data);
        }
        var command = data._command;
        if (!command) {
            return logError('Received response with no command: ' + JSON.stringify(data));
        }
        var deferred = data.id;
        if (deferred in this.get('deferreds')) {
            deferred = this.get('deferreds.' + deferred);
            delete this.get('deferreds')[data.id];
            if (data.error) {
                var err = new Error(data.reason);
                err.reason = {jqXHR: {responseText: data.reason}};
                deferred.reject(err);
                throw err;
            } else {
                deferred.resolve(data);
            }
        }
        if (this.has(command)) {
            this.trigger(command, data);
        } else {
            return logError('Received unknown command: ' + command);
        }
    },

    _onopen() {
        Ember.Logger.log('<Opened Websocket>');
        this.set('closed', false);
        if (this.get('connecting')) {
            this.set('connecting', false);
        }
        this.set('reconnectTimeout', DEFAULT_RECONNECT_TIMEOUT);
        this.heartbeat = setInterval(function() {
            this.send({_command: 'heartbeat'});
        }.bind(this), 20000);
    },

    _createWebsocket: function() {
        if (this.get('reconnectTid')) {
            Ember.run.cancel(this.get('reconnectTid'));
            this.set('reconnectTid', null);
        }
        this.set('secondsUntilReconnect', 0);
        let connecting = true;
        var ws;
        try {
            ws = new WebSocket(this.get('url'));
        } catch (err) {
            Ember.Logger.log('Error connecting to server: ' + err);
            connecting = false;
        }
        if (!connecting) {
            this.set('connecting', false);
            return;
        }
        this.set('connecting', true);
        ws.onclose = this._onclose.bind(this);
        ws.onmessage = this._onmessage.bind(this);
        ws.onopen = this._onopen.bind(this);
        this.set('ws', ws);
    },

    _connectTimeout: function() {
        var timeout = Math.max(this.get('reconnectTimeout'), DEFAULT_RECONNECT_TIMEOUT);
        this.set('reconnectTimeout', Math.min(timeout*2, DEFAULT_MAX_RECONNECT_TIMEOUT));
        return this.get('reconnectTimeout');
    },

    addCommand: function(/*command, target, method*/) {
        this.on(...arguments);
    },

    removeCommand: function(/*command, target, method*/) {
        this.off(...arguments);
    },

    close:function(code, reason) {
        code = code || 1000;
        reason = reason || 'application called close';
        return this.get('ws').close(code, reason);
    },

    send: function(data) {
        if (!this.get('closed') && data) {
            if (typeof data !== 'string') {
                try {
                    data = JSON.stringify(data);
                } catch (err) {
                    return logError('Error serializing data: ' +  err);
                }
            }
            return this.get('ws').send(data);
        }
    },

    _sendPromise: function(data) {
        var deferred = new Ember.RSVP.defer();
        if (!data._meta) {
            data._meta = this._metadata(null);
        } else if (!data._meta.id) {
            data._meta.id = shortGuid();
        }
        if(this.get('opened')) {
            this.set('deferreds.' + data._meta.id, deferred);
            this.send(data);
        } else {
            deferred.reject('Websocket is closed');
        }
        return deferred.promise;
    },

    _metadata: function(type) {
        return {
            // TODO: send current spider and project?
            type: type,
            id: shortGuid()
        };
    }
});
