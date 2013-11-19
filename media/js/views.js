/*************************** Components **************************/

ASTool.MyButtonComponent = Ember.Component.extend({
	click: function() {
		this.sendAction();
	}
});

/*************************** Views ********************************/

ASTool.ElemAttributeView = Ember.View.extend({
	templateName: 'elem-attribute',
	name: null,
	value: null,
});

ASTool.ItemView = Ember.View.extend({
	templateName: 'item',
	item: null,
	mappingAttribute: null,
});

ASTool.EditField = Ember.TextField.extend({
	owner: null,
	change: function(evt) {
		this.get('owner').save();
	}
});

ASTool.EditBox = Ember.Checkbox.extend({
	owner: null,
	change: function(evt) {
		this.get('owner').save();
	}
});

ASTool.TypeSelect = Ember.Select.extend({
	owner: null,
	content: ['geopoint', 'image', 'number', 'price', 'raw html', 'safe html', 'text'],
	change: function(evt) {
		this.get('owner').save();
	}
});

ASTool.AnnotatedDocumentView = Ember.View.extend({
	templateName: 'annotated-document-view',
	
	didInsertElement: function() {
		this.get('controller').transitionToRoute('page');
		$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
		$('#toolbar').height(window.innerHeight);
	},
});


/*************************** Helpers ******************************/
Ember.Handlebars.helper('trim', function(text) {
	var maxLength = 400;
	if (text.length > 400) {
		return text.substring(0, 400) + "...";
	} else {
		return text;
	}
});
