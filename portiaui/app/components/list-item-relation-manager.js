import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    change: null,
    choices: [],
    value: null,

    matchQuery(value, query) {
        if (value && value.special && (value.special === 'add' || value.special === 'rename')) {
            return true;
        }
        return (value.get('name') || '') === query;
    },

    actions: {
        add(name) {
            if (this.attrs.create) {
                Ember.run.schedule('afterRender', () => {
                    this.attrs.create(name);
                });
            }
        },

        rename(name) {
            const model = this.get('value');
            model.set('name', name);
            model.save();
        }
    }
});
