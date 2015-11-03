import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    item: null,

    actions: {
        addSchema(name) {
            const item = this.get('item');
            const project = item.get('schema.project');
            const schema = this.get('dispatcher').addNamedSchema(
                project, name, /* redirect = */false);
            item.set('schema', schema);
            item.save();
        },

        changeSchema() {
            const item = this.get('item');
            item.save();
        }
    }
});
