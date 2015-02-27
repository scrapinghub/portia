import Ember from 'ember';

export default Ember.Route.extend({
    activate: function() {
        this.set('toolbox.fixed', this.getWithDefault('fixedToolbox', true));
        var controller = this.controller || this.controllerFor(this.getControllerName());
        if (controller.willEnter) {
            controller.willEnter();
        }
        this._super();
    },

    deactivate: function() {
        var controller = this.controller || this.controllerFor(this.getControllerName());
        if (controller.willLeave) {
            controller.willLeave();
        }
    },

    getControllerName: function() {
        return this.get('routeName').split('.').get(0);
    }
});
