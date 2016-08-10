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
            item.get('sample').then(sample => {
                this.get('dispatcher').changeItemSchema(item, schema).then(() => {
                    sample.get('items').then(items => {
                        const autoCreated = sample.get('_autoCreatedSchema');
                        const canRemove = (autoCreated &&
                                           items.get('length') <= 1 &&
                                           schema.get('id') !== autoCreated);
                        if (canRemove) {
                            this.get('dispatcher').deleteAutoCreatedSchema(sample);
                        }
                        sample.reload();
                    });
                });
            });
        }
    }
});
