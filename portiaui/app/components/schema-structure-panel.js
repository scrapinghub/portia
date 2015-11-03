import Ember from 'ember';
import ActiveChildrenMixin from '../mixins/active-children';
import InstanceCachedObjectProxy from '../utils/instance-cached-object-proxy';
import {computedIsCurrentModelById} from '../services/ui-state';


const Field = InstanceCachedObjectProxy.extend({
    uiState: Ember.inject.service(),

    itemComponentName: 'schema-structure-field-item',

    active: Ember.computed.readOnly('isCurrentField'),
    isCurrentField: computedIsCurrentModelById('field'),
    key: Ember.computed('id', function() {
        const id = this.get('id');
        return `field:${id}`;
    })
});

const FieldList = Ember.Object.extend(ActiveChildrenMixin, {
    itemComponentName: 'schema-structure-root',
    key: 'root',

    children: Ember.computed.map('schema.fields', function(field) {
        return Field.create({
            content: field,
            container: this.get('container')
        });
    }),
    schema: Ember.computed.readOnly('toolPanel.schema')
});

export default Ember.Component.extend({
    tagName: '',

    schemaTree: null,

    init() {
        this._super();
        this.schemaTree = [
            FieldList.create({
                toolPanel: this,
                container: this.get('container')
            })
        ];
    }
});
