import Ember from 'ember';
import {getAttributeList} from './inspector-panel';


export const IGNORED_ELEMENTS = new Set(['html', 'body']);

export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    browserState: Ember.inject.service(),
    colorProvider: Ember.inject.service(),
    hoveredElement: Ember.inject.service(),

    classNames: ['overlay', 'hover-overlay'],
    classNameBindings: ['viewPortElement::hide', 'hoveredElement.hoveringExistingOverlay:hide'],

    colorOrder: [Infinity],
    timerId: null,
    updateInterval: 100,

    showHoverOverlay: Ember.computed.readOnly('browserState.isInteractionMode'),
    viewPortElement: Ember.computed.alias('hoveredElement.element'),

    willInsertElement() {
        this.beginPropertyChanges();
        var color = this.get('colorProvider').register(this);
        this.set('color', color);
        this.get('browserOverlays').addElementOverlay(this);
        this.endPropertyChanges();
        this.scheduleUpdate(1);
    },

    willDestroyElement() {
        if (this.timerId !== null) {
            Ember.run.cancel(this.timerId);
            this.timerId = null;
        }
        this.beginPropertyChanges();
        this.get('browserOverlays').removeElementOverlay(this);
        this.get('colorProvider').unRegister(this);
        this.set('color', null);
        this.set('viewPortElement', null);
        this.endPropertyChanges();
    },

    scheduleUpdate(delay) {
        this.timerId = Ember.run.later(() => {
            Ember.run.scheduleOnce('sync', this, 'update');
        }, delay);
    },

    update() {
        var hoveredElement = null;
        if (this.get('showHoverOverlay')) {
            let viewPortDocument = Ember.$('iframe').contents();
            hoveredElement = viewPortDocument.find(':hover').toArray().pop();
        }
        if (this.get('viewPortElement') !== hoveredElement) {
            if (hoveredElement && (
                    IGNORED_ELEMENTS.has(hoveredElement.tagName.toLowerCase()) ||
                    !getAttributeList(hoveredElement).length)) {
                hoveredElement = null;
            }
            this.set('viewPortElement', hoveredElement);
        }
        this.scheduleUpdate(this.updateInterval);
    }
});
