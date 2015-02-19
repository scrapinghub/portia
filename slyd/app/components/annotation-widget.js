import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['annotation-widget'],
    classNameBindings: ['inDoc:in-doc'],
    annotation: null,
    attributeName: null,
    fieldName: null,
    fieldType: null,
    creatingField: false,
    inDoc: false,
    pos: null,

    hideWidget: function() {
        if (this.get('annotation') === null ) {
            this.sendAction('hide');
        }
    }.observes('annotation'),

    attributes: function() {
        return (this.get('annotation.attributes') || []).map(function(attribute) {
            return attribute.get('name');
        });
    }.property('annotation.attributes'),

    createFieldDisabled: function() {
        return Ember.isEmpty(this.get('fieldName'));
    }.property('fieldName'),

    attributeValue: function() {
        if (this.get('attributeName') && !Ember.isEmpty(this.get('annotation.attributes'))) {
            return this.get('annotation.attributes').findBy(
                'name', this.get('attributeName')).get('value');
        } else {
            return '< Empty attribute >';
        }
    }.property('attributeName', 'fieldName', 'trimTo'),

    actions: {

        showCreateFieldWidget: function() {
            this.set('creatingField', true);
            this.set('fieldName', '');
        },

        createField: function() {
            if (this.get('fieldName') && this.get('fieldType')) {
                this.set('creatingField', false);
                this.get('controller').send('createField',
                                            this.get('fieldName'),
                                            this.get('fieldType'));
                this.get('controller').send('mapAttribute',
                                            this.get('annotation'),
                                            this.get('attributeName'),
                                            this.get('fieldName'));
            }
        },

        switchTrim: function() {
            this.set('trimTo', this.get('trimTo') === 40 ? 500 : 40);
        },

        dismiss: function() {
            this.sendAction('hide');
        },

        edit: function() {
            this.sendAction('edit', this.get('annotation'));
        },

        save: function() {
            this.sendAction('hide');
        },

        updateField: function(value, field) {
            if (!field) {
                return;
            }
            if (field === 'field') {
                this.sendAction('mapAttr', this.get('annotation'), value, this.get('attributeName'));
            } else {
                this.sendAction('mapAttr', this.get('annotation'), this.get('fieldName'), value);
            }
        },

        delete: function() {
            this.sendAction('delete', this.get('annotation'));
        }
    },

    itemFields: function() {
        var fields = this.get('item.fields') || [];
        var options = fields.map(function(field) {
            var name = field.get('name');
            return { value: name, label: name };
        });
        options.pushObject({ value: 'sticky', label: '-just required-' });
        options.pushObject({ value: 'create_field', label: '-create new-' });
        return options;
    }.property('item.fields.@each'),

    mappings: function() {
        return this.get('annotation.mappedAttributes');
    }.property('annotation.mappedAttributes'),

    hasMultipleMappings: function() {
        try {
            return this.get('annotation.mappedAttributes').length > 1;
        } catch (e) {
            return false;
        }
    }.property('annotation.mappedAttributes'),

    mouseEnter: function(event) {
        if (!this.get('inDoc')) {
            this.set('annotation.highlighted', true);
            this.sendAction('highlighted', this.get('annotation'));
        }
        event.stopPropagation();
    },

    mouseLeave: function(event) {
        if (!this.get('inDoc')) {
            this.set('annotation.highlighted', false);
        }
        event.stopPropagation();
    },

    initValues: function() {
        var mapping;
        if (!Ember.isEmpty(this.get('annotation.mappedAttributes'))) {
            mapping = this.get('annotation.mappedAttributes.firstObject');
            this.set('attributeName', mapping.get('name'));
            this.set('fieldName', mapping.get('mappedField'));
        } else if (!Ember.isEmpty(this.get('annotation.stickyAttributes'))) {
            mapping = this.get('annotation.stickyAttributes.firstObject');
            this.set('attributeName', mapping.get('name'));
            this.set('fieldName', 'sticky');
        }
    }.observes('annotation.annotations', 'annotations.mappedAttributes'),

    didInsertElement: function() {
        if (this.get('inDoc')) {
            Ember.$(this.get('element')).css({ 'top': this.get('pos.y'),
                                         'left': this.get('pos.x') - 100});
            this.get('document.view').setInteractionsBlocked(true);
        }
        this._super();
        this.initValues();
    },

    willDestroyElement: function() {
        this.get('document.view').setInteractionsBlocked(false);
    },
});
