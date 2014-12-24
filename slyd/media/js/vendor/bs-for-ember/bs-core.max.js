/* ========================================================================
 * Bootstrap: transition.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#transitions
 * ========================================================================
 * Copyright 2013 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */


+function ($) { "use strict";

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd'
    , 'MozTransition'    : 'transitionend'
    , 'OTransition'      : 'oTransitionEnd otransitionend'
    , 'transition'       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false, $el = this
    $(this).one($.support.transition.end, function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()
  })

}(window.jQuery);

(function() {
  var Bootstrap;

  Bootstrap = window.Bootstrap = Ember.Namespace.create();

}).call(this);

(function() {
  var Bootstrap, get;

  Bootstrap = window.Bootstrap;

  get = Ember.get;

  Bootstrap.WithRouter = Ember.Mixin.create({
    router: Ember.computed(function() {
      return get(this, "controller").container.lookup("router:main");
    })
  });

}).call(this);

(function() {
  var Bootstrap, get, set;

  Bootstrap = window.Bootstrap;

  get = Ember.get;

  set = Ember.set;

  Bootstrap.TypeSupport = Ember.Mixin.create({
    classTypePrefix: Ember.required(String),
    classNameBindings: ['typeClass'],
    type: 'default',
    typeClass: (function() {
      var pref, type;
      type = this.get('type');
      if (type == null) {
        type = 'default';
      }
      pref = this.get('classTypePrefix');
      return "" + pref + "-" + type;
    }).property('type').cacheable()
  });

}).call(this);

(function() {
  var Bootstrap, get, set;

  Bootstrap = window.Bootstrap;

  get = Ember.get;

  set = Ember.set;

  Bootstrap.SizeSupport = Ember.Mixin.create({
    classTypePrefix: Ember.required(String),
    classNameBindings: ['sizeClass', 'largeSizeClass', 'smallSizeClass', 'extraSmallSizeClass'],
    size: null,
    xs: null,
    small: null,
    large: null,
    extraSmallSizeClass: (function() {
      var pref;
      pref = this.get('classTypePrefix');
      if (this.xs) {
        return "" + pref + "-xs";
      } else {
        return null;
      }
    }).property('xs').cacheable(),
    smallSizeClass: (function() {
      var pref;
      pref = this.get('classTypePrefix');
      if (this.small) {
        return "" + pref + "-sm";
      } else {
        return null;
      }
    }).property('small').cacheable(),
    largeSizeClass: (function() {
      var pref;
      pref = this.get('classTypePrefix');
      if (this.large) {
        return "" + pref + "-lg";
      } else {
        return null;
      }
    }).property('large').cacheable(),
    sizeClass: (function() {
      var pref, size;
      size = this.get('size');
      pref = this.get('classTypePrefix');
      if (size) {
        return "" + pref + "-" + size;
      } else {
        return null;
      }
    }).property('size').cacheable()
  });

}).call(this);

/*
A mixin for Items that have a value property
*/


(function() {
  Bootstrap.ItemValue = Ember.Mixin.create({
    /*
    The value of the item, currently Items content supports only an array of strings, so value is the actual 'content' property
    of the item.
    */

    value: (function() {
      var itemsView, value;
      itemsView = this.get('parentView');
      if (itemsView == null) {
        return;
      }
      value = this.get('content');
      return value;
    }).property('content').cacheable()
  });

}).call(this);

/*
A Mixin to enhance items enhanced with the 'IsItem' Mixin with selection capability.

When a click event is received the current item will be stored in the parent view 'selected' property,
An extra 'active' css class will be assigned to the Item (this) if this is a selected item.
*/


(function() {
  Bootstrap.ItemSelection = Ember.Mixin.create(Bootstrap.ItemValue, Bootstrap.WithRouter, {
    classNameBindings: ["isActive:active"],
    init: function() {
      this._super();
      return this.didRouteChange();
    },
    didRouteChange: (function() {
      var itemsView, linkTo, _ref;
      linkTo = this.get('content.linkTo');
      if (linkTo == null) {
        return;
      }
      itemsView = this.get('parentView');
      if (itemsView == null) {
        return;
      }
      if ((_ref = this.get('router')) != null ? _ref.isActive(linkTo) : void 0) {
        return itemsView.set('selected', this.get('value'));
      }
    }).observes('router.url'),
    /*
    Determine whether the current item is selected,
    if true the 'active' css class will be associated with the this DOM's element.
    
    This is a calculated property and will be retriggered if the 'value' property of the item has changed or the 'selected' property
    in the parent ItemsView.
    */

    isActive: (function() {
      var itemsView, selected, value;
      itemsView = this.get('parentView');
      if (itemsView == null) {
        return false;
      }
      selected = itemsView.get('selected');
      value = this.get('value');
      if (value == null) {
        return false;
      }
      return selected === value;
    }).property('value', 'parentView.selected', 'content.linkTo').cacheable(),
    /*
    Handle selection by click event.
    
    The identifier of the selection is based on the 'content' property of this item.
    */

    click: function(event) {
      var content, itemsView;
      event.preventDefault();
      itemsView = this.get('parentView');
      if (itemsView == null) {
        return;
      }
      content = this.get('content');
      if (typeof content === 'object') {
        if (content.get('disabled')) {
          return;
        }
      }
      if (this.get('content.linkTo') != null) {
        return;
      }
      return itemsView.set('selected', this.get('value'));
    }
  });

}).call(this);

/*
A Mixin to enhance views that extends from 'ItemsView' with selection capability.
*/


(function() {
  Bootstrap.ItemsSelection = Ember.Mixin.create({
    /*
    If true, multiple selection is supported
    */

    multiSelection: false,
    /*
    An array of selected item(s), can be also bound to a controller property via 'selectedBinding'
    */

    selected: []
  });

}).call(this);

/*
A Mixin that provides the basic configuration for rendering a Bootstrap navigation such as tabs and pills
*/


(function() {
  Bootstrap.Nav = Ember.Mixin.create({
    classNames: ['nav'],
    classNameBindings: ['navTypeClass'],
    tagName: 'ul',
    navType: null,
    navTypeClass: (function() {
      if (this.navType != null) {
        return "nav-" + this.navType;
      } else {
        return null;
      }
    }).property('navType').cacheable()
  });

}).call(this);

/*
A Mixin that provides the basic configuration for rendering and interacting with Bootstrap navigation item such a pill or a tab.
*/


(function() {
  Bootstrap.NavItem = Ember.Mixin.create(Bootstrap.SelectableView);

}).call(this);

(function() {
  var getParentView, getProperty;

  getParentView = function(view) {
    var ok, parentView;
    if (!(view && (parentView = view.get('parentView')))) {
      return;
    }
    ok = parentView instanceof Bootstrap.ItemsView;
    Ember.assert("The parent view must be an instance of Bootstrap.ItemsView or any inherited class", ok);
    if (ok) {
      return parentView;
    } else {
      return void 0;
    }
  };

  getProperty = function(obj, prop, noGetReturns) {
    if (!(Ember.typeOf(obj) === 'instance' || Ember.canInvoke(obj, 'get'))) {
      return noGetReturns;
    }
    return obj.get(prop);
  };

  /*
  Views that are rendered as an Item of the ItemsView should extends from this view.
  
  When a click event is received the current item will be stored in the parent view 'selected' property,
  An extra 'active' css class will be assigned to the Item (this) if this is a selected item.
  
  Views that extends this view can be enhanced with:
  ItemSelection: Makes the item selectable.
  */


  Bootstrap.ItemView = Ember.View.extend({
    isItem: true,
    classNameBindings: ['disabled'],
    /*
    A calculated property that defines the title of the item.
    */

    title: (function() {
      var content, itemTitleKey, itemsView;
      if (!(itemsView = getParentView(this))) {
        return;
      }
      itemTitleKey = itemsView.get('itemTitleKey') || 'title';
      content = this.get('content');
      return getProperty(content, itemTitleKey, content);
    }).property('content').cacheable(),
    /*
    Determine whether the item is disabled or not
    */

    disabled: (function() {
      var content, disabled, itemsView;
      if (!(itemsView = getParentView(this))) {
        return;
      }
      content = this.get('content');
      disabled = !!getProperty(content, 'disabled', false);
      if (disabled && this.get('isActive')) {
        itemsView.set('selected', null);
      }
      return disabled;
    }).property('content', 'content.disabled').cacheable()
  });

}).call(this);

/*
A parent view of views that supports multiple items rendering such as Navigations (Tabs, Pills)

Views that inherits from this view can be enhanced with:
- ItemsSelection: Enhances with selection capability.
*/


(function() {
  Bootstrap.ItemsView = Ember.CollectionView.extend({
    didInsertElement: function() {
      var defaultTab, view, _i, _len, _ref, _ref1;
      if (this.get('default')) {
        defaultTab = this.get('default');
        _ref = this._childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (((_ref1 = view.get('content')) != null ? _ref1.get('title') : void 0) === defaultTab) {
            this.set('selected', view.get('content'));
          }
        }
        return Ember.assert("Could not activate default tab " + defaultTab + " as it doesnt exist", defaultTab);
      }
    }
  });

}).call(this);

(function() {
  Bootstrap.ItemPaneView = Ember.View.extend({
    template: Ember.Handlebars.compile(['{{#if view.content.template}}', '{{bsItemPanePartial view.content.template}}', '{{/if}}'].join("\n")),
    corrItem: (function() {
      var view, _i, _len, _ref;
      if (this.get('parentView').get('corrItemsView') != null) {
        _ref = this.get('parentView').get('corrItemsView')._childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.content === this.get('content')) {
            return view;
          }
        }
      }
    }).property('parentView.corrItemsView'),
    isVisible: (function() {
      var _ref;
      return (_ref = this.get('corrItem')) != null ? _ref.get('isActive') : void 0;
    }).property('corrItem.isActive'),
    controller: (function() {
      var controller, itemController;
      controller = this.get('parentView.controller');
      if (this.get('content.controller')) {
        itemController = this.get('container').lookup("controller:" + (this.get('content.controller')));
        if (itemController) {
          controller = itemController;
        }
      }
      return controller;
    }).property('content')
  });

  Ember.Handlebars.helper("bsItemPanePartial", function(templateName, options) {
    var template, view;
    view = options.data.view;
    template = view.templateForName(templateName);
    Ember.assert("Unable to find template with name '" + templateName + "'", template);
    return template(this, {
      data: options.data
    });
  });

}).call(this);

(function() {
  Bootstrap.ItemsPanesView = Ember.CollectionView.extend({
    viewsInserted: false,
    corrItemsView: (function() {
      var itemsView;
      itemsView = Ember.View.views[this.get('items-id')];
      return itemsView;
    }).property('viewsInserted'),
    didInsertElement: function() {
      this._super();
      return this.set('viewsInserted', true);
    }
  });

}).call(this);
