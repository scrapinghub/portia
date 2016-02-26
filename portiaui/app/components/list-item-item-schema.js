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
            const sample = item.get('sample');
            if(sample.get('_autoCreatedSchema') &&
               sample.get('items.length') === 1 &&
               item.get('schema.id') !== sample.get('_autoCreatedSchema')) {
                this.get('dispatcher').deleteAutoCreatedSchema(sample);
            }

            // Map fields to the old schema to the new one
            this.get('dispatcher').changeItemSchema(item, item.get('schema'));
        }
    }
});
