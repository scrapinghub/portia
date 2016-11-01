import Ember from 'ember';
const { inject: { service }, computed } = Ember;

export default Ember.Component.extend({
    tagName: '',

    extractedItems: service(),
    isExtracting: computed.alias('extractedItems.isExtracting'),
    notExtracting: computed.not('isExtracting'),
    notReadyForExtraction: computed.alias('extractedItems.notReadyForExtraction')
});
