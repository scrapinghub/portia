import Ember from 'ember';
import {OverlayUpdater} from '../services/browser-overlays';

export const IGNORED_ELEMENTS = new Set(['html', 'body']);

export default Ember.Component.extend({
    browserState: Ember.inject.service(),
    hoveredElement: Ember.inject.service(),

    classNames: ['overlay', 'hover-overlay'],
    classNameBindings: ['viewPortElement::hide'],
    colorOrder: [Infinity],
    colorProvider: Ember.inject.service(),
    showHoverOverlay: Ember.computed.readOnly('browserState.isInteractionMode'),
    timerId: null,
    viewPortElement: Ember.computed.alias('hoveredElement.element'),

    willInsertElement() {
        this.beginPropertyChanges();
        var color = this.get('colorProvider').register(this);
        this.set('color', color);
        OverlayUpdater.add(this);
        this.endPropertyChanges();
        this.scheduleUpdate(1);
    },

    willDestroyElement() {
        if (this.timerId !== null) {
            Ember.run.cancel(this.timerId);
            this.timerId = null;
        }
        this.beginPropertyChanges();
        OverlayUpdater.remove(this);
        this.get('colorProvider').unRegister(this);
        this.set('color', null);
        this.set('viewPortElement', null);
        this.endPropertyChanges();
    },

    scheduleUpdate(delay) {
        this.timerId = Ember.run.later(this, this.update, delay);
    },

    update() {
        Ember.run.scheduleOnce('sync', () => {
            var hoveredElement = null;
            if (this.get('showHoverOverlay')) {
                let viewPortDocument = Ember.$('iframe').contents();
                hoveredElement = viewPortDocument.find(':hover').toArray().pop();
                if (hoveredElement && IGNORED_ELEMENTS.has(hoveredElement.tagName.toLowerCase())) {
                    hoveredElement = null;
                }
            }
            this.set('viewPortElement', hoveredElement);
            this.scheduleUpdate(50);
        });
    }
});
