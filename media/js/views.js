// Create a new Ember view for the jQuery UI Button widget
JQ.ButtonView = Em.View.extend(JQ.Widget, {
  uiType: 'button',
  
  uiOptions: ['label', 'disabled', 'icons', 'text'],
  
  tagName: 'button',
  
  icons: function() {
	  return this.get('icon') ? {primary: this.get('icon')} : {};
  }.property('icon'),
  
  click: function() {
  	  this.get('controller').send(this.get('action'), this.get('argument'));
  }
  
});

JQ.ButtonSetView = Em.View.extend(JQ.Widget, {
  uiType: 'buttonset',
  uiOptions: [],
  tagName: 'div',
});

JQ.TabNavigator = JQ.ButtonSetView.extend({
	
	tabChanged: function() {
		var currentPath = this.get('controller.currentPath');
		if (currentPath == 'annotation') {
			currentPath = 'annotations';
		}
		$(this.get('element')).find('#' + currentPath + 'Radio').prop('checked', true);
		$(this.get('element')).buttonset('refresh');
	}.observes('controller.currentPath'),
});

// Create a new Ember view for the jQuery UI Menu widget.
// Because it wraps a collection, we extend from
// Ember's CollectionView rather than a normal view.
//
// This means that you should use `#collection` in your template to
// create this view.
JQ.MenuView = Em.CollectionView.extend(JQ.Widget, {
  uiType: 'menu',
  uiOptions: ['disabled'],
  uiEvents: ['select'],

  tagName: 'ul',

  // Whenever the underlying Array for this `CollectionView` changes,
  // refresh the jQuery UI widget.
  arrayDidChange: function(content, start, removed, added) {
    this._super(content, start, removed, added);

    var ui = this.get('ui');
    if (ui) {
      // Schedule the refresh for after Ember has completed it's
      // render cycle
      Em.run.scheduleOnce('afterRender', ui, ui.refresh);
    }
  },
  itemViewClass: Em.View.extend({
    // Make it so that the default context for evaluating handlebars
    // bindings is the content of this child view.
    context: function(){
      return this.get('content');
    }.property('content')
  })
});

// Create a new Ember view for the jQuery UI Progress Bar widget
JQ.ProgressBarView = Em.View.extend(JQ.Widget, {
  uiType: 'progressbar',
  uiOptions: ['value', 'max'],
  uiEvents: ['change', 'complete']
});

JQ.TextField = Em.TextField.extend({
	uiOptions: [],
	
	uiType: null,
	
	didInsertElement: function() {
		this._super();
		var ui = $(this.get('element'));
		ui.addClass('ui-corner-all');
	},
});


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

JQ.EditField = JQ.TextField.extend({
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
		this.get('controller').pushRoute('project', 'Project');
		$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
		$('#toolbar').height(window.innerHeight);
	},
});

ASTool.ViewNotifyingMixin = Ember.Mixin.create({
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
});


ASTool.AnnotationsView = Ember.View.extend(ASTool.ViewNotifyingMixin);
ASTool.AnnotationView = Ember.View.extend(ASTool.ViewNotifyingMixin);
ASTool.ItemsView = Ember.View.extend(ASTool.ViewNotifyingMixin);
ASTool.SpiderView = Ember.View.extend(ASTool.ViewNotifyingMixin);
ASTool.ProjectView = Ember.View.extend(ASTool.ViewNotifyingMixin);


/*************************** Helpers ******************************/
Ember.Handlebars.helper('trim', function(text) {
	var maxLength = 400;
	if (text.length > 400) {
		return text.substring(0, 400) + "...";
	} else {
		return text;
	}
});
