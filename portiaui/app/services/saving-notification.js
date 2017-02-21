import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Service.extend({
    extractedItems: service(),

    counter: 0,
    lastSaved: null,

    isSaving: computed.bool('counter'),

    start() {
        this.get('extractedItems').activateExtraction();
        this.incrementProperty('counter');
    },

    end() {
        this.decrementProperty('counter');
        const counter = this.get('counter');
        if (!counter) {
            this.set('lastSaved', new Date());
        }
        this.get('extractedItems').update();
    }
});
