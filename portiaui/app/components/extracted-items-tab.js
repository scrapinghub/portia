import Ember from 'ember';

export default Ember.Component.extend({
    extractedItems: Ember.inject.service(),

    numItems: Ember.computed.readOnly('extractedItems.items.length')
});
