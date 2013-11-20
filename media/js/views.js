/* JQuery UI integration */

// Put jQuery UI inside its own namespace
JQ = Ember.Namespace.create();

// Create a new mixin for jQuery UI widgets using the Ember
// mixin syntax.
JQ.Widget = Em.Mixin.create({
  // When Ember creates the view's DOM element, it will call this
  // method.
  didInsertElement: function() {
    // Make jQuery UI options available as Ember properties
    var options = this._gatherOptions();

    // Make sure that jQuery UI events trigger methods on this view.
    this._gatherEvents(options);

    // Create a new instance of the jQuery UI widget based on its `uiType`
    // and the current element.
    var ui = jQuery.ui[this.get('uiType')](options, this.get('element'));

    // Save off the instance of the jQuery UI widget as the `ui` property
    // on this Ember view.
    this.set('ui', ui);
  },

  // When Ember tears down the view's DOM element, it will call
  // this method.
  willDestroyElement: function() {
    var ui = this.get('ui');

    if (ui) {
      // Tear down any observers that were created to make jQuery UI
      // options available as Ember properties.
      var observers = this._observers;
      for (var prop in observers) {
        if (observers.hasOwnProperty(prop)) {
          this.removeObserver(prop, observers[prop]);
        }
      }
      ui._destroy();
    }
  },

  // Each jQuery UI widget has a series of options that can be configured.
  // For instance, to disable a button, you call
  // `button.options('disabled', true)` in jQuery UI. To make this compatible
  // with Ember bindings, any time the Ember property for a
  // given jQuery UI option changes, we update the jQuery UI widget.
  _gatherOptions: function() {
    var uiOptions = this.get('uiOptions'), options = {};
    // The view can specify a list of jQuery UI options that should be treated
    // as Ember properties.
    uiOptions.forEach(function(key) {
      options[key] = this.get(key);

      // Set up an observer on the Ember property. When it changes,
      // call jQuery UI's `option` method to reflect the property onto
      // the jQuery UI widget.
      var observer = function() {
        var value = this.get(key);
        this.get('ui').option(key, value);
      };

      this.addObserver(key, observer);

      // Insert the observer in a Hash so we can remove it later.
      this._observers = this._observers || {};
      this._observers[key] = observer;
    }, this);

    return options;
  },

  // Each jQuery UI widget has a number of custom events that they can
  // trigger. For instance, the progressbar widget triggers a `complete`
  // event when the progress bar finishes. Make these events behave like
  // normal Ember events. For instance, a subclass of JQ.ProgressBarView
  // could implement the `complete` method to be notified when the jQuery
  // UI widget triggered the event.
  _gatherEvents: function(options) {
    var uiEvents = this.get('uiEvents') || [], self = this;

    uiEvents.forEach(function(event) {
      var callback = self[event];

      if (callback) {
        // You can register a handler for a jQuery UI event by passing
        // it in along with the creation options. Update the options hash
        // to include any event callbacks.
        options[event] = function(event, ui) { callback.call(self, event, ui); };
      }
    });
  }
});

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
	
	didInsertElement: function() {
		this._super();
		if (!this.get('controller.controllers.page.currentUrl')) {
			$(this.get('element')).find('#annotationsRadio').prop('disabled', true);
		}
	},
	
	pageLoaded: function() {
		$(this.get('element')).find('#annotationsRadio').prop('disabled',
			!this.get('controller.controllers.page.currentUrl'));
		var currentPath = this.get('controller.currentPath');
		$(this.get('element')).find('#' + currentPath + 'Radio').prop('checked', true);
		$(this.get('element')).buttonset('refresh');
	}.observes('controller.controllers.page.currentUrl'),
	
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
	//uiType: 'input',
    //uiOptions: [],
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
