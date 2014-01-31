/*************************** Drag & drop support ********************/

DragNDrop = Ember.Namespace.create();

DragNDrop.cancel = function(event) {
    event.preventDefault();
};

DragNDrop.Draggable = Ember.Mixin.create({
    attributeBindings: 'draggable',
    draggable: 'true',
});

DragNDrop.Droppable = Ember.Mixin.create({
    dragEnter: DragNDrop.cancel,
    dragOver: DragNDrop.cancel,

    drop: function(event) {
        event.preventDefault();
        return false;
    }
});


/*************************** Base views *****************************/

ASTool.Select = Ember.Select.extend(JQ.Widget, {
	uiType: 'combobox',
	uiOptions: ['label', 'disabled'],
	uiEvents: ['select'],
	optionValuePath: 'content.option',
	optionLabelPath: 'content.label',

	/* Required to update the combobox selection when the model changes, for example
	because of an undo. */
	updateUi: function() {
		if (this.get('ui')) {
			var label = this.content.filterBy('option', this.get('value'))[0].label;
			this.get('ui').input.val(label);	
		}
	}.property('value'),
});


ASTool.ButtonView = Em.View.extend(JQ.Widget, {
	uiType: 'button',
	uiOptions: ['label', 'disabled', 'icons', 'text', 'selected'],
	tagName: 'button',
	classNames: ['button-shadow'],
	minWidth: null,
	maxWidth: null,
	action: null,
	argument: null,
	argument2: null,
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
			this.get('controller').send(this.get('action'),
										this.get('argument'),
										this.get('argument2'));	
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
	classNames: ['textfield', 'ui-corner-all'],

	change: function() {
		if (this.get('action')) {
			this.get('controller').send(this.get('action'),
										this.get('value'));
		}
	},
	
	didInsertElement: function() {
		this._super();
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
  		classNames: ['inline-textfield'],
  		attributeBindings: ['name'],
  		name: 'inline_textfield',

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
			if (parentView.get('isEditing')) {
				parentView.save();	
				parentView.set('isEditing', false);
			}
    	},
  	}),
});

/************************* Application views ****************************/

ASTool.FollowSelect = ASTool.Select.extend({

	content: [{ option: 'all', label: 'Follow all in-domain links' },
			  { option: 'none', label: 'Don not follow links' },
			  { option: 'patterns', label: 'Configure follow and exclude patterns' }],

	select: function(event, data) {
		// FIXME: raise an event instead of directly setting the property.
		this.set('controller.links_to_follow', data.item.value);
	},
});


ASTool.TypeSelect = ASTool.Select.extend({
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


ASTool.ExtractorTypeSelect = ASTool.TypeSelect.extend({
	
	select: function(event, data) {
		// FIXME: raise an event instead of directly setting the property.
		this.set('controller.newTypeExtractor', data.item.value);
	},
});


ASTool.VariantSelect = ASTool.Select.extend({

	content: function() {
		var options = [{ option: 0, label: "Base(0)" }];
		var maxVariant = this.get('controller.controllers.annotations.maxVariant');
		var i;
		for (i = 1; i <= maxVariant; i++) {
			options.pushObject({ option: i, label: 'Variant ' + i });
		}
		options.pushObject({ option: i, label: 'Add new variant (' + i + ')' });
		return options;
	}.property('controller.controllers.annotations.maxVariant'),

	select: function(event, data) {
		// FIXME: raise an event instead of directly setting the property.
		this.set('controller.model.variant', parseInt(data.item.value));
	},
});


ASTool.AnnotationWidget = ASTool.ButtonView.extend({
	titleBinding: 'argument.name',

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
	item: null,
	classNames: ['element-attribute-view'],
	
	didInsertElement: function() {
		this._super();
		var attribute = this.get('attribute');
		var ui = $(this.get('element'));
		var content = $('<div/>').
			append($('<span/>', { text:attribute.name + ': ', class:'name' })).
			append($('<span/>', { text:trim(attribute.value, 30), class:'value' }));
		if (this.mapped) {
			content.append($('<div/>').
			append($('<span/>', { text:'mapped to: ', class:'name' })).
			append($('<span/>', { text:this.get('item') + '.' + attribute.mappedField, class:'item' })));
		}
		content.css('text-align', 'left').
		css('margin-left', '5px').
		css('width: 70%');
		ui.find('[class=ui-button-text]').html(
			content);
	},
});


ASTool.ItemView = Ember.View.extend({
	templateName: 'item',
	item: null,
	mappingAttribute: null,
	classNames: ['ui-corner-all'],
	classNameBindings: ['highlighted:highlighted-item'],

	highlighted: function() {
		if (!this.mappingAttribute) {
			return false;
		} else {
			return this.get('controller.controllers.annotation.scrapes') == this.item.get('name');
		}
	}.property(),
});


ASTool.RenameTextField = ASTool.InlineTextField.extend({
	oldValue: null,
	attributeBindings: ['name'],
  	name: 'rename',

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


ASTool.ExtractorView = Em.View.extend(DragNDrop.Draggable, {
	tagName: 'span',
	extractor: null,
	typeLabels: {
		'regular_expression': '<RegEx>',
		'type_extractor': '<type>',
	},
	classNames: ['extractor-view', 'ui-corner-all', 'ui-button', 'button-shadow'],
	classNameBindings: ['extractorType'],

	dragStart: function(event) {
        this._super(event);
        this.set('extractor.dragging', true);
        var dataTransfer = event.originalEvent.dataTransfer;
        dataTransfer.setDragImage(this.get('element'),
        	$(this.get('element')).width() / 2 , $(this.get('element')).height() + 18);
        dataTransfer.setData('Text', this.get('extractor.name'));
    },

    dragEnd: function(event) {
        this.set('extractor.dragging', false);
    },

    extractorType: function() {
		if (this.get('extractor.regular_expression')) {
			return 'regular_expression';
		} else {
			return 'type_extractor';
		}
	}.property('extractor'),

	extractorTypeLabel: function() {
		return this.typeLabels[this.get('extractorType')];
	}.property('extractor'),

	extractorDefinition: function() {
		return this.get('extractor')[this.get('extractorType')];
	}.property('extractor'),
});


ASTool.ExtractorDropTarget = Ember.View.extend(DragNDrop.Droppable, {
    tagName: 'span',
    classNames: ['drop-target'],
    classNameBindings: ['dragAction'],
    instructions: null,
    fieldName: null,

    dragAction: function() {
        if(this.get('dragging')) {
            return 'drop-target-dragging';
        } else {
        	return null;
        }
    }.property('dragging'),

    drop: function(event) {
    	var extractorId = event.originalEvent.dataTransfer.getData('Text');
		this.get('controller').send('applyExtractor', this.get('fieldName'), extractorId);	
        return this._super(event);
    }
});


ASTool.RequiredFieldCheckbox = ASTool.CheckBox.extend({
	fieldName: null,

	change: function() {
		this.get('controller').send(
			'setRequired', this.get('fieldName'), this.get('checked'));
	},
});


ASTool.PageBrowserView = Ember.View.extend({
	tagName: 'div',
	expanded: false,

	iconName: function() {
		return this.get('expanded') ? 'ui-icon-triangle-1-e' : 'ui-icon-triangle-1-w';
	}.property('expanded'),

	itemsButtonLabel: function() {
		return this.get('controller.showItems') ? "Hide Items " : "Show Items";
	}.property('controller.showItems'),

	click: function(event) {
		if (event.target.id == 'page-browser') {
			if (this.get('expanded')) {
				this.set('expanded', false);
				this.$(event.target).animate({ width: 12 }, 200);	
			} else {
				this.$(event.target).animate(
					{ width: 400 },
	      	 		{ complete: function() {
	      	 				Em.run(this, function() {
	      	 					if (!this.isDestroyed) {
	      	 						// The animation may end after the
	      	 						// object was destroyed.
	      	 						this.set('expanded', true);	
	      	 					}
	      	 				});
	        			}.bind(this),
	        	}, 200);
			}	
		}
	},
});


ASTool.AnnotatedDocumentView = Ember.View.extend({
	templateName: 'annotated-document-view',
	
	didInsertElement: function() {
		this._super();
		this.get('controller').pushRoute('projects', 'Project list');
		this.get('controller.documentView').initCanvas();
		$('#scraped-doc-iframe').height(window.innerHeight);
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
ASTool.ProjectsView = Ember.View.extend(ASTool.ToolbarViewMixin);


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