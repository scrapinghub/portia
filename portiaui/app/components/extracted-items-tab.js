import Ember from 'ember';

export default Ember.Component.extend({
    title: 'Extracted items',
    extractedItems: Ember.inject.service(),
    numItems: Ember.computed.readOnly('extractedItems.items.length')
});
