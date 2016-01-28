import Ember from 'ember';

export default Ember.Helper.extend({
    compute(params/*, hash*/) {
        this.setProperties({
            obj: params[0],
            index: params[1]
        });

        return this.get('content');
    },

    obj: null,
    index: null,
    content: Ember.computed('obj.[]', 'index', function() {
        return this.get('obj').get(this.get('index'));
    }),

    contentDidChange: Ember.observer('content', function () {
        this.recompute();
    })
});
