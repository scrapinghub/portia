import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['annotation-type-selector'],

    choices: ['date', 'geopoint', 'image', 'number', 'price', 'raw html', 'safe html', 'text',
              'url'],

    click() {
        return false;
    },

    actions: {
        startEditing() {
            this.set('editing', true);
        },

        cancelEditing() {
            this.set('editing', false);
        }
    }
});
