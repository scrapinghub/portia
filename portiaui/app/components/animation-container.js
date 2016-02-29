import Ember from 'ember';
import { attrValue } from '../utils/attrs';

export default Ember.Component.extend({
    positionMonitor: Ember.inject.service(),

    classNames: ['animation-container'],
    classNameBindings: ['fade', 'hidden'],

    fade: false,
    hidden: false,
    setHeight: true,
    setWidth: true,

    didReceiveAttrs({oldAttrs, newAttrs}) {
        if (attrValue(newAttrs.hide)) {
            if (!oldAttrs) {
                this.setProperties({
                    fade: true,
                    hidden: true
                });
            } else if (!attrValue(oldAttrs.hide)) {
                this.set('fade', true);
            }
        } else {
            if (!oldAttrs) {
                this.setProperties({
                    fade: true,
                    hidden: true
                });
                Ember.run.later(() => {
                    this.set('hidden', false);
                    Ember.run.later(this, this.set, 'fade', false, 50);
                }, 50);
            } else if (attrValue(oldAttrs.hide)) {
                this.set('hidden', false);
                Ember.run.later(this, this.set, 'fade', false, 50);
            }
        }
    },

    didInsertElement() {
        const positionMonitor = this.get('positionMonitor');

        Ember.run.schedule('afterRender', () => {
            this.content = this.element.children[0];
            positionMonitor.registerElement(
                this.element, this, this.readPosition, this.updatePosition);
            positionMonitor.registerElement(
                this.content, this, null, this.updateSize);
            Ember.run.scheduleOnce('afterRender', positionMonitor, positionMonitor.update);
        });
    },

    willDestroyElement() {
        const positionMonitor = this.get('positionMonitor');

        positionMonitor.unRegisterElement(
            this.element, this, this.readPosition, this.updatePosition);
        positionMonitor.unRegisterElement(
            this.content, this, null, this.updateSize);
    },

    readPosition(rect, element) {
        this.containerPosition = Ember.$(element).position();
    },

    updatePosition(rect) {
        const content = this.content;
        let style = '';
        if (rect.top || rect.bottom || rect.left || rect.right) {
            const left = Math.round(this.containerPosition.left);
            const top = Math.round(this.containerPosition.top);
            style = `transform: translate(${left}px, ${top}px);`;
        }
        content.setAttribute('style', style);
    },

    updateSize(rect) {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        let style = '';
        if (this.get('setWidth')) {
            style += `width: ${width}px;`;
        }
        if (this.get('setHeight')) {
            style += `height: ${height}px;`;
        }
        this.element.setAttribute('style', style);
    },

    transitionEnd($event) {
        if ($event.originalEvent.propertyName === 'opacity' &&
                $event.originalEvent.target === this.element) {
            if (this.get('fade')) {
                this.set('hidden', true);
            }
        }
    }
});
