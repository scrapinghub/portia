import Ember from 'ember';

const Overlay = Ember.Object.extend({
    component: 'hover-overlay'
});

export default Ember.Component.extend({
    classNames: ['browser-view-port'],

    browserOverlays: Ember.inject.service(),
    browserState: Ember.inject.service(),

    content: null,
    overlays: Ember.computed.readOnly('browserOverlays.overlays'),
    url: Ember.computed.alias('browserState.url'),
    updateContent: Ember.observer('url', function() {
        var url = this.get('url');

        if (!url) {
            this.set('content', '');
            return;
        }

        if (!url.includes('://')) {
            url = `http://${url}`;
        }

        this.set('browserState.loading', true);
        // use cors-anywhere.herokuapp.com to get the url content
        Ember.$.get(`https://cors-anywhere.herokuapp.com/${url}`,
            Ember.run.bind(this, content => {
                var baseUrl = url.match(/^[^\/]+:\/\/[^\/]+/)[0];
                // make urls relative to page url
                content = content.replace(/(href|src)=(["'])\/(?!\/)/gi, `$1=$2${baseUrl}/`);
                if (!content.includes('<base')) {
                    content = content.replace(/<\/head>/i, `<base href="${url}"/></head>`);
                }
                this.set('content', content);
                this.set('browserState.loading', false);
            })
        );
    }),

    init() {
        this._super();
        this.updateContent();
        this.overlay = Overlay.create({
            viewPort: this
        });
    },

    willInsertElement() {
        this.get('browserState').registerViewPort(this);
    },

    willDestroyElement() {
        this.get('browserState').unRegisterViewPort(this);
    },

    mouseEnter() {
        this.get('browserOverlays').add(this.overlay);
    },

    mouseLeave() {
        this.get('browserOverlays').remove(this.overlay);
    }
});
