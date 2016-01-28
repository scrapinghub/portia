import Ember from 'ember';


export default Ember.Service.extend({
    dataStructure: Ember.inject.service(),
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    annotations: Ember.computed.readOnly('uiState.models.sample.orderedChildren'),
    items: [],
    _items: Ember.observer(
        'dataStructure.selectorNodes.[]', 'annotations.@each.name', 'annotations.@each.attribute',
        function() {
            let promise = this.get('webSocket')._sendPromise({
                _command: 'extract_items',
                project: this.get('uiState.models.project.id'),
                spider: this.get('uiState.models.spider.id'),
                sample: this.get('uiState.models.sample.id'),
            });
            if (promise) {
                return promise.then(function(data) {
                    this.set('items', data);
                });
            }
            return this.set('items', []);
        })
});
