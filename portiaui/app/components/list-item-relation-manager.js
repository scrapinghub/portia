import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    onChange: null,
    choices: [],
    selecting: false,
    value: null,

    actions: {
        add(name) {
            if (this.attrs.create) {
                this.attrs.create(name);
            }
        },

        rename(name) {
            const model = this.get('value');
            model.set('name', name);
            model.save();
        }
    }
});
