import Ember from 'ember';

export const ICON_CLASSES = {
    add: 'structure-list-add fa fa-plus-circle',
    'add-dropdown': 'structure-list-add fa fa-play-circle fa-rotate-90',
    date: 'fa fa-calendar',
    edit: 'fa fa-pencil',
    geopoint: 'fa fa-map-marker',
    image: 'fa fa-picture-o',
    list: 'fa fa-list',
    number: 'portia-icon portia-icon-number',
    options: 'structure-list-details fa fa-cog',
    price: 'fa fa-dollar',
    'raw html': 'fa fa-code',
    remove: 'structure-list-remove fa fa-minus-circle',
    'safe html': 'portia-icon portia-icon-safe-html',
    sample: 'fa fa-file',
    schema: 'fa fa-database',
    spider: 'portia-icon portia-icon-spider',
    structure: 'fa fa-sitemap',
    text: 'portia-icon portia-icon-text',
    url: 'fa fa-globe',
    click: 'fa fa-mouse-pointer',
    set: 'fa fa-i-cursor',
    scroll: 'fa fa-unsorted',
    wait: 'fa fa-hourglass-half',
};

export default Ember.Component.extend({
    attributeBindings: ['tabindex'],
    classNames: ['list-item-icon'],
    classNameBindings: ['iconClasses', 'disabled', 'hasAction'],
    tagName: 'i',

    disabled: false,

    hasAction: Ember.computed.bool('action'),

    click() {
        if (this.attrs.action && !this.get('disabled')) {
            this.attrs.action();
        }
    },

    iconClasses: Ember.computed('icon', function() {
        var icon = this.get('icon');
        return ICON_CLASSES[icon] || 'fa';
    })
});
