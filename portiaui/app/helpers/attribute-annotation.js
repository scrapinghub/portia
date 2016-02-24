import Ember from 'ember';

export default Ember.Helper.extend({
    compute([annotations, attribute]) {
        this.setProperties({
            annotations,
            attribute
        });

        return this.get('content');
    },

    annotations: null,
    attribute: null,
    content: Ember.computed('annotations.[]', 'attribute', function() {
        const attribute = this.get('attribute');
        return this.getWithDefault('annotations', []).find(annotation =>
            annotation.getWithDefault('attribute', null) === attribute) || {};
    }),

    contentDidChange: Ember.observer('content', function () {
        this.recompute();
    })
});
