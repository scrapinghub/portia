import Ember from 'ember';

export default Ember.Service.extend({
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    items: [],
    links: {},

    init() {
        this._super();
        let ws = this.get('webSocket');
        ws.addCommand('extract_items', this, this._setItems);
        ws.addCommand('metadata', this, this._setItems);
    },

    update() {
        Ember.run.throttle(this, this._getitems, 300, false);
    },

    _getitems() {
        const spiderId = this.get('uiState.models.spider.id');
        if (spiderId) {
            this.get('webSocket').send({
                _command: 'extract_items',
                project: this.get('uiState.models.project.id'),
                spider: spiderId,
                sample: this.get('uiState.models.sample.id')
            });
        }
    },

    _setItems: function(data) {
        this.set('items', data.items);
        this.set('links', data.links);
        this.set('changes', data.changes);
        this.set('type', data.type);
        this.set('changed_values', data.changed_values);
    }
});
