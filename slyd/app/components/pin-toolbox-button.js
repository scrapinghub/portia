import Ember from 'ember';
import BsButton from './bs-button';

export default BsButton.extend({
    toolbox: Ember.Object.create(),

    classNameBindings: ['pinned'],

    disabled: Ember.computed.reads('toolbox.fixed'),
    pinned: Ember.computed.or('toolbox.fixed', 'toolbox.pinned'),

    click: function() {
        this.toggleProperty('toolbox.pinned');
        if(window.localStorage) {
            localStorage.portia_toolbox_pinned = this.get('toolbox.pinned') ? 'true' : '';
        }
    },
});
