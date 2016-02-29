import Ember from 'ember';
import {attrChanged, attrValue} from '../utils/attrs';

export default Ember.Component.extend({
    overlays: Ember.inject.service(),
    positionMonitor: Ember.inject.service(),

    classNames: ['overlay'],

    positionMode: 'size',  // or 'edges'

    backgroundStyle: Ember.computed('color.main', function() {
        const color = this.get('color.main');
        return Ember.String.htmlSafe(color ? `background-color: ${color};` : '');
    }),
    shadowStyle: Ember.computed('color.shadow', function() {
        const color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `box-shadow: 0 1px 3px -2px ${color};` : '');
    }),
    textShadowStyle: Ember.computed('color.shadow', function() {
        const color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `text-shadow: 0 1px 1px ${color};` : '');
    }),

    didInsertElement() {
        Ember.run.scheduleOnce('afterRender', this, this.notifyAddOverlay);
    },

    willDestroyElement() {
        Ember.run.scheduleOnce('afterRender', this, this.notifyRemoveOverlay);
    },

    notifyAddOverlay() {
        this.get('overlays').add();
    },

    notifyRemoveOverlay() {
        this.get('overlays').remove();
    },

    didReceiveAttrs({oldAttrs, newAttrs}) {
        if (attrChanged(oldAttrs, newAttrs, 'viewPortElement')) {
            const oldElement = oldAttrs && attrValue(oldAttrs.viewPortElement);
            const newElement = attrValue(newAttrs.viewPortElement);
            const positionMonitor = this.get('positionMonitor');
            if (oldElement) {
                positionMonitor.unRegisterElement(oldElement, this, null, this.updatePosition);
            }
            if (newElement) {
                Ember.run.schedule('afterRender', () => {
                    positionMonitor.registerElement(newElement, this, null, this.updatePosition);
                });
            }
        }
    },

    updatePosition(rect) {
        if (!this.element) {
            return;
        }

        const left = Math.round(rect.left);
        const top = Math.round(rect.top);
        let style = '';

        switch (this.get('positionMode')) {
            case 'size':
                const width = Math.round(rect.width);
                const height = Math.round(rect.height);
                style = `transform: translate(${left}px, ${top}px);
                         width: ${width}px; height: ${height}px;`;
                break;

            case 'edges':
                // container is positioned in top left, and has zero width and height
                const right = -left + -Math.round(rect.width);
                const bottom = -top + -Math.round(rect.height);
                style = `left: ${left}px; right: ${right}px; top: ${top}px; bottom: ${bottom}px;`;
                break;
        }

        this.element.setAttribute('style', style);
    }
});
