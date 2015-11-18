import Ember from 'ember';

export default Ember.Route.extend({
    activate: function() {

        var controller = this.controller || this.controllerFor(this.getControllerName());
        var fixed = controller.getWithDefault('fixedToolbox', this.getWithDefault('fixedToolbox', true));
        this.set('toolbox.fixed', fixed);
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
        return this.getWithDefault('defaultControllerName', this.get('routeName'));
    }
});
