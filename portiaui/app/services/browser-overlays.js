import Ember from 'ember';


export default Ember.Service.extend({
    elementOverlays: [],
    hoverOverlayColor: null,
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
            }
        });
        // ... then DOM writes
        updates.forEach(([element, rect]) => {
            var left = Math.round(rect.left);
            var top = Math.round(rect.top);
            var width = Math.round(rect.width);
            var height = Math.round(rect.height);
            element.setAttribute(
                'style',
                `transform: translate(${left}px, ${top}px); width: ${width}px; height: ${height}px;`
            );
        });
        this.timerId = requestAnimationFrame(this.update.bind(this));
    },

    addOverlayComponent(overlay) {
        Ember.run.next(() => {
            this.get('overlayComponents').addObject(overlay);
        });
    },

    removeOverlayComponent(overlay) {
        Ember.run.next(() => {
            this.get('overlayComponents').removeObject(overlay);
        });
    },

    addElementOverlay(overlay) {
        this.get('elementOverlays').addObject(overlay);
    },

    removeElementOverlay(overlay) {
        this.get('elementOverlays').removeObject(overlay);
    }
});
