import Ember from 'ember';
import {getAttributeList} from './inspector-panel';


export const IGNORED_ELEMENTS = new Set(['html', 'body']);

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    colorProvider: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    uiState: Ember.inject.service(),

    classNames: ['overlay', 'hover-overlay'],
    classNameBindings: ['viewPortElement::hide', 'hoveringExistingOverlay:hide'],

    colorOrder: [Infinity],
    timerId: null,
    updateInterval: 100,

    existingElementOverlay: Ember.computed(
        'browserOverlays.elementOverlays.@each.viewPortElement', 'viewPortElement', function() {
            const hoveredElement = this.get('viewPortElement');
            return this.get('browserOverlays.elementOverlays')
                .reject((elementOverlay) => elementOverlay === this)
                .findBy('viewPortElement', hoveredElement);
        }),
    hoveringExistingOverlay: Ember.computed.notEmpty('existingElementOverlay'),
    showHoverOverlay: Ember.computed.readOnly('browser.isInteractionMode'),
    viewPortElement: Ember.computed.alias('uiState.viewPort.hoveredElement'),

    click() {
        const existingElementOverlay = this.get('existingElementOverlay');
        if (existingElementOverlay) {
            existingElementOverlay.click();
        } else {
            const viewPortElement = this.get('viewPortElement');
            if (!viewPortElement) {
                const routing = this.get('routing');
                routing.transitionTo('projects.project.spider.sample', [], {}, true);
            }
        }
    },

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
            const $document = this.get('browser.$document');
            if ($document) {
                hoveredElement = $document.find(':hover').toArray().pop();
            }
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
