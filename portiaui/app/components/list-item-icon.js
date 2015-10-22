import Ember from 'ember';

export const ICON_CLASSES = {
    date: 'fa fa-calendar',
    geopoint: 'fa fa-map-marker',
    image: 'fa fa-picture-o',
    list: 'fa fa-list',
    number: 'portia-icon portia-icon-number',
    price: 'fa fa-dollar',
    'raw html': 'fa fa-code',
    'safe html': 'portia-icon portia-icon-safe-html',
    sample: 'fa fa-file',
    schema: 'fa fa-database',
    spider: 'portia-icon portia-icon-spider',
    structure: 'fa fa-sitemap',
    text: 'portia-icon portia-icon-text',
    url: 'fa fa-globe'
};

export default Ember.Component.extend({
    classNames: ['list-item-icon'],
    classNameBindings: ['iconClasses'],
    tagName: 'i',

    iconClasses: Ember.computed('icon', function() {
        var icon = this.get('icon');
        return ICON_CLASSES[icon] || 'fa';
    })
});
