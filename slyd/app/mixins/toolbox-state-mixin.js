import Ember from 'ember';

export default Ember.Mixin.create({
    willEnter: function() {
        this.set('toolbox.fixed', this.get('fixedToolbox') || false);
    }
});
