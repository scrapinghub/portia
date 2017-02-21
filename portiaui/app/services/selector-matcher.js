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
        const elements = this.selectors.get(selector);
        if (elements) {
            if (method) {
                method.call(target, elements);
            } else {
                target(elements);
            }
        } else {
            this.selectors.set(selector, []);
        }
        if (this.timerId === null) {
            this.scheduleUpdate(1);
        }
        this.on(...arguments);
    },

    unRegister(selector) {
        this.off(...arguments);
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

    query(selector) {
        const $document = this.get('browser.$document');
        if ($document) {
            let elements = this.selectors.get(selector);
            if (!elements) {
                return $document.find(selector).toArray();
            } else if (!elements.length) {
                elements = $document.find(selector).toArray();
                this.selectors.set(selector, elements);
            }
            return elements;
        } else {
            return [];
        }
    },

    scheduleUpdate(delay) {
        Ember.run.cancel(this.timerId);
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
                updates.forEach(([selector, elements]) => {
                    this.trigger(selector, elements);
                });
                this.trigger('changed', updates);
            }
        }
        this.scheduleUpdate(this.updateInterval);
    }
});
