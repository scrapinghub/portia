import Ember from 'ember';
const { computed } = Ember;
import { task, timeout } from 'ember-concurrency';

const INITIAL_TIMEOUT = 2000;

function print(msg, debug=true) {
    if(debug) { console.info(msg); }
}

export default Ember.Service.extend({
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    items: [],
    links: {},

    syncedLoading: true,
    isExtracting: false,
    extractionTimeout: 0,

    spider: computed.alias('uiState.models.spider'),
    hasSamples: computed.gt('spider.samples.length', 0),
    lacksSamples: computed.not('hasSamples'),

    init() {
        this._super();
        let ws = this.get('webSocket');

        ws.addCommand('metadata', this, this._setItems);
        ws.addCommand('extract_items', this, this._setExtraction);
    },

    activateExtraction() {
        print('ActivateExtraction');

        this.set('items', []);
        this.set('extractionTimeout', 0);
        this.set('syncedLoading', false);
        this.set('isExtracting', true);
        this.get('_extract').cancelAll();
    },

    update() {
        Ember.run.throttle(this, this._getitems, 300, false);
    },

    _getitems() {
        print("Sending 'extract_items' command...");

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

    _setExtraction(data) {
        print("'extract_items' callback called.");

        if (this.get('lacksSamples')) {
            print('Lacks samples. Finish extraction.');
            this.set('isExtracting', false);
            return;
        }

        this._updateExtraction(data);
        this._setItems(data);
    },

    _extract: task(function * () {
        print('Perform Extraction Task');
        print(`Extraction Timeout: ${this.get('extractionTimeout')}`);

        const t = this.get('extractionTimeout');
        yield timeout(t);
        this.update();
        this.set('extractionTimeout', (t === 0) ? INITIAL_TIMEOUT : t * 2);
    }).drop(),

    _setItems(data) {
        print(data);

        this._syncLoading(data);
        this._startExtraction(data);
        this._updateItems(data);

        this.setProperties({
            'links': data.links,
            'changes': data.changes,
            'type': data.type,
            'changed_values': data.changed_values
        });
    },

    _syncLoading(data) {
        if (!data.loaded && !this.get('syncedLoading')) {
            print('Synced Loading!');
            this.set('syncedLoading', true);
        }
    },

    _startExtraction(data) {
        if (data.loaded && this.get('isExtracting') && this.get('syncedLoading')) {
            this.get('_extract').perform();
        }
    },

    _updateItems(data) {
        const items = data.items;
        const newItems = items && items.length >= this.get('items.length');

        if (newItems && this.get('syncedLoading')) {
            this.set('items', items);
        }
    },

    _updateExtraction(data) {
        const receivedItems = data.items && data.items.length > 0;
        // Ensures the wait time is 254 seconds ~ 4 minutes
        const exceedWait = this.get('extractionTimeout') > 200000;

        if ((this.get('syncedLoading') && receivedItems) || exceedWait) {
            this.get('_extract').cancelAll();
            this.set('isExtracting', false);
        } else {
            this.get('_extract').perform();
        }
    },

});
