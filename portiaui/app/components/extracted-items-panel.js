import Ember from 'ember';
const { inject: { service }, computed } = Ember;

export default Ember.Component.extend({
    tagName: '',

    extractedItems: service(),

    isExtracting: computed.readOnly('extractedItems.isExtracting'),
    failedMsg: computed.readOnly('extractedItems.failedExtractionMsg'),
    failedExtraction: computed.readOnly('extractedItems.failedExtraction')
});
