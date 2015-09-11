import Ember from 'ember';

const BrowserIFrame = Ember.Component.extend({
    browser: Ember.inject.service(),

    tagName: 'iframe',

    disabled: Ember.computed.alias('browser.disabled'),
    document: Ember.computed.alias('browser.document'),
    loading: Ember.computed.alias('browser.loading'),
    url: Ember.computed.readOnly('browser.url'),

    updateContent: Ember.observer('url', function() {
        let url = this.get('url');
        const $element = this.$();

        if (!url) {
            $element.attr('srcdoc', '');
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
                $element.attr('srcdoc', content);
            })
        );
    }),

    click() {
        if (this.attrs.clickHandler) {
            /*
                For some reason, when using Ember.run, if the handler initiates
                a route transition and the page in the iframe has a <base> tag,
                the url is changed to the route uri concatenated to the iframe's
                <base> url.
                Using Ember.run.next fixes this.
             */
            Ember.run.next(this, this.attrs.clickHandler, ...arguments);
        }
        return false;
    },

    willInsertElement() {
        if (BrowserIFrame.instances) {
            throw new Error('The can be only one browser-iframe instance!');
        }
        BrowserIFrame.instances++;
    },

    didInsertElement() {
        Ember.run.schedule('afterRender', () => {
            this.setProperties({
                disabled: false,
                document: null
            });
            this.updateContent();
        });

        this.$().off('.portia-iframe')
            .on('load.portia.portia-iframe', () => {
                this.setupEventHandlers();
                Ember.run(this, this.documentLoaded);
            });
    },

    willDestroyElement() {
        this.setProperties({
            disabled: true,
            document: null
        });
        BrowserIFrame.instances--;
    },

    documentLoaded() {
        this.setProperties({
            document: this.element.contentDocument,
            loading: false
        });
    },

    setupEventHandlers() {
        Ember.$(this.element.contentDocument).off('.portia-iframe')
            .on('click.portia.portia-iframe', this.click.bind(this));
    }
});

BrowserIFrame.reopenClass({
    instances: 0
});

export default BrowserIFrame;