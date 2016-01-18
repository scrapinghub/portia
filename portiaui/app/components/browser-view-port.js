import Ember from 'ember';
import {getAttributeList} from './inspector-panel';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    classNames: ['browser-view-port', 'panel', 'panel-default'],

    hoverSelector: ':hover:not(html):not(body):not(head)',

    willInsertElement() {
        this.get('selectorMatcher').register(this.hoverSelector, this, this.updateHoveredElement);
    },

    willDestroyElement() {
        this.get('selectorMatcher').unRegister(this.hoverSelector, this, this.updateHoveredElement);
    },

    updateHoveredElement(elements) {
        const element = elements.get('lastObject');
        this.set('uiState.viewPort.hoveredElement',
            getAttributeList(element).length ? element : null);
    },

    actions: {
        viewPortClick() {
            if (this.attrs.clickHandler) {
                this.attrs.clickHandler(...arguments);
            }
        },

        reconnectWebsocket() {
            this.get('webSocket').connect();
        }
    }
});
