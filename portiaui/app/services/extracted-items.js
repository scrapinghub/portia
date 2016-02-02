import Ember from 'ember';


export default Ember.Service.extend({
    dataStructure: Ember.inject.service(),
    annotationStructure: Ember.inject.service(),
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    init() {
        this._super();
        let ws = this.get('webSocket');
        ws.addCommand('extract_items', this._setItems.bind(this));
        this.get('annotationStructure').registerChange(this, this._getitems);
    },

    willDestroy() {
        this._super();
        this.get('annotationStructure').unRegisterChange(this, this._getitems);
    },
    annotations: Ember.computed.readOnly('uiState.models.sample.orderedChildren'),
    update: true,
    items: [],
    _getitems() {
        Ember.run.throttle(this, () =>
            this.get('webSocket').send({
                _command: 'extract_items',
                project: this.get('uiState.models.project.id'),
                spider: this.get('uiState.models.spider.id'),
                sample: this.get('uiState.models.sample.id'),
            }),
            200, false);
    },
    _setItems: function(data) {
        //console.log(JSON.stringify(data.items));
        this.set('items', data.items);
    }
});
