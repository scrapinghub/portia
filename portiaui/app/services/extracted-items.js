import Ember from 'ember';
const { computed } = Ember;
import { task, timeout } from 'ember-concurrency';

const SECOND = 1000;
const INITIAL_TIMEOUT = 2 * SECOND;
const MAX_TIMEOUT = 30 * SECOND;

function print(msg, debug=true) {
    if(debug) { console.info(msg); }
}

export default Ember.Service.extend({
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    items: [],
    links: {},

    isExtracting: false,
    failedExtraction: false,
    extractionTimeout: 0,

    spider: computed.readOnly('uiState.models.spider'),
    sample: computed.readOnly('uiState.models.sample'),
    noSamples: computed.equal('spider.samples.length', 0),

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
        this.set('isExtracting', true);
        this.set('failedExtraction', false);
        this.get('_extract').cancelAll();
    },

    failExtraction(msg) {
        this._finishExtraction();
        this.set('failedExtraction', true);
        this.set('failedExtractionMsg', msg);
    },

    update() {
        Ember.run.throttle(this, this._getitems, 300, false);
    },

    _getitems() {
        print("Sending 'extract_items' command...");

        const spiderId = this.get('spider.id');
        if (spiderId) {
            this.get('webSocket').send({
                _command: 'extract_items',
                project: this.get('uiState.models.project.id'),
                spider: spiderId,
                sample: this.get('sample.id')
            });
        }
    },

    _setExtraction(data) {
        print("'extract_items' callback called.");

        if (this.get('noSamples')) {
            print('noSamples');
            this.failExtraction('Samples are needed for extracting data.');
            return;
        }

        this._updateItems(data);
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

        this._startExtraction(data);

        this.setProperties({
            'links': data.links,
            'changes': data.changes,
            'type': data.type,
            'changed_values': data.changed_values
        });
    },

    _startExtraction(data) {
        if (data.loaded && this.get('isExtracting')) {
            this.get('_extract').perform();
        }
    },

    _updateItems(data) {
        const items = data.items;
        const newItems = items && items.length >= this.get('items.length');

        print('_updateItems');
        print(this.get('items'));
        print(items);
        print(`New Items: ${newItems}`);
        if (newItems) {
            this.set('items', items);
        }
    },

    _updateExtraction(data) {
        const receivedItems = data.items && data.items.length > 0;
        // Ensures the wait time is 254 seconds ~ 4 minutes
        const exceedWait = this.get('extractionTimeout') > MAX_TIMEOUT;

        print('----------------------------');
        print('_updateExtraction');
        print('ReceivedItems:', receivedItems);
        print('----------------------------');

        if (receivedItems || exceedWait) {
            this._finishExtraction();
        } else {
            this.get('_extract').perform();
        }
    },

    _finishExtraction() {
        this.set('isExtracting', false);
        this.get('_extract').cancelAll();
    }
});
