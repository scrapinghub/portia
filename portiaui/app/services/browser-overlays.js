import Ember from 'ember';


export default Ember.Service.extend({
    elementOverlays: [],
    overlayComponents: [],
    timerId: null,

    startStopTimer: Ember.observer('elementOverlays.length', function() {
        if (this.get('elementOverlays.length')) {
            if (this.timerId === null) {
                this.update();
            }
        } else if (this.timerId !== null) {
            cancelAnimationFrame(this.timerId);
            this.timerId = null;
        }
    }),

    update() {
        var elementOverlays = this.get('elementOverlays');
        var updates = [];
        // for performance first do DOM reads ...
        elementOverlays.forEach(component => {
            var element;
            var viewPortElement;
            if ((element = component.get('element')) &&
                    (viewPortElement = component.get('viewPortElement'))) {
                updates.push([element, viewPortElement.getBoundingClientRect()]);
            } else {
                updates.push([null, null]);
            }
        });
        // ... then DOM writes
        updates.forEach(([element, rect]) => {
            if (element && rect) {
                element.setAttribute(
                    'style',
                    `transform: translate(${rect.left}px, ${rect.top}px); width: ${rect.width}px; height: ${rect.height}px;`  // jshint ignore:line
                );
            }
        });
        this.timerId = requestAnimationFrame(this.update.bind(this));
    },

    addOverlayComponent(overlay) {
        this.get('overlayComponents').addObject(overlay);
    },

    removeOverlayComponent(overlay) {
        this.get('overlayComponents').removeObject(overlay);
    },

    addElementOverlay(overlay) {
        this.get('elementOverlays').addObject(overlay);
    },

    removeElementOverlay(overlay) {
        this.get('elementOverlays').removeObject(overlay);
    }
});
