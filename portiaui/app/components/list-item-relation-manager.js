import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    onChange: null,
    choices: [],
    selecting: false,
    value: null,

    actions: {
        add(name) {
            if (typeof this.attrs.validate === 'function' && !this.attrs.validate(name)) {
                return;
            }
            if (this.attrs.create) {
                this.attrs.create(name);
            }
        },

        rename(name) {
            if (typeof this.attrs.validate === 'function' && !this.attrs.validate(name)) {
                return;
            }
            const model = this.get('value');
            model.then((item) => {
                item.set('name', name);
                item.save();
            });
        }
    }
});
