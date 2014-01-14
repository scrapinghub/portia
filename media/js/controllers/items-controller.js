ASTool.ItemsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotation'],

	documentView: null,
	
	mappingAttributeBinding: 'controllers.annotation.mappingAttribute',

	addItem: function() {
		var newItem = ASTool.Item.create({ name: 'new item ' + ASTool.guid().substring(0, 5) });
		this.pushObject(newItem);
	},
	
	addField: function(owner) {
		var newField = ASTool.ItemField.create({ name: 'new field' });
		owner.set('fields', owner.fields || []);
		owner.fields.pushObject(newField);
	},

	actions: {
		
		addItem: function() {
			this.addItem();
		},
		
		addField: function(item) {
			this.addField(item);
		},
		
		deleteItem: function(item) {
			this.removeObject(item);
		},

		deleteField: function(item, field) {
			item.get('fields').removeObject(field);
		},
	   
		chooseField: function(item, field) {
			this.get('controllers.annotation').attributeMapped(this.get('mappingAttribute'), item, field)
			this.set('mappingAttribute', null); 
			this.popRoute();
		},

		back: function() {
			this.set('mappingAttribute', null);
			this._super();
		},

		undoChanges: function() {
			this.get('slyd').loadItems().then(function(items) {
				this.set('content', items);
			}.bind(this));
		},
	},

	willEnter: function() {
		this.set('documentView.canvas.interactionsBlocked', true);
	},

	willLeave: function() {
		this.set('documentView.canvas.interactionsBlocked', false);
		this.get('slyd').saveItems(this.content.toArray());
	},
});