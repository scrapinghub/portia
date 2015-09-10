import Ember from 'ember';
import utils from './utils';

export default  Ember.Object.extend({
    init: function(websocket) {
        var hidden, visibilityChange;
        if (typeof document.hidden !== "undefined") {
          hidden = "hidden";
          visibilityChange = "visibilitychange";
        } else if (typeof document.mozHidden !== "undefined") {
          hidden = "mozHidden";
          visibilityChange = "mozvisibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
          hidden = "msHidden";
          visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
          hidden = "webkitHidden";
          visibilityChange = "webkitvisibilitychange";
        }
        // Handle user changing tab
        document.addEventListener(visibilityChange, function() {
            if (document[hidden]) {
                this.pause();
            } else {
                this.resume();
            }
        }.bind(this), false);
        // Handle user putting browser into background
        window.addEventListener('blur', this.pause.bind(this));
        window.addEventListener('focus', this.resume.bind(this));
        this.set('_startTime', new Date());
        this.set('sessionid', utils.shortGuid());
        this.set('ws', websocket);
    },

    pause: function() {
         // Avoid overwriting pause if called twice without resume
        if (this.get('paused') || this.get('ws.closed')) {
            return;
        }
        this.set('paused', true);
        this.get('ws').send({
            '_command': 'pause',
            '_meta': {
                'session_id': this.get('sessionid')
            }
        });
    },

    resume: function() {
        if (!this.get('paused') || this.get('ws.closed')) {
            return;
        }
        this.set('paused', false);
        this.get('ws').send({
            '_command': 'resume',
            '_meta': {
                'session_id': this.get('sessionid')
            }
        });
    }
});
