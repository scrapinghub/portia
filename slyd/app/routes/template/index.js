import BaseRoute from '../base-route';

export default BaseRoute.extend({
    fixedToolbox: false,

    model: function() {
        return this.modelFor('template');
    }
});