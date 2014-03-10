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

ASTool.Select = Ember.Select.extend({
	optionValuePath: 'content.option',
	optionLabelPath: 'content.label',
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
	tagName: 'span',
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
		var maxVariant = this.get('controller.controllers.template_index.maxVariant');
		var i;
		for (i = 1; i <= maxVariant; i++) {
			options.pushObject({ option: i, label: 'Variant ' + i });
		}
		options.pushObject({ option: i, label: 'Add new variant (' + i + ')' });
		return options;
	}.property('controller.controllers.template_index.maxVariant'),

	select: function(event, data) {
		// FIXME: raise an event instead of directly setting the property.
		this.set('controller.model.variant', parseInt(data.item.value));
	},
});


ASTool.ItemSelect = ASTool.Select.extend({

	content: function() {
		var options = this.get('controller.items').map(function(item) {
			var name = item.get('name');
			return { option: name, label: name };
		});
		return options;
	}.property('controller.items'),
});


ASTool.AnnotationWidget = Em.View.extend({
	tagName: 'div',
	classNames: 'annotation-widget',
	classNameBindings: 'inDoc: in-doc',
	annotation: null,
	attributeName: null,
	fieldName: null,
	fieldType: null,
	creatingField: false,
	inDoc: false,
	pos: null,

	createFieldDisabled: function() {
		return Em.isEmpty(this.get('fieldName'));
	}.property('fieldName'),

	attributeValue: function() {
		if (this.get('attributeName') && !Em.isEmpty(this.get('annotation.attributes'))) {
			return trim(this.get('annotation.attributes').findBy('name', this.get('attributeName')).get('value'), 200);	
		} else {
			return '< Empty attribute >';
		}
	}.property('attributeName', 'fieldName'),

	change: function() {
		if (this.get('fieldName') == 'create_field') {
			this.set('creatingField', true);
			this.set('fieldName', '');
		} else if (this.get('fieldName') == 'sticky') {
			this.get('controller').send('makeSticky',
							   		this.get('annotation'),
							   		this.get('attributeName'));
		} else {
			this.get('controller').send('mapAttribute',
							   		this.get('annotation'),
							   		this.get('attributeName'),
							   		this.get('fieldName'));	
		}
	},

	actions: {
		createField: function() {
			this.set('creatingField', false);
			this.get('controller').send('createField',
								   		this.get('fieldName'),
								   		this.get('fieldType'));
			this.get('controller').send('mapAttribute',
								   		this.get('annotation'),
								   		this.get('attributeName'),
								   		this.get('fieldName'));	
		},
	},

	attributeSelect: ASTool.Select.extend({
		valueBinding: 'parentView.attributeName',
		classNames: 'attribute-select',

		content: function() {
			var options = this.get('parentView.annotation.attributes').map(function(attribute) {
				var name = attribute.get('name');
				return { option: name, label: name };
			});
			return options;
		}.property('annotation'),
	}),

	fieldSelect: ASTool.Select.extend({
		valueBinding: 'parentView.fieldName',
		classNames: 'field-select',
		prompt: '-select field-',

		content: function() {
			var options = this.get('controller.scrapedItem.fields').map(function(field) {
				var name = field.get('name');
				return { option: name, label: name };
			});
			options.pushObject({ option: 'sticky', label: '-make sticky-' });
			options.pushObject({ option: 'create_field', label: '-create new-' });
			return options;
		}.property('controller.scrapedItem.fields.@each'),
	}),

	typeSelect: ASTool.TypeSelect.extend({
		valueBinding: 'parentView.fieldType',
	}),

	fieldTextField: ASTool.TextField.extend({
		valueBinding: 'parentView.fieldName',
		placeholder: 'enter name',
	}),

	mappings: function() {
		return this.get('annotation.mappedAttributes');
	}.property('annotation.mappedAttributes'),

	hasMultipleMappings: function() {
		return this.get('annotation.mappedAttributes').length > 1;
	}.property('annotation.mappedAttributes'),

	mouseEnter: function(event) {
		if (!this.get('inDoc')) {
			this.set('annotation.highlighted', true);
			this.get('controller').send('annotationHighlighted', this.get('annotation'));
		}
		event.stopPropagation();
	},

	mouseLeave: function(event) {
		if (!this.get('inDoc')) {
			this.set('annotation.highlighted', false);
		}
		event.stopPropagation();
	},

	updateValue: function() {
		this.set('attributeName', null);
		this.set('fieldName', null);
		Em.run.later(this, function() {
			if (!Em.isEmpty(this.get('annotation.mappedAttributes'))) {
				var mapping = this.get('annotation.mappedAttributes.firstObject');
				this.set('attributeName', mapping.get('name'));
				this.set('fieldName', mapping.get('mappedField'));	
			} else if (!Em.isEmpty(this.get('annotation.stickyAttributes'))) {
				var mapping = this.get('annotation.stickyAttributes.firstObject');
				this.set('attributeName', mapping.get('name'));
				this.set('fieldName', 'sticky');
			}
		}, 0.5);
	}.observes('controller.scrapedItem.fields', 'annotation.annotations'),

	didInsertElement: function() {
		if (this.get('inDoc')) {
 			$(this.get('element')).css({ 'top': this.get('pos.y'),
 								 		 'left': this.get('pos.x') - 100});
 		}
		this._super();
		this.updateValue();
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


ASTool.IgnoreWidget = Em.View.extend({
	ignore: null,
	
	mouseEnter: function() {
		this.set('ignore.highlighted', true);
	},

	mouseLeave: function() {
		this.set('ignore.highlighted', false);
	},

	click: null,
});


ASTool.ElemAttributeView = Em.View.extend({
	attribute: null,

	name: function() {
		return this.get('attribute.name');
	}.property('attribute'),

	value: function() {
		return trim(this.get('attribute.value'), 80);
	}.property('attribute'),

	field: function() {
		return this.get('attribute.mappedField');
	}.property('attribute'),
});


ASTool.EditItemView = Ember.View.extend({
	templateName: 'edit-item',
	item: null,
	mappingAttribute: null,
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
	classNames: ['extractor-view', 'ui-button', 'clear-button'],
	classNameBindings: ['extractorType'],

	dragStart: function(event) {
        this._super(event);
        this.set('extractor.dragging', true);
        var dataTransfer = event.originalEvent.dataTransfer;
        dataTransfer.setDragImage(this.get('element'),
        	$(this.get('element')).width() / 2 , $(this.get('element')).height());
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

	click: function() {
		this.get('controller').send('removeAppliedExtractor', this.get('extractor'));
	}
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


ASTool.AnnotatedDocumentView = Ember.View.extend({
	templateName: 'annotated-document-view',
	
	didInsertElement: function() {
		this._super();
		this.get('controller.documentView').initCanvas();
	},
});


ASTool.NavigationView = Ember.View.extend({
	templateName: 'navigation',

	didInsertElement: function() {
		this._super();
		$("#breadcrumb").jBreadCrumb();
	},
});


ASTool.ToolboxViewMixin = Ember.Mixin.create({
	layoutName: 'toolbox',
	fixedToolbox: false,

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

	showToolbox: function() {
		if (this.get('timeoutHandle')) {
			clearTimeout(this.get('timeoutHandle'));
			this.set('timeoutHandle', null);
		}
		var timeoutHandle = setTimeout(function() {
			$('#toolbox').animate({ 'margin-right': 0 }, 300);	
			$('#scraped-doc').animate({ 'margin-right': 400 }, 300);		
		}, 300);
		this.set('timeoutHandle', timeoutHandle);
	},

	hideToolbox: function() {
		if (this.get('timeoutHandle')) {
			clearTimeout(this.get('timeoutHandle'));
			this.set('timeoutHandle', null);
		}
		var timeoutHandle = setTimeout(function() {
			$('#toolbox').animate({ 'margin-right': -365 }, 300);	
			$('#scraped-doc').animate({ 'margin-right': 35 }, 300);		
		}, 800);
		this.set('timeoutHandle', timeoutHandle);
	},

	mouseEnter: function() {
		this.showToolbox();
	},

	mouseLeave: function(e) {
		if (!this.get('fixedToolbox') &&
			!ASTool.ToolboxViewMixin.pinned) {
			if (e.target.tagName.toLowerCase() != 'select') {
				this.hideToolbox();	
			}
		}
	},

	didInsertElement: function() {
		if (ASTool.ToolboxViewMixin.expandToolbox ||
			ASTool.ToolboxViewMixin.pinned ||
			this.get('fixedToolbox')) {
			this.showToolbox();
			ASTool.ToolboxViewMixin.expandToolbox = false;
		}
		$('.accordion').accordion({ heightStyle: "content" });
		this._super();
	},
});


ASTool.PinToolBoxButton = ASTool.ButtonView.extend({
	icon: function() {
		return ASTool.ToolboxViewMixin.pinned ? 'ui-icon-pin-s' : 'ui-icon-pin-w';
	}.property('pinned'),

	disabled: function() {
		return this.get('parentView.fixedToolbox');
	}.property('parentView.fixedToolbox'),

	click: function() {
		ASTool.ToolboxViewMixin.pinned = !ASTool.ToolboxViewMixin.pinned;
		this.notifyPropertyChange('pinned');
	},
});


var ToolboxViewMixin = ASTool.ToolboxViewMixin;

ASTool.ProjectsIndexView = Ember.View.extend(ToolboxViewMixin);

ASTool.ProjectIndexView = Ember.View.extend(ToolboxViewMixin);

ASTool.SpiderIndexView = Ember.View.extend(ToolboxViewMixin);

ASTool.TemplateIndexView = Ember.View.extend(ToolboxViewMixin);

ASTool.ItemsView = Ember.View.extend(ToolboxViewMixin, {
	fixedToolbox: true,
});

ASTool.AnnotationView = Ember.View.extend(ToolboxViewMixin, {
	fixedToolbox: true,
});


/*************************** Helpers ******************************/
function trim(text, maxLength) {
	if (text && text.length > maxLength) {
		text = text.substring(0, maxLength) + '...';
	}
	return text;
}

Ember.Handlebars.helper('trim', function(text, length) {
	return trim(text, length);
});

Ember.Handlebars.helper('isEmpty', function(text) {
	return Em.isEmpty(text);
});


/**************************** JQueri UI initialization *************/
$(function() {
    $( document ).tooltip({ track: true });
 });