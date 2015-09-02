import BaseController from '../base-controller';

export default BaseController.extend({
    breadCrumb: null,
    _breadCrumb: null,

    needs: ['template'],

    /**
     * When returning from a sub-route to a parent route, the parent route's
     * activate hook will not be called (because it was never deactivated).
     *
     * This is to workaround that, ideally most of the methods and state of the
     * template controller would be here.
     */
    willEnter: function(){
        this.get('controllers.template')._willEnter();
    },
    willLeave: function(){
        this.get('controllers.template')._willLeave();
    },
});
