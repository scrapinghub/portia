import Ember from 'ember';

export default Ember.Controller.extend({
    extractedItems: Ember.inject.service(),
    showExtractedItems: Ember.computed.bool('extractedItems.items.length')
});
