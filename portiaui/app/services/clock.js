import Ember from 'ember';

// based on an idea from https://www.rvdh.de/2014/11/14/time-based-triggers-in-ember-js/
export default Ember.Service.extend({
    time: new Date(),

    metronome: Ember.on('init', function() {
        const now = new Date();
        const interval = 1000 - (+now % 1000);
        this.set('time', now);

        Ember.run.later(this, this.metronome, interval);
    })
});
