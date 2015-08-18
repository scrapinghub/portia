import Ember from 'ember';

export const OverlayUpdater = Ember.Object.extend({
    components: [],
    timerId: null,
    startStopTimer: Ember.observer('components.length', function() {
        if (this.get('components.length')) {
            if (this.timerId === null) {
                this.update();
            }
        } else if (this.timerId !== null) {
            cancelAnimationFrame(this.timerId);
            this.timerId = null;
        }
    }),

    update() {
        var components = this.get('components');
        var updates = [];
        // for performance first do DOM reads ...
        components.forEach(component => {
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

    add(component) {
        this.get('components').addObject(component);
    },

    remove(component) {
        this.get('components').removeObject(component);
    }
}).create();

export default Ember.Service.extend({
    overlays: [],

    add(overlay) {
        this.get('overlays').addObject(overlay);
    },

    remove(overlay) {
        this.get('overlays').removeObject(overlay);
    }
});
