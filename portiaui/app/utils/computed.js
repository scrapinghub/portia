import Ember from 'ember';

export function computedPropertiesEqual(a, b) {
    return Ember.computed(a, b, function() {
        return this.get(a) === this.get(b);
    });
}
