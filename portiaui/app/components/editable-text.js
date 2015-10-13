import Ember from 'ember';


export default Ember.Component.extend({
    classNames: ['editable-text'],
    classNameBindings: ['editing'],

    editing: false,
    spellcheck: true,
    value: null,

    init() {
        this._super(...arguments);
        if (this.get('editing')) {
            this.send('startEditing');
        }
    },

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
            if (this.attrs.cancel) {
                this.attrs.cancel();
            }
        },

        endEditing() {
            this.setProperties({
                editing: false,
                source: this.get('value')
            });
            if (this.attrs.save) {
                this.attrs.save();
            }
        }
    }
});
