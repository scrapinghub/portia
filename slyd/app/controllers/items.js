import BaseController from './base-controller';
import Item from '../models/item';
import ItemField from '../models/item-field';

export default BaseController.extend({

    needs: ['application', 'projects', 'project'],

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
            var items = this.get('model'),
                slyd = this.get('slyd');
            items = items.map(function(item) {
                item = item.serialize();
                if (item.fields) {
                    item.fields = slyd.listToDict(item.fields);
                }
                return item;
            });
            items = slyd.listToDict(items);
            this.get('ws').save('items', items).then(function(data) {
                items = slyd.dictToList(data.saved.items, Item);
                items.forEach(function(item) {
                    if (item.fields) {
                        item.fields = slyd.dictToList(item.fields, ItemField);
                    }
                });
                this.set('project_models.items', items);
                this.transitionToRoute('template');
            }.bind(this));
        }
    },

    getParentRoute: function() {
        var handlerInfo = this.get('router').router.currentHandlerInfos;
        return handlerInfo[handlerInfo.length - 2].name;
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
                this.transitionToRoute(this.getParentRoute());
            }.bind(this));
        },
    },

    willEnter: function() {},
});
