import Ember from 'ember';
import BsButton from './bs-button';

export default BsButton.extend({
    toolbox: Ember.Object.create(),

    classNameBindings: ['pinned'],

    disabled: function() {
        return this.get('toolbox.fixed');
    }.property('toolbox.fixed'),

    pinned: function() {
        return this.get('disabled') || this.get('toolbox.pinned');
    }.property('toolbox.fixed', 'toolbox.pinned'),

    click: function() {
        this.set('toolbox.pinned', !this.get('toolbox.pinned'));
        if(window.localStorage) {
            localStorage.portia_toolbox_pinned = this.get('toolbox.pinned') ? 'true' : '';
        }
    },
});
