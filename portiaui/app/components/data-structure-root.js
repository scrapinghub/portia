import Ember from 'ember';

export default Ember.Component.extend({
    dataStructure: Ember.inject.service(),

    tagName: '',

    numItems: Ember.computed.readOnly('dataStructure.structure.length')
});
