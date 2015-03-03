import Ember from 'ember';
import Popover from '../mixins/popover';

export default Ember.Component.extend(Popover, {
    tagName: 'span',
    message: null,
    html: true,
    attributeBindings: ['name', 'title'],
    classNames: ['fa', 'fa-icon', 'fa-icon', 'fa-info-circle', 'inline-help'],

    title: function() {
        if (this.get('message')) {
            return this.messages.get(this.get('message'));
        }
    }.property('message'),
});
