import Ember from 'ember';
import { NAMED_COLORS } from '../../../utils/colors';

function filterLinkElements(filterFn) {
    return Ember.computed('allLinkElements', 'extractedItems.links', function() {
        const linkElements = this.get('allLinkElements');
        const followed = this.getWithDefault('extractedItems.links', {});
        const filteredElements = [];
        for (let element of linkElements) {
            const url = URI(element.href).fragment('').toString();
            if (filterFn(url, followed)) {
                filteredElements.push(element);
            }
        }
        return filteredElements;
    });
}

function mapOverlayElements(elementsProperty, color) {
    return Ember.computed.map(elementsProperty, element => ({
        guid: Ember.guidFor(element),
        element,
        color
    }));
}

export default Ember.Controller.extend({
    extractedItems: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    // only a tags with a non-empty href attribute
    linkSelector: 'a[href]:not([href=""]):not([href^="javascript:"])',
    allLinkElements: [],

    showExtractedItems: Ember.computed.bool('extractedItems.items.length'),

    followedLinkElements: filterLinkElements(function(url, followed) {
        return followed[url] === 'raw';
    }),
    jsLinkElements: filterLinkElements(function(url, followed) {
        return followed[url] === 'js';
    }),
    ignoredLinkElements: filterLinkElements(function(url, followed) {
        return !followed[url];
    }),
    followedLinkOverlayElements: mapOverlayElements('followedLinkElements', NAMED_COLORS.green),
    jsLinkOverlayElements: mapOverlayElements('jsLinkElements', NAMED_COLORS.blue),
    ignoredLinkOverlayElements: mapOverlayElements('ignoredLinkElements', NAMED_COLORS.red),
    linkOverlayElements: Ember.computed(
        'followedLinkOverlayElements', 'jsLinkOverlayElements', 'ignoredLinkOverlayElements',
        function() {
            const followed = this.get('followedLinkOverlayElements');
            const js = this.get('jsLinkOverlayElements');
            const ignored = this.get('ignoredLinkOverlayElements');
            return [].concat(followed).concat(js).concat(ignored);
        }),

    init() {
        let ws = this.get('webSocket');
        ws.addCommand('metadata', this, this.msgMetadata);
        ws.addCommand('update_spider', this, this.msgMetadata);
    },

    activate() {
        this.get('selectorMatcher').register(this.linkSelector, this, this.updateLinkElements);
    },

    deactivate() {
        this.get('selectorMatcher').unRegister(this.linkSelector, this, this.updateLinkElements);
    },

    updateLinkElements(elements) {
        this.set('allLinkElements', elements);
    }
});
