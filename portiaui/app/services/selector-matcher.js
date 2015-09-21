import Ember from 'ember';


function nodesEqual(nodesA, nodesB) {
    if (nodesA.length !== nodesB.length) {
        return false;
    }
    for (let i = nodesA.length; i--;) {
        if (nodesA[i] !== nodesB[i]) {
            return false;
        }
    }
    return true;
}

export default Ember.Service.extend({
    browser: Ember.inject.service(),

    clients: new Set(),
    updateInterval: 100,

    init() {
        this._super();
        this.scheduleUpdate(1);
    },

    register(client) {
        this.clients.add(client);
    },

    unregister(client) {
        this.clients.delete(client);
    },

    scheduleUpdate(delay) {
        Ember.run.later(() => {
            Ember.run.scheduleOnce('sync', this, this.update);
        }, delay);
    },

    update() {
        const $document = this.get('browser.$document');
        if ($document) {
            this.beginPropertyChanges();
            this.clients.forEach(client => {
                const selector = client.get('selector');
                const currentElements = client.get('elements');
                const newElements = $document.find(selector).toArray();
                if (!nodesEqual(currentElements, newElements)) {
                    client.set('elements', newElements);
                }
            });
            this.endPropertyChanges();
        }
        this.scheduleUpdate(this.updateInterval);
    }
});
