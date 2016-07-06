import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    item: null,
    selecting: false,

    actions: {
        addSchema(name) {
            const item = this.get('item');
            const project = item.get('schema.project');
            this.get('dispatcher').addNamedSchema(
                project, name, /* redirect = */false).then((schema) => {
                item.set('schema', schema);
                item.save();
            });
        },

        changeSchema() {
            const item = this.get('item');
            const schema = item.get('schema.content');  // get the new schema
            item.set('schema', schema);
            item.save();
        }
    }
});
