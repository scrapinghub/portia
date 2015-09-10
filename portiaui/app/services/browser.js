import Ember from 'ember';


export const DEFAULT_MODE = 'navigation';
export const ANNOTATION_MODE = 'annotation';
export const INTERACTION_MODES = new Set([ANNOTATION_MODE]);

export default Ember.Service.extend({
    backBuffer: [],
    document: null,
    forwardBuffer: [],
    iFrame: null,
    loading: false,
    mode: DEFAULT_MODE,
    url: 'owlkingdom.com',

    disabled: Ember.computed.equal('iFrame', null),
    isInteractionMode: Ember.computed('mode', function() {
        return INTERACTION_MODES.has(this.get('mode'));
    }),
    $document: Ember.computed('document', function() {
        const document = this.get('document');
        return document ? Ember.$(document) : null;
    }),
    $iFrame: Ember.computed('iFrame', function() {
        const iFrame = this.get('iFrame');
        const $iFrame = iFrame ? Ember.$(iFrame) : null;
        if ($iFrame) {
            $iFrame.off('.portia-browser')
                   .on('load.portia-browser', Ember.run.bind(this, this.documentLoaded));
        }
        return $iFrame;
    }),

    updateContent: Ember.observer('url', 'iFrame', function() {
        let url = this.get('url');
        const $iFrame = this.get('$iFrame');  // observing iFrame but getting $iFrame

        if (!$iFrame) {
            return;
        }

        if (!url) {
            $iFrame.attr('srcdoc', '');
            return;
        }

        if (!url.includes('://')) {
            url = `http://${url}`;
        }

        this.set('loading', true);
        // use cors-anywhere.herokuapp.com to get the url content
        Ember.$.get(`https://cors-anywhere.herokuapp.com/${url}`,
            Ember.run.bind(this, content => {
                var baseUrl = url.match(/^[^\/]+:\/\/[^\/]+/)[0];
                // make urls relative to page url
                content = content.replace(/(href|src)=(["'])\/(?!\/)/gi, `$1=$2${baseUrl}/`);
                if (!content.includes('<base')) {
                    content = content.replace(/<\/head>/i, `<base href="${url}"/></head>`);
                }
                $iFrame.attr('srcdoc', content);
            })
        );
    }),

    registerIFrame(iFrame) {
        if (this.get('iFrame')) {
            throw new Error('Only one iframe can be registered.');
        }

        this.setProperties({
            iFrame: iFrame,
            document: null
        });
    },

    unRegisterIFrame(iFrame) {
        if (this.get('iFrame') !== iFrame) {
            throw new Error('Attempting to un-register iframe that is not registered.');
        }

        this.get('$iFrame').off('.portia-browser');

        this.setProperties({
            iFrame: null,
            document: null
        });
    },

    go(url) {
        this.beginPropertyChanges();
        this.get('backBuffer').pushObject(this.get('url'));
        this.set('url', url);
        this.set('forwardBuffer', []);
        this.endPropertyChanges();
    },

    back() {
        if (this.get('backBuffer.length')) {
            this.beginPropertyChanges();
            this.get('forwardBuffer').pushObject(this.get('url'));
            this.set('url', this.get('backBuffer').popObject());
            this.endPropertyChanges();
        }
    },

    forward() {
        if (this.get('forwardBuffer.length')) {
            this.beginPropertyChanges();
            this.get('backBuffer').pushObject(this.get('url'));
            this.set('url', this.get('forwardBuffer').popObject());
            this.endPropertyChanges();
        }
    },

    reload() {
    },

    setAnnotationMode() {
        this.set('mode', ANNOTATION_MODE);
    },

    clearAnnotationMode() {
        if (this.get('mode') === ANNOTATION_MODE) {
            this.set('mode', DEFAULT_MODE);
        }
    },
    
    documentLoaded() {
        this.setProperties({
            document: this.get('iFrame').contentDocument,
            loading: false
        });
    }
});
