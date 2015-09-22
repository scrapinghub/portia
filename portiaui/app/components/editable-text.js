import Ember from 'ember';


export default Ember.Component.extend({
    classNames: ['editable-text'],
    classNameBindings: ['editing'],

    editing: false,
    value: null,

    click() {
        if (this.get('editing')) {
            return false;
        }
    },

    actions: {
        startEditing() {
            this.setProperties({
                editing: true,
                value: this.get('source')
            });
            Ember.run.schedule('afterRender', () => {
                this.$('input').focus().select();
            });
        },

        cancelEditing() {
            this.set('editing', false);
        },

        endEditing() {
            this.setProperties({
                editing: false,
                source: this.get('value')
            });
        }
    }
});
