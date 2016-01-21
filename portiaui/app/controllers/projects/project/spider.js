import Ember from 'ember';
import { NAMED_COLORS } from '../../../utils/colors';

export default Ember.Controller.extend({
    extractedItems: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),

    // only a tags with a non-empty href attribute
    linkSelector: 'a[href]:not([href=""]):not([href^="javascript:"])',
    followedLinks: [],
    jsLinks: [],
    ignoredLinks: [],

    showExtractedItems: Ember.computed.bool('extractedItems.items.length'),

    followedLinkOverlayElements: Ember.computed.map('followedLinks', element => ({
        guid: Ember.guidFor(element),
        element,
        color: NAMED_COLORS.green
    })),
    jsLinkOverlayElements: Ember.computed.map('jsLinks', element => ({
        guid: Ember.guidFor(element),
        element,
        color: NAMED_COLORS.blue
    })),
    ignoredLinkOverlayElements: Ember.computed.map('ignoredLinks', element => ({
        guid: Ember.guidFor(element),
        element,
        color: NAMED_COLORS.red
    })),

    activate() {
        this.get('selectorMatcher').register(this.linkSelector, this, this.updateLinkElements);
    },

    deactivate() {
        this.get('selectorMatcher').unRegister(this.linkSelector, this, this.updateLinkElements);
    },

    updateLinkElements(elements) {
        this.set('followedLinks', elements);
    }
});
