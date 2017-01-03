import Ember from 'ember';

export const ICON_CLASSES = {
    add: 'structure-list-add fa fa-plus-circle',
    'add-dropdown': 'structure-list-add fa fa-play-circle fa-rotate-90',
    close: 'fa fa-times',
    code: 'fa fa-code',
    copy: 'fa fa-copy',
    'data-annotation': 'fa fa-hand-pointer-o',
    date: 'fa fa-calendar',
    download: 'fa fa-download',
    publish: 'structure-list-publish fa fa-cloud-upload',
    edit: 'fa fa-pencil',
    error: 'structure-list-error fa fa-exclamation-circle',
    'error-triangle': 'structure-list-error fa fa-exclamation-triangle',
    file: 'fa fa-file',
    geopoint: 'fa fa-map-marker',
    help: 'icon-button-help fa fa-question-circle',
    image: 'fa fa-picture-o',
    link: 'fa fa-link',
    list: 'fa fa-list',
    navigation: 'fa fa-eye',
    number: 'portia-icon portia-icon-number',
    options: 'structure-list-details fa fa-cog',
    ok: 'structure-list-publish fa fa-check-circle',
    play: 'structure-list-play fa fa-play-circle',
    price: 'fa fa-dollar',
    project: 'fa fa-folder',
    'raw html': 'fa fa-code',
    'regular expression': 'portia-icon portia-icon-regex',
    remove: 'structure-list-remove fa fa-minus-circle',
    rollback: 'structure-list-discard fa fa-history',
    'safe html': 'portia-icon portia-icon-safe-html',
    sample: 'fa fa-file',
    schema: 'fa fa-database',
    spider: 'portia-icon portia-icon-spider',
    structure: 'fa fa-sitemap',
    text: 'portia-icon portia-icon-text',
    'tool-css': 'fa fa-file-code-o',
    'tool-magic': 'fa fa-magic fa-flip-horizontal',
    'tool-select': 'fa fa-mouse-pointer',
    'tool-add': 'fa fa-plus',
    'tool-remove': 'fa fa-minus',
    'tool-multiple': 'fa fa-th-large',
    url: 'fa fa-globe',
    'url-generated': 'portia-icon portia-icon-generated-url',
    'url-feed': 'portia-icon portia-icon-feed-url',
    'vertical-ellipsis': 'fa fa-ellipsis-v',
    'warning-triangle': 'structure-list-warning fa fa-exclamation-triangle'
};

export default Ember.Component.extend({
    attributeBindings: ['tabindex'],
    classNames: ['icon-button'],
    classNameBindings: ['iconClasses', 'disabled', 'hasAction', 'modifyClasses'],
    tagName: 'i',

    bubbles: true,
    disabled: false,
    modifyClasses: '',

    hasAction: Ember.computed.bool('action'),

    beforeClick() {},

    click() {
        this.beforeClick();
        if (this.attrs.action && !this.get('disabled')) {
            this.attrs.action();
            if (!this.get('bubbles')) {
                return false;
            }
        }
    },

    iconClasses: Ember.computed('icon', function() {
        var icon = this.get('icon');
        return ICON_CLASSES[icon] || 'fa';
    })
});
