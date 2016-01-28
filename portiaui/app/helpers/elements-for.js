import Ember from 'ember';

export default Ember.Helper.extend({
    annotationStructure: Ember.inject.service(),

    model: null,

    init() {
        this._super();
        this.get('annotationStructure').registerChange(this, this.recompute);
    },

    willDestroy() {
        this._super();
        this.get('annotationStructure').unRegisterChange(this, this.recompute);
    },

    compute([model]) {
        const structure = this.get('annotationStructure');
        return structure.elementsFor(model);
    }
});
