/*************************** Base views *****************************/

ASTool.Select = Ember.Select.extend(JQ.Widget, {
	uiType: 'combobox',
	uiOptions: ['label', 'disabled'],
	uiEvents: ['select'],
	optionValuePath: 'content.option',
	optionLabelPath: 'content.label',
});


ASTool.ButtonView = Em.View.extend(JQ.Widget, {
	uiType: 'button',
	uiOptions: ['label', 'disabled', 'icons', 'text', 'selected'],
	tagName: 'button',
	classNames: ['controlShadow'],
	minWidth: null,
	maxWidth: null,
	action: null,
	argument: null,
	attributeBindings: ['name', 'title'],
	_label: null,
	title: null,

	name: function() {
		return this.get('action') + '_' + this.get('label');
	}.property('action', 'label'),
  
	icons: function() {
		return this.get('icon') ? {primary: this.get('icon')} : {};
	}.property('icon'),
  
	click: function() {
		if (this.get('action')) {
			this.get('controller').send(this.get('action'), this.get('argument'));	
		}
	},

	label: function(key, label) {
		if (arguments.length > 1) {
			label = trim(label, 32);
			this.set('_label', label);
		} 
		return this.get('_label');
	}.property('_label'),

	didInsertElement: function() {
		this._super();
		if (this.minWidth) {
			var ui = $(this.get('element'));
			ui.css('min-width', this.minWidth);
		}
		if (this.maxWidth) {
			var ui = $(this.get('element'));
			ui.css('max-width', this.maxWidth);
		}
	},
});


ASTool.TextField = Em.TextField.extend({
	width:null,
	placeholder: null,
	attributeBindings: ['placeholder'],
	
	didInsertElement: function() {
		this._super();
		var ui = $(this.get('element'));
		ui.addClass('ui-corner-all');
		if (this.width) {
			var ui = $(this.get('element'));
			ui.css('width', this.width);
		}
	},
});


ASTool.CheckBox = Ember.Checkbox.extend();


ASTool.ToggleButton = Ember.Checkbox.extend(JQ.Widget, {
	uiType: 'button',
	uiOptions: ['label', 'disabled', 'selected', 'checked'],

	updateCheckedState: function() {
		var ui = $(this.get('element'));
		ui.attr('checked', this.get('checked'));
		ui.button('refresh');
	}.observes('checked')
});


ASTool.InlineTextField = Ember.View.extend({
  layoutName: 'inline-textfield',

 	click: function() {
    	if (!this.get('isEditing'))  {
      		this.set('isEditing', true);
      		Ember.run.scheduleOnce('afterRender', this, this.focusTextField);
    	}
  	},

  	focusTextField: function() {
    	var val = this.$('input').val();
    	this.$('input').focus();

    	this.$('input').val('');
    	this.$('input').val(val);
  	},

  	save: function() {
  	},

  	textField: Ember.TextField.extend({
  		classNames: ['inlinetextarea', 'ui-corner-all'],

    	focusOut: function() {
    		this.done();
    	},

    	keyPress: function(e) {
        	if (e.keyCode == $.ui.keyCode['ENTER']) {
        		this.done();
        	}
    	},

    	done: function() {
			var parentView = this.get('parentView');
      		parentView.set('isEditing', false);
      		parentView.save();
    	},
  	}),
});

/************************* Application views ****************************/

ASTool.FollowSelect = ASTool.Select.extend({
	content: [{ option: 'none', label: "Don't follow links" },
			  { option: 'patterns', label: 'Follow links that match the following patterns' }],

	select: function(event, data) {
		// FIXME: raise an event instead of directly setting the property.
		this.set('controller.model.links_to_follow', data.item.value);
	},
});


ASTool.TypeSelect = ASTool.Select.extend({
	owner: null,
	content: [{ option: 'geopoint', label: 'geopoint' },
			  { option: 'number', label: 'number' },
			  { option: 'image', label: 'image' },
			  { option: 'price', label: 'price' },
			  { option: 'raw html', label: 'raw html' },
			  { option: 'safe html', label: 'safe html' },
			  { option: 'text', label: 'text'},
			  { option: 'url', label: 'url' }],

	select: function(event, data) {
		this.get('itemField').set('type', data.item.value);
	},
});


ASTool.VariantSelect = ASTool.Select.extend({

	content: function() {
		var options = [{ option: '0', label: "Base(0)" }];
		var maxVariant = this.get('controller.controllers.annotations.maxVariant');
		var i;
		for (i = 1; i <= maxVariant; i++) {
			options.pushObject({ option: i + '', label: 'Variant ' + i });
		}
		options.pushObject({ option: i + '', label: 'Add new variant (' + i + ')' });
		return options;
	}.property('controller.controllers.annotations.maxVariant'),

	select: function(event, data) {
		// FIXME: raise an event instead of directly setting the property.
		this.set('controller.model.variant', data.item.value);
	},
});


ASTool.AnnotationWidget = ASTool.ButtonView.extend({

	mouseEnter: function() {
		this.set('argument.highlighted', true);
		this.get('controller').send('annotationHighlighted', this.argument);
	},

	mouseLeave: function() {
		this.set('argument.highlighted', false);
	},
});


ASTool.CSSPathWidget = ASTool.ButtonView.extend({

	mouseEnter: function() {
		this.get('controller').send('highlightElement', this.get('argument'));
	},

	mouseLeave: function() {
		this.get('controller').send('highlightElement', null);
	},
});


ASTool.IgnoreWidget = ASTool.TextField.extend({
	ignore: null,
	valueBinding: 'ignore.name',
	name: 'ignore_' + this.get('value'),
	
	mouseEnter: function() {
		this.set('ignore.highlighted', true);
	},

	mouseLeave: function() {
		this.set('ignore.highlighted', false);
	},

	click: null,
});


ASTool.ElemAttributeView = ASTool.ButtonView.extend({
	value: null,
	attribute: null,
	
	didInsertElement: function() {
		this._super();
		var attribute = this.get('attribute');
		var ui = $(this.get('element'));
		var content = $('<div/>').
			append($('<span/>', { text:attribute.name + ': ', class:'elementAttributeName' })).
			append($('<span/>', { text:trim(attribute.value, 34), class:'elementAttributeValue' }));
		if (this.mapped) {
			content.append($('<div/>').
			append($('<span/>', { text:'mapped to: ', class:'elementAttributeName' })).
			append($('<span/>', { text:attribute.mappedField, class:'elementAttributeValue' })));
		}
		content.css('text-align', 'left').css('margin-left', '5px');
		ui.find('[class=ui-button-text]').html(
			content);
	},
});


ASTool.ItemView = Ember.View.extend({
	templateName: 'item',
	item: null,
	mappingAttribute: null,
});


ASTool.RenameTextField = ASTool.InlineTextField.extend({
	oldValue: null,

	save: function() {
		if (this.get('oldValue') != this.get('value')) {
			this.get('controller').send('rename', this.get('oldValue'), this.get('value'));	
		}
		this.set('oldValue',  this.get('value'));
	},

	focusIn: function() {
		this.set('oldValue', this.get('value'));
	},
});


ASTool.ExtractedItemView = Ember.View.extend({
	templateName: 'extracted-item',
	item: null,

	fields: function() {
		var fields = [];
		var item = this.get('item');
		Object.keys(item).forEach(function(key) {
			fields.pushObject({ name: key, value: item[key] });
		});
		return fields;
	}.property('item'),
});


ASTool.AnnotatedDocumentView = Ember.View.extend({
	templateName: 'annotated-document-view',
	
	didInsertElement: function() {
		this._super();
		this.get('controller').pushRoute('project', 'Project: test');
		this.get('controller.documentView').initCanvas();
		$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
		$('#toolbar').height(window.innerHeight);
	},
});


ASTool.ToolbarViewMixin = Ember.Mixin.create({
	willInsertElement: function() {
		if (this.get('controller.willEnter')) {
			this.controller.willEnter();	
		};
	},

	willDestroyElement: function() {
		if (this.get('controller.willLeave')) {
			this.controller.willLeave();
		};
	},

	didInsertElement: function() {
		$('.accordion').accordion({ heightStyle: "content" });
		this._super();
	},
});


ASTool.AnnotationsView = Ember.View.extend(ASTool.ToolbarViewMixin);
ASTool.AnnotationView = Ember.View.extend(ASTool.ToolbarViewMixin);
ASTool.ItemsView = Ember.View.extend(ASTool.ToolbarViewMixin);
ASTool.SpiderView = Ember.View.extend(ASTool.ToolbarViewMixin);
ASTool.ProjectView = Ember.View.extend(ASTool.ToolbarViewMixin);

ASTool.PageBrowserView = Ember.View.extend({
	tagName: 'div',
	classNames: ['pageBrowser'],
	expanded: false,

	iconName: function() {
		return this.get('expanded') ? 'ui-icon-triangle-1-e' : 'ui-icon-triangle-1-w';
	}.property('expanded'),

	itemsButtonLabel: function() {
		return this.get('controller.showItems') ? "Hide Items " : "Show Items";
	}.property('controller.showItems'),

	click: function(event) {
		if (event.target == this.get('element')) {
			if (this.get('expanded')) {
				this.set('expanded', false);
				$(this.get('element')).animate({ width: 12 }, 200);	
			} else {
				$(this.get('element')).animate(
					{ width: 400 },
	      	 		{ complete: function() {
	        				this.set('expanded', true);
	        			}.bind(this),
	        		}, 200);
			}	
		}
	},
});


/*************************** Helpers ******************************/
function trim(text, maxLength) {
	if (text.length > maxLength) {
		text = text.substring(0, maxLength) + '...';
	}
	return text;
}

Ember.Handlebars.helper('trim', function(text, length) {
	return trim(text, length);
});


/**************************** JQueri UI initialization *************/
$(function() {
    $( document ).tooltip({ track: true });
 });