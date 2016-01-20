import Ember from 'ember';

export const ICON_CLASSES = {
    add: 'structure-list-add fa fa-plus-circle',
    'add-dropdown': 'structure-list-add fa fa-play-circle fa-rotate-90',
    close: 'fa fa-times',
    'data-annotation': 'fa fa-hand-pointer-o',
    date: 'fa fa-calendar',
    edit: 'fa fa-pencil',
    error: 'structure-list-error fa fa-exclamation-circle',
    geopoint: 'fa fa-map-marker',
    image: 'fa fa-picture-o',
    list: 'fa fa-list',
    navigation: 'fa fa-eye',
    number: 'portia-icon portia-icon-number',
    options: 'structure-list-details fa fa-cog',
    price: 'fa fa-dollar',
    project: 'fa fa-folder',
    'raw html': 'fa fa-code',
    remove: 'structure-list-remove fa fa-minus-circle',
    'safe html': 'portia-icon portia-icon-safe-html',
    sample: 'fa fa-file',
    schema: 'fa fa-database',
    spider: 'portia-icon portia-icon-spider',
    structure: 'fa fa-sitemap',
    text: 'portia-icon portia-icon-text',
    url: 'fa fa-globe',
    warning: 'structure-list-warning fa fa-exclamation-circle'
};

export default Ember.Component.extend({
    attributeBindings: ['tabindex'],
    classNames: ['icon-button'],
    classNameBindings: ['iconClasses', 'disabled', 'hasAction'],
    tagName: 'i',

    bubbles: true,
    disabled: false,

    hasAction: Ember.computed.bool('action'),

    click() {
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
