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

export default Ember.Service.extend(Ember.Evented, {
    browser: Ember.inject.service(),

    selectors: new Map(),
    timerId: null,
    updateInterval: 100,

    register(selector, target, method) {
        this.selectors.set(selector, []);
        if (this.timerId === null) {
            this.scheduleUpdate(1);
        }
        this.on(selector, target, method);
    },

    unRegister(selector, target, method) {
        this.off(selector, target, method);
        if (!this.has(selector)) {
            this.selectors.delete(selector);
            if (!this.selectors.size) {
                Ember.run.cancel(this.timerId);
                this.timerId = null;
            }
        }
    },

    watch(target, method) {
        this.on('changed', target, method);
    },

    unWatch(target, method) {
        this.off('changed', target, method);
    },

    scheduleUpdate(delay) {
        this.timerId = Ember.run.later(this, this.update, delay);
    },

    update() {
        const $document = this.get('browser.$document');
        if ($document) {
            const updates = [];
            this.selectors.forEach((currentElements, selector) => {
                const newElements = $document.find(selector).toArray();
                if (!nodesEqual(currentElements, newElements)) {
                    this.selectors.set(selector, newElements);
                    updates.push([selector, newElements]);
                }
            });

            if (updates.length) {
                Ember.run.scheduleOnce('sync', () => {
                    updates.forEach(([selector, elements]) => {
                        this.trigger(selector, elements);
                    });
                    this.trigger('changed', updates);
                });
            }
        }
        this.scheduleUpdate(this.updateInterval);
    }
});
