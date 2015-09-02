import BaseController from '../base-controller';

export default BaseController.extend({
    _breadCrumb: null,

    needs: ['spider'],

    /**
     * When returning from a sub-route to a parent route, the parent route's
     * activate hook will not be called (because it was never deactivated).
     *
     * This is to workaround that, ideally most of the methods and state of the
     * spider controller would be here.
     */
    willEnter: function(){
        this.get('controllers.spider')._willEnter();
    },
    willLeave: function(){
        this.get('controllers.spider')._willLeave();
    },
});
