import Ember from 'ember';
import {attrChanged, attrValue} from '../utils/attrs';

export default Ember.Component.extend({
    positionMonitor: Ember.inject.service(),

    classNames: ['overlay'],

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

    didReceiveAttrs({oldAttrs, newAttrs}) {
        if (attrChanged(oldAttrs, newAttrs, 'viewPortElement')) {
            const oldElement = oldAttrs && attrValue(oldAttrs.viewPortElement);
            const newElement = attrValue(newAttrs.viewPortElement);
            const positionMonitor = this.get('positionMonitor');
            if (oldElement) {
                positionMonitor.unRegisterElement(oldElement, this, null, this.updatePosition);
            }
            if (newElement) {
                positionMonitor.registerElement(newElement, this, null, this.updatePosition);
            }
        }
    },

    updatePosition(rect) {
        if (!this.element) {
            return;
        }
        const left = Math.round(rect.left);
        const top = Math.round(rect.top);
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        this.element.setAttribute(
            'style',
            `transform: translate(${left}px, ${top}px); width: ${width}px; height: ${height}px;`
        );
    }
});
