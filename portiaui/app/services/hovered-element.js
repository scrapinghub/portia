import Ember from 'ember';
import HoverOverlay from '../components/hover-overlay';


export default Ember.Service.extend({
    browserOverlays: Ember.inject.service(),

    element: null,

    elementOverlays: Ember.computed.filter('browserOverlays.elementOverlays', function(overlay) {
        return !(overlay instanceof HoverOverlay);
    }),
    hoveringExistingOverlay: Ember.computed('elementOverlays', 'element', function() {
        return this.get('elementOverlays').isAny('viewPortElement', this.get('element'));
    })
});
