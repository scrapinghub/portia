import Ember from 'ember';

export default Ember.Service.extend({
    extractedItems: Ember.inject.service(),

    counter: 0,
    lastSaved: null,

    isSaving: Ember.computed.bool('counter'),

    start() {
        this.get('extractedItems').activateExtraction();
        this.get('extractedItems').update();

        this.incrementProperty('counter');
    },

    end() {
        this.decrementProperty('counter');
        const counter = this.get('counter');
        if (!counter) {
            this.set('lastSaved', new Date());
        }
    }
});
