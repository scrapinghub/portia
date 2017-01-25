import Ember from 'ember';
import { shortGuid } from '../utils/utils';

export default Ember.Component.extend({
    clock: Ember.inject.service(),
    savingNotification: Ember.inject.service(),

    tagName: 'p',
    classNames: ['save-status', 'text-center'],

    minSavingTime: 1000,  // 1s
    minSuccessTime: 5000,  // 5s

    init() {
        this._super(...arguments);
        this.wasSaving = false;
        this.set('uniqueId', `${shortGuid()}-saving`);
    },

    isSaving: Ember.computed('savingNotification.isSaving', {
        get() {
            const isSaving = this.get('savingNotification.isSaving');
            if (isSaving) {
                this.startTime = +new Date();
                Ember.run.cancel(this.savingSchedule);
                return true;
            } else {
                const timeLeft =
                    Math.max(0, this.minSavingTime - (+new Date() - this.startTime));
                if (timeLeft) {
                    this.savingSchedule = Ember.run.later(() => {
                        this.set('isSaving', this.get('savingNotification.isSaving'));
                    }, timeLeft);
                    return true;
                }
                return false;
            }
        },

        set(key, value) {
            return value;
        }
    }),
    timeSinceLastSave: Ember.computed('savingNotification.lastSaved', function() {
        const current = this.get('clock.time');
        const last = this.get('savingNotification.lastSaved');
        if (!current || !last) {
            return null;
        }
        return moment(last).fromNow();
    }),
    labelColorClass: Ember.computed('isSaving', {
        get() {
            const isSaving = this.get('isSaving');
            if (isSaving) {
                this.wasSaving = true;
                Ember.run.cancel(this.colorSchedule);
            } else if (this.wasSaving) {
                this.wasSaving = false;
                this.colorSchedule = Ember.run.later(() => {
                    this.set('labelColorClass', this.get('isSaving') ? 'info' : 'default');
                }, this.minSuccessTime);
                return 'success';
            }
            return isSaving ? 'info' : 'default';
        },

        set(key, value) {
            return value;
        }
    })
});
