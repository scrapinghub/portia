import Ember from 'ember';

export default  Ember.Object.extend({
    init: function() {
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
    },

    totalTime: function() {
        return parseInt((new Date() - this.get('_startTime') - this.getWithDefault('_pausedTime', 0))/1000);
    },

    pause: function() {
        if (this.get('paused')) { // Avoid overwriting pause if called twice without resume
            return;
        }
        this.set('paused', new Date());
    },

    resume: function() {
        if (!this.get('paused')) {
            return;
        }
        var paused = this.getWithDefault('_pausedTime', 0),
            pausedAt = this.get('paused');
        paused = paused + (new Date() - pausedAt);
        this.set('_pausedTime', paused);
        this.set('paused', null);
    }
});
