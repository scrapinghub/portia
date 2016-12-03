import Ember from 'ember';
const { computed } = Ember;
import { cleanUrl, renameAttr } from '../utils/utils';

export const NAVIGATION_MODE = 'navigation';
export const ANNOTATION_MODE = 'data-annotation';
export const INTERACTION_MODES = new Set([ANNOTATION_MODE]);
export const DEFAULT_MODE = NAVIGATION_MODE;

/* jshint ignore:start */
const META_STYLE = `<style title="portia-show-meta">
    head {
        display: block;
        display: -webkit-flex;
        display: flex;
        -webkit-flex-direction: column;
        flex-direction: column;
    }
    title, meta, link {
        display: block;
    }
    title {
        -webkit-order: 0;
        order: 0;
        font-weight: bold;
    }
    title::before {
        content: 'Title: ';
        font-weight: normal;
    }
    meta {
        -webkit-order: 1;
        order: 1;
    }
    meta[name][content]::after {
        content: attr(name) ': "' attr(content) '"';
    }
    meta[property][content]::after {
        content: attr(property) ': "' attr(content) '"';
    }
    meta[itemprop][content]::after {
        content: attr(itemprop) ': "' attr(content) '"';
    }
    link {
        -webkit-order: 2;
        order: 2;
    }
    link[href][rel]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(data-portia-href) '"';
    }
    link[href][rel][data-portia-hidden-media]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(data-portia-href) '" media: "' attr(data-portia-hidden-media) '"';
    }
    link[href][rel][type]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(data-portia-href) '" type: "' attr(type) '"';
    }
    link[href][rel][type][data-portia-hidden-media]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(data-portia-href) '" type: "' attr(type) '" media: "' attr(data-portia-hidden-media) '"';
    }
</style>`;
/* jshint ignore:end */

export default Ember.Service.extend(Ember.Evented, {
    extractedItems: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    backBuffer: [],
    cssEnabled: true,
    document: null,
    forwardBuffer: [],
    loading: false,
    mode: DEFAULT_MODE,
    _disabled: true,
    _url: null,
    baseurl: null,
    validUrl: true,

    invalidUrl: computed.not('validUrl'),

    disabled: Ember.computed('_disabled', 'webSocket.closed', 'mode', {
        get() {
            return this.get('_disabled') || this.get('webSocket.closed') ||
                this.get('mode') !== NAVIGATION_MODE;
        },

        set(key, value) {
            this.set('_disabled', value);
            return value || this.get('webSocket.closed') || this.get('mode') !== NAVIGATION_MODE;
        }
    }),
    isInteractionMode: Ember.computed('mode', function() {
        return INTERACTION_MODES.has(this.get('mode'));
    }),
    url: Ember.computed('_url', {
        get() {
            return this.get('_url');
        },

        set(key, value) {
            return this.go(value);
        }
    }),
    $document: Ember.computed('document', function() {
        const document = this.get('document');
        return document ? Ember.$(document) : null;
    }),

    init() {
        this._super(...arguments);
        this.on('contentChanged', () => {
            Ember.run.next(() => {
                Ember.run.scheduleOnce('sync', this, 'checkCSS');
            });
        });
    },

    resetUrl: Ember.observer('document', function() {
        if (!this.get('document')) {
            this.setProperties({
                '_url': null,
                'baseurl': null
            });
        }
    }),

    invalidateUrl() {
        this.set('validUrl', false);
    },

    go(url) {
        this.set('validUrl', true);
        const currentUrl = this.get('_url');
        url = cleanUrl(url);
        if (url && url !== currentUrl) {
            this._extract();

            this.beginPropertyChanges();
            if (currentUrl) {
                this.get('backBuffer').pushObject(currentUrl);
            }
            this.set('_url', url);
            this.set('forwardBuffer', []);
            this.endPropertyChanges();
        }
        return url;
    },

    back() {
        this._updateBuffers(this.get('backBuffer'),
                            this.get('forwardBuffer'));
    },

    forward() {
        this._updateBuffers(this.get('forwardBuffer'),
                            this.get('backBuffer'));
    },

    reload() {
        this.notifyPropertyChange('_url');
    },

    checkCSS() {
        const $iframe = this.get('$document');
        const $showMetaStyleElement = $iframe.find('style[title="portia-show-meta"]');
        const cssEnabled = !$showMetaStyleElement.length;
        this.set('cssEnabled', cssEnabled);
    },

    disableCSS() {
        if (![ANNOTATION_MODE].includes(this.get('mode'))) {
            return;
        }

        const iframe = this.get('document');
        if (this.get('cssEnabled') && iframe) {
            const $iframe = this.get('$document');
            const $styles = $iframe.find(
                'style:not([title="portia-show-meta"]), link[rel="stylesheet"]');
            renameAttr($styles, 'media', 'data-portia-hidden-media');
            // disable stylesheets using an impossible media query
            $styles.attr('media', '(width: -1px)');
            renameAttr($iframe.find('[style]'), 'style', 'data-portia-hidden-style');
            $iframe.find('body').append(META_STYLE); // jshint ignore:line
            this.set('cssEnabled', false);
        }
    },

    enableCSS() {
        if (![ANNOTATION_MODE].includes(this.get('mode'))) {
            return;
        }

        const iframe = this.get('document');
        if (!this.get('cssEnabled') && iframe) {
            const $iframe = this.get('$document');
            $iframe.find('style[title="portia-show-meta"]').remove();
            const $styles = $iframe.find(
                'style:not([title="portia-show-meta"]), link[rel="stylesheet"]');
            $styles.attr('media', null);
            renameAttr($styles, 'data-portia-hidden-media', 'media');
            renameAttr($iframe.find('[data-portia-hidden-style]'),
                                    'data-portia-hidden-style', 'style');
            this.set('cssEnabled', true);
        }
    },

    setAnnotationMode() {
        this.set('mode', ANNOTATION_MODE);
    },

    clearAnnotationMode() {
        if (this.get('mode') === ANNOTATION_MODE) {
            this.set('mode', DEFAULT_MODE);
            this.enableCSS();
        }
    },

    _updateBuffers(currentBuffer, otherBuffer) {
        if (currentBuffer.length) {
            this.beginPropertyChanges();
            otherBuffer.pushObject(this.get('_url'));
            const url = currentBuffer.popObject();
            this._extract();
            this.setProperties({
                '_url': url,
                'baseurl': null
            });
            this.endPropertyChanges();
        }
    },

    _extract() {
        this.get('extractedItems').activateExtraction();
    }
});
