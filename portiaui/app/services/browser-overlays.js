import Ember from 'ember';

export default Ember.Service.extend({
    hoverOverlayColor: null,
    overlayComponents: [],

    addOverlayComponent(overlay) {
        Ember.run.next(() => {
            this.get('overlayComponents').addObject(overlay);
        });
    },

    removeOverlayComponent(overlay) {
        Ember.run.next(() => {
            this.get('overlayComponents').removeObject(overlay);
        });
    }
});
