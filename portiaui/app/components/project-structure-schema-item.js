import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    cannotDeleteSchema: Ember.computed.gt('schema.items.length', 0),
    schema: Ember.computed.readOnly('item.content'),

    actions: {
        removeSchema() {
            const schema = this.get('schema');
            this.get('dispatcher').removeSchema(schema);
        },

        saveSchema() {
            const schema = this.get('schema');
            schema.save();
        }
    }
});
