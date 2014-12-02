ASTool.ItemsController = Em.ArrayController.extend(ASTool.BaseControllerMixin, {
	
	needs: ['application', 'annotation'],

	documentView: null,

	addItem: function() {
		var newItem = ASTool.Item.create({ name: ASTool.shortGuid('_') });
		this.addField(newItem);
		this.pushObject(newItem);
	},
	
	addField: function(owner, name, type) {
		var newField = ASTool.ItemField.create({ name: name || 'new_field',
										         type: type || 'text',
										         required: false,
										         vary: false });
		owner.set('fields', owner.fields || []);
		owner.fields.pushObject(newField);
	},

	saveChanges: function() {
		valid = true;
		this.get('content').forEach(function(item) {
			if (!item.isValid()) {
				alert('The item ' + item.get('name') + 
					' or one of its fields has an invalid name. Only A-Z, a-z, 0-9, - and _ are allowed characters.');
				valid = false;
			}
		}.bind(this));
		if (valid) {
			this.get('slyd').saveItems(this.toArray()).then(function() {
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
			this.removeObject(item);
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

	willEnter: function() {
		if (this.get('documentView.canvas')) {
			this.set('documentView.canvas.interactionsBlocked', true);	
		}	
	},

	willLeave: function() {
		if (this.get('documentView.canvas')) {
			this.set('documentView.canvas.interactionsBlocked', false);	
		}	
	},
});