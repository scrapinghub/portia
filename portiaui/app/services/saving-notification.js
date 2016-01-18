import Ember from 'ember';

export default Ember.Service.extend({
    notificationManager: Ember.inject.service(),

    savingBanner: {
        message: 'Saving ...',
        type: 'info'
    },

    counter: 0,
    minDisplayTime: 1000,  // 1s
    startTime: null,

    start() {
        this.incrementProperty('counter');
        const counter = this.get('counter');
        if (counter === 1) {
            this.get('notificationManager').addBanner(this.savingBanner);
            this.set('startTime', +new Date());
        }
    },

    end() {
        this.decrementProperty('counter');
        const counter = this.get('counter');
        if (!counter) {
            const timeLeft =
                Math.max(0, this.get('minDisplayTime') - (+ new Date() - this.get('startTime')));
            Ember.run.later(() => {
                this.get('notificationManager').removeBanner(this.savingBanner);
            }, timeLeft);
        }
    }
});
