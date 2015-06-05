import Ember from 'ember';

export default  Ember.Object.extend({
    init: function() {
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
