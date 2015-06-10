import Ember from 'ember';

export default Ember.Mixin.create({
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
                this.get('slyd.timer').pause();
            } else {
                this.get('slyd.timer').resume();
            }
        }.bind(this), false);
        // Handle user putting browser into background
        window.addEventListener('blur', function() {
            this.get('slyd.timer').pause();
        }.bind(this));
        window.addEventListener('focus', function() {
            this.get('slyd.timer').resume();
        }.bind(this));
    }
});
