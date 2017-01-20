import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend({
    tagName: '',
    extractedItems: service(),
    store: service(),

    type: computed.readOnly('extractedItems.type'),
    spider: computed.readOnly('extractedItems.spider'),
    changes: computed('extractedItems.changes', function() {
        return (this.get('extractedItems.changes') || []);
    }),
    changed: computed('extractedItems.changed', function() {
        return (this.get('extractedItems.changed') || []);
    }),

    hasWarning: computed('type', 'changes.[]', function() {
        let hasChanges = this.get('changes').length > 0;
        if (this.get('type') === 'js') {
            if (hasChanges && this.get('changes')[0] === 'no_items') {
                return false;
            } else {
                return true;
            }
        }
        return hasChanges;
    }),

    change: computed('hasWarning', function() {
        let change = this.get('changes')[0];
        return change ? change : 'js_not_required';
    }),

    changeInfo: computed('change', function() {
        let change = this.get('change'),
            changes = this.get('changed'),
            type = this.get('type');
        if (change === 'missing_items' || change === 'missing_fields') {
            // TODO: Properly handle these conditions
            change = type === 'js' ? 'no_items' : 'js_not_required';
        }
        let CHANGES = {
            js_not_required: {
                text: `Javascript is enabled for this sample and may not be needed. \
                       Your spider may run faster if Javascript is not run on pages like this`,
                path: 'projects.project.spider.options',
            },
            no_items: {
                text: `Javascript is not enabled for this sample. It may extract more accurate \
                       data if it is enabled`,
                path: 'projects.project.spider.options',
            },
            missing_required_field: {
                path: 'projects.project.schema.field.options',
            }
        };
        let opts = CHANGES[change];
        if (!opts) {
            return {};
        }
        if (change === 'missing_required_field') {
            let field = this.get('store').peekRecord('field', changes[1][0]),
                text = `The field "${field.get('name')}" is marked as required but there is no \
                        annotation for that field`;
            opts.text = text;
            opts.model = field;
            return opts;
        }
        opts.model = this.get('spider');
        return opts;
    }),

    icon: computed('hasWarning', function() {
        return this.get('hasWarning') ? 'warning-triangle' : 'ok';
    }),
});
