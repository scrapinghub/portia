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
	attributeBindings: ['name'],
	optionValuePath: 'content.option',
	optionLabelPath: 'content.label',
});


ASTool.ButtonView = Em.View.extend(JQ.Widget, {
	uiType: 'button',
	uiOptions: ['label', 'disabled', 'icons', 'text', 'selected'],
	tagName: 'button',
	minWidth: null,
	maxWidth: null,
	action: null,
	argument: null,
	argument2: null,
	attributeBindings: ['name', 'title'],
	_label: null,
	title: null,
	text: false,

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
			label = trim(label, 38);
			this.set('_label', label);
			this.set('text', true);
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
	attributeBindings: ['placeholder', 'width'],
	classNames: ['textfield'],

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
	name: 'followSelect',
	content: [{ option: 'all', label: 'Follow all in-domain links' },
			  { option: 'none', label: "Don't follow links" },
			  { option: 'patterns', label: 'Configure follow and exclude patterns' }],
});


ASTool.TypeSelect = ASTool.Select.extend({

	content: [{ option: 'text', label: 'text' },
			  { option: 'number', label: 'number' },
			  { option: 'image', label: 'image' },
			  { option: 'price', label: 'price' },
			  { option: 'raw html', label: 'raw html' },
			  { option: 'safe html', label: 'safe html' },
			  { option: 'geopoint', label: 'geopoint' },
			  { option: 'url', label: 'url' }],
});


ASTool.VariantSelect = ASTool.Select.extend({

	annotation: null,

	valueBinding: Em.Binding.oneWay('annotation.variant'),

	classNames: ['variant-select'],

	content: function() {
		var options = [{ option: 0, label: "Base" }];
		var maxVariant = this.get('controller.maxVariant');
		var i;
		for (i = 1; i <= maxVariant; i++) {
			options.pushObject({ option: i, label: '#' + i });
		}
		options.pushObject({ option: i, label: 'Add new variant (' + i + ')' });
		return options;
	}.property('controller.maxVariant'),

	change: function() {
		this.set('annotation.variant', parseInt(this.get('value')))
	},

	fixSelection: function() {
		// When content is repopulated, the Select component loses its selection.
		// This hack resets the selection to its correct value.
		var tempValue = this.get('annotation.variant');
		this.set('value', null);
		Ember.run.scheduleOnce('afterRender', this, function() {		
			this.set('value', tempValue);
		});
	}.observes('controller.maxVariant'),
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


ASTool.AnnotationWidget = Em.View.extend(Ember.TargetActionSupport, {
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
			return this.get('annotation.attributes').findBy(
				'name', this.get('attributeName')).get('value');	
		} else {
			return '< Empty attribute >';
		}
	}.property('attributeName', 'fieldName', 'trimTo'),

	change: function() {	
		if (this.get('fieldName') == 'create_field') {
			this.triggerAction({ action: 'showCreateFieldWidget', target: this });
		} else if (this.get('fieldName') == 'sticky') {
			this.get('controller').send('makeSticky',
							   		this.get('annotation'),
							   		this.get('attributeName'));
		} else if (this.get('fieldName')) {
			this.get('controller').send('mapAttribute',
							   		this.get('annotation'),
							   		this.get('attributeName'),
							   		this.get('fieldName'));	
		}
	},

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
			this.set('trimTo', this.get('trimTo') == 40 ? 500 : 40);
		},

		dismiss: function() {
			this.get('controller').send('hideFloatingAnnotationWidget');
		},
	},

	attributeSelect: ASTool.Select.extend({
		valueBinding: 'parentView.attributeName',
		classNames: 'attribute',
		attributeBindings: ['name'],
		name: 'attributeSelect',

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
		classNames: 'field',
		attributeBindings: ['name'],
		name: 'fieldSelect',
		prompt: '-select field-',

		content: function() {
			var fields = this.get('controller.scrapedItem.fields') || [];
			var options = fields.map(function(field) {
				var name = field.get('name');
				return { option: name, label: name };
			});
			options.pushObject({ option: 'sticky', label: '-just required-' });
			options.pushObject({ option: 'create_field', label: '-create new-' });
			return options;
		}.property('controller.scrapedItem.fields.@each'),

		fixSelection: function() {
			// When content is repopulated, the Select component loses its selection.
			// This hack resets the selection to its correct value.
			var tempFieldName = this.get('parentView.fieldName');
			if (tempFieldName) {
				Ember.run.later(this, function() {
						if (!this.get('isDestroyed')) {
							this.set('value', null);
						}
					}, 500);
				Ember.run.later(this, function() {
						if (!this.get('isDestroyed')) {
							this.set('value', tempFieldName);
						}
					}, 510);
			}
		}.observes('controller.scrapedItem.fields.@each'),
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

	keyDown: function(e) {
    	if (this.get('fieldName') && e.keyCode == 13) {
    		this.triggerAction({ action: 'createField', target: this });
    	}
  	},

	initValues: function() {
		if (!Em.isEmpty(this.get('annotation.mappedAttributes'))) {
			var mapping = this.get('annotation.mappedAttributes.firstObject');
			this.set('attributeName', mapping.get('name'));
			this.set('fieldName', mapping.get('mappedField'));	
		} else if (!Em.isEmpty(this.get('annotation.stickyAttributes'))) {
			var mapping = this.get('annotation.stickyAttributes.firstObject');
			this.set('attributeName', mapping.get('name'));
			this.set('fieldName', 'sticky');
		}
	}.observes('annotation.annotations'),

	didInsertElement: function() {
		if (this.get('inDoc')) {
 			$(this.get('element')).css({ 'top': this.get('pos.y'),
 								 		 'left': this.get('pos.x') - 100});
 			this.get('controller.documentView').setInteractionsBlocked(true);
 		}
		this._super();
		this.initValues();
	},

	willDestroyElement: function() {
		this.get('controller.documentView').setInteractionsBlocked(false);
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
});


ASTool.RenameTextField = ASTool.InlineTextField.extend({
	oldValue: null,
	attributeBindings: ['name'],
  	name: 'rename',
  	action: 'rename',

	save: function() {
		if (this.get('oldValue') != this.get('value')) {
			this.get('controller').send(this.get('action'),
				this.get('oldValue'),
				this.get('value'));	
		}
		this.set('oldValue',  this.get('value'));
	},

	focusIn: function() {
		this.set('oldValue', this.get('value'));
	},
});


ASTool.PatternTextField = ASTool.InlineTextField.extend({
	attributeBindings: ['name'],
  	name: 'pattern',
  	pattern: null,
  	newPattern: null,

  	save: function() {
  		if (!Em.isEmpty(this.get('newPattern')) && this.get('pattern') != this.get('newPattern')) {
  			Ember.run.scheduleOnce('afterRender', this, function() {
				this.get('controller').send(this.get('action'),
					this.get('pattern'),
					this.get('newPattern'));
  			});
		}
  	},

  	value: function(key, val) {
		if (arguments.length > 1) {
			this.set('newPattern', val);
		} 
		return this.get('pattern');
	}.property('pattern'),
});


ASTool.ExtractedItemView = Ember.View.extend({
	extractedItem: null,

	fields: function() {
		return this.get('extractedItem.fields');
	}.property('extractedItem'),

	textFields: function() {
		return this.get('fields').filter(function(field) {
			return field.get('type') != 'image';
		});
	}.property('fields'),

	imageFields: function() {
		return this.get('fields').filter(function(field) {
			return field.get('type') == 'image';
		});
	}.property('fields'),

	variants: function() {
		return this.get('extractedItem.variants');
	}.property('extractedItem'),

	matchedTemplate: function() {
		return this.get('extractedItem.matchedTemplate');
	}.property('extractedItem'),

	url: function() {
		return this.get('extractedItem.url');
	}.property('extractedItem'),
});


ASTool.ExtractorView = Em.View.extend(DragNDrop.Draggable, {
	tagName: 'span',
	extractor: null,
	typeLabels: {
		'regular_expression': '<RegEx>',
		'type_extractor': '<type>',
	},
	classNames: ['extractor-view', 'ui-button', 'light-button'],
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


ASTool.InlineHelp = Em.View.extend({
	tagName: 'img',
	src: 'images/info.png',
	message: null,
	attributeBindings: ['name', 'title', 'src'],
	classNames: ['inline-help'],

	title: function() {
		return ASTool.Messages.get(this.get('message'));
	}.property('message'),
});


ASTool.LabelWithTooltip = Em.View.extend ({
	attributeBindings: ['title'],

	updateTooltip: function() {
		try {
			$(this.get('element')).tooltip('refresh');
		} catch (err) {}
	}.observes('title'),
});

ASTool.ImageView = Em.View.extend({
	tagName: 'img',
	attributeBindings: ['src', 'width'],
});

ASTool.CollapsibleText = Em.View.extend({
	fullText: null,
	tagName: 'span',
	collapsed: true,
	trimTo: 400,
	templateName: 'collapsible-text',

	collapsible: function() {
		return this.get('fullText') && this.get('fullText').length > this.get('trimTo');
	}.property('fullText', 'trimTo'),

	displayedText: function() {
		if (!this.get('collapsed')) {
			return this.get('fullText');
		} else {
			return trim(this.get('fullText').trim(), this.get('trimTo'));
		}
	}.property('collapsed', 'fullText', 'trimTo'),

	click: function() {
		this.set('collapsed', !this.get('collapsed'));
	},
});

ASTool.CopyClipboard = Em.View.extend({
	tagName: 'embed',
	text: '',
	src: 'clippy.swf',
	width:"14", 
	height: "14",
	scale: "noscale",	
	name: "clippy",
	quality: "high",
	allowScriptAccess: "always",
	type: "application/x-shockwave-flash",
	pluginspage: "http://www.macromedia.com/go/getflashplayer",

	flashvars: function() {
		return 'text=' + this.get('text');
	}.property('text'),

	attributeBindings: ['src', 'width', 'height', 'name', 'quality', 'allowScriptAccess',
		'type', 'pluginspage', 'flashvars', 'scale'],
});


var ToolboxViewMixin = ASTool.ToolboxViewMixin;

ASTool.ToolboxProjectsView = Ember.View.extend(ToolboxViewMixin);

ASTool.ToolboxProjectView = Ember.View.extend(ToolboxViewMixin);

ASTool.ToolboxSpiderView = Ember.View.extend(ToolboxViewMixin);

ASTool.ToolboxTemplateView = Ember.View.extend(ToolboxViewMixin);

ASTool.ToolboxItemsView = Ember.View.extend(ToolboxViewMixin, {
	fixedToolbox: true,
});

ASTool.ToolboxAnnotationView = Ember.View.extend(ToolboxViewMixin, {
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

Ember.Handlebars.registerHelper('message', function(messageName) {
	return ASTool.Messages.get('messageName');
});


/**************************** JQueri UI initialization *************/
$(function() {
    $( document ).tooltip({ track: true });
 });

$(function () {
	$(document).tooltip({
    	content: function () {
        	return $(this).prop('title');
      	}
  	});
});
