import BaseController from './base-controller';
import Item from '../models/item';
import ItemField from '../models/item-field';

export default BaseController.extend({

    needs: ['application', 'projects', 'project', 'spider', 'spider/index', 'template'],

    documentView: null,

    addItem: function() {
        var newItem = Item.create({ name: this.shortGuid('_') });
        this.addField(newItem);
        this.model.pushObject(newItem);
    },

    addField: function(owner, name, type) {
        if (!owner) {
            this.showErrorNotification('No Item selected for extraction');
            return;
        }
        var newField = ItemField.create({ name: name || 'new_field',
                                                 type: type || 'text',
                                                 required: false,
                                                 vary: false });
        owner.set('fields', owner.fields || []);
        owner.fields.pushObject(newField);
    },

    saveChanges: function() {
        var valid = true;
        this.get('content').forEach(function(item) {
            if (!item.isValid()) {
                this.showErrorNotification('The item ' + item.get('name') +
                    ' or one of its fields has an invalid name. Only A-Z, a-z, 0-9, - and _ are allowed characters.');
                valid = false;
            }
        }.bind(this));
        if (valid) {
            this.get('slyd').saveItems(this.model).then(function() {
                this.set('project_models.items', this.model);
                this.transitionToRoute('template');
            }.bind(this));
        }
    },

    actions: {

        addItem: function() {
            this.addItem();
        },

        addField: function(item) {
            this.addField(item);
        },

        deleteItem: function(item) {
            this.model.removeObject(item);
        },

        deleteField: function(item, field) {
            item.get('fields').removeObject(field);
        },

        saveChanges: function() {
            this.saveChanges();
        },

        undoChanges: function() {
            this.get('slyd').loadItems().then(function(items) {
                this.set('content', items);
                this.transitionToRoute('template');
            }.bind(this));
        },
    },

    willEnter: function() {},
});
