/*
Modal component.
*/


(function() {
  Bootstrap.BsModalComponent = Ember.Component.extend(Ember.Evented, {
    layoutName: 'components/bs-modal',
    classNames: ['modal'],
    classNameBindings: ['fade', 'isVis:in'],
    attributeBindings: ['role', 'aria-labelledby', 'isAriaHidden:aria-hidden', "ariaLabelledBy:aria-labelledby"],
    isAriaHidden: (function() {
      return "" + (this.get('isVisible'));
    }).property('isVisible'),
    modalBackdrop: '<div class="modal-backdrop fade in"></div>',
    role: 'dialog',
    footerViews: [],
    backdrop: true,
    title: null,
    isVisible: false,
    manual: false,
    isVis: false,
    fullSizeButtons: false,
    fade: true,
    didInsertElement: function() {
      var name;
      this._super();
      this.setupBinders();
      name = this.get('name');
      Ember.assert("Modal name is required for modal view " + (this.get('elementId')), this.get('name'));
      if (name == null) {
        name = this.get('elementId');
      }
      Bootstrap.ModalManager.add(name, this);
      if (this.manual) {
        return this.show();
      }
    },
    becameVisible: function() {
      Em.$('body').addClass('modal-open');
      if (this.get("backdrop")) {
        return this.appendBackdrop();
      }
    },
    becameHidden: function() {
      Em.$('body').removeClass('modal-open');
      if (this._backdrop) {
        return this._backdrop.remove();
      }
    },
    appendBackdrop: function() {
      var parentElement;
      parentElement = this.$().parent();
      return this._backdrop = Em.$(this.modalBackdrop).appendTo(parentElement);
    },
    show: function() {
      var current;
      this.set('isVisible', true);
      current = this;
      setTimeout((function() {
        current.set('isVis', true);
      }), 15);
    },
    hide: function() {
      var current;
      this.set('isVis', false);
      current = this;
      this.$().one('webkitTransitionEnd', function(e) {
        current.set('isVisible', false);
      });
      return false;
    },
    toggle: function() {
      return this.toggleProperty('isVisible');
    },
    click: function(event) {
      var target, targetDismiss;
      target = event.target;
      targetDismiss = target.getAttribute("data-dismiss");
      if (targetDismiss === 'modal') {
        return this.close();
      }
    },
    keyPressed: function(event) {
      if (event.keyCode === 27) {
        return this.close(event);
      }
    },
    close: function(event) {
      var current;
      this.set('isVis', false);
      current = this;
      this.$().one('webkitTransitionEnd', function(e) {
        if (current.get('manual')) {
          current.destroy();
        } else {
          current.hide();
        }
      });
      return this.trigger('closed');
    },
    willDestroyElement: function() {
      var name;
      Em.$('body').removeClass('modal-open');
      this.removeHandlers();
      name = this.get('name');
      if (name == null) {
        name = this.get('elementId');
      }
      Bootstrap.ModalManager.remove(name, this);
      if (this._backdrop) {
        return this._backdrop.remove();
      }
    },
    removeHandlers: function() {
      return jQuery(window.document).unbind("keyup", this._keyUpHandler);
    },
    setupBinders: function() {
      var handler,
        _this = this;
      handler = function(event) {
        return _this.keyPressed(event);
      };
      jQuery(window.document).bind("keyup", handler);
      return this._keyUpHandler = handler;
    }
  });

  /*
  Bootstrap.BsModalComponent = Bootstrap.BsModalComponent.reopenClass(
      build: (options) ->
          options = {}  unless options
          options.manual = true
          modalPane = @create(options)
          modalPane.append()
  )
  */


  Bootstrap.ModalManager = Ember.Object.create({
    add: function(name, modalInstance) {
      return this.set(name, modalInstance);
    },
    register: function(name, modalInstance) {
      this.add(name, modalInstance);
      return modalInstance.appendTo(modalInstance.get('targetObject').namespace.rootElement);
    },
    remove: function(name) {
      return this.set(name, null);
    },
    close: function(name) {
      return this.get(name).close();
    },
    hide: function(name) {
      return this.get(name).hide();
    },
    show: function(name) {
      return this.get(name).show();
    },
    toggle: function(name) {
      return this.get(name).toggle();
    },
    confirm: function(controller, title, message, confirmButtonTitle, confirmButtonEvent, confirmButtonType, cancelButtonTitle, cancelButtonEvent, cancelButtonType, targetObj, fade, fullSizeButtons) {
      var body, buttons;
      if (confirmButtonTitle == null) {
        confirmButtonTitle = "Confirm";
      }
      if (confirmButtonEvent == null) {
        confirmButtonEvent = "modalConfirmed";
      }
      if (confirmButtonType == null) {
        confirmButtonType = null;
      }
      if (cancelButtonTitle == null) {
        cancelButtonTitle = "Cancel";
      }
      if (cancelButtonEvent == null) {
        cancelButtonEvent = "modalCanceled";
      }
      if (cancelButtonType == null) {
        cancelButtonType = null;
      }
      if (targetObj == null) {
        targetObj = controller;
      }
      if (fade == null) {
        fade = true;
      }
      if (fullSizeButtons == null) {
        fullSizeButtons = false;
      }
      body = Ember.View.extend({
        template: Ember.Handlebars.compile(message || "Are you sure you would like to perform this action?")
      });
      buttons = [
        Ember.Object.create({
          title: confirmButtonTitle,
          clicked: confirmButtonEvent,
          type: confirmButtonType,
          dismiss: 'modal'
        }), Ember.Object.create({
          title: cancelButtonTitle,
          clicked: cancelButtonEvent,
          type: cancelButtonType,
          dismiss: 'modal'
        })
      ];
      return this.open('confirm-modal', title || 'Confirmation required!', body, buttons, controller, fade, fullSizeButtons, targetObj);
    }
  }, {
    okModal: function(controller, title, message, okButtonTitle, okButtonEvent, okButtonType, targetObj, fade, fullSizeButtons) {
      var body, buttons;
      if (okButtonTitle == null) {
        okButtonTitle = "OK";
      }
      if (okButtonEvent == null) {
        okButtonEvent = "okModal";
      }
      if (okButtonType == null) {
        okButtonType = null;
      }
      if (targetObj == null) {
        targetObj = controller;
      }
      if (fade == null) {
        fade = true;
      }
      if (fullSizeButtons == null) {
        fullSizeButtons = false;
      }
      body = Ember.View.extend({
        template: Ember.Handlebars.compile(message || "Are you sure you would like to perform this action?")
      });
      buttons = [
        Ember.Object.create({
          title: okButtonTitle,
          clicked: okButtonEvent,
          type: okButtonType,
          dismiss: 'modal'
        })
      ];
      return this.open('ok-modal', title || 'Confirmation required!', body, buttons, controller, fade, fullSizeButtons, targetObj);
    },
    openModal: function(modalView, options) {
      var instance, rootElement;
      if (options == null) {
        options = {};
      }
      rootElement = options.rootElement || '.ember-application';
      instance = modalView.create(options);
      return instance.appendTo(rootElement);
    },
    open: function(name, title, view, footerButtons, controller, fade, fullSizeButtons, targetObj) {
      var cl, modalComponent, template;
      if (fullSizeButtons == null) {
        fullSizeButtons = false;
      }
      if (targetObj == null) {
        targetObj = controller;
      }
      cl = controller.container.lookup('component-lookup:main');
      modalComponent = cl.lookupFactory('bs-modal', controller.get('container')).create();
      modalComponent.setProperties({
        name: name,
        title: title,
        manual: true,
        footerButtons: footerButtons,
        targetObject: targetObj,
        fade: fade,
        fullSizeButtons: fullSizeButtons
      });
      if (Ember.typeOf(view) === 'string') {
        template = controller.container.lookup("template:" + view);
        Ember.assert("Template " + view + " was specified for Modal but template could not be found.", template);
        if (template) {
          modalComponent.setProperties({
            body: Ember.View.extend({
              template: template,
              controller: controller
            })
          });
        }
      } else if (Ember.typeOf(view) === 'class') {
        modalComponent.setProperties({
          body: view,
          controller: controller
        });
      }
      return modalComponent.appendTo(controller.namespace.rootElement);
    }
  });

  Ember.Application.initializer({
    name: 'bs-modal',
    initialize: function(container, application) {
      return container.register('component:bs-modal', Bootstrap.BsModalComponent);
    }
  });

}).call(this);

Ember.TEMPLATES["components/bs-modal"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("                    <i ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'class': ("titleIconClasses")
  },"hashTypes":{'class': "STRING"},"hashContexts":{'class': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push("></i>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("                ");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.body", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n");
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("                ");
  stack1 = helpers._triageMustache.call(depth0, "yield", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("                ");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'targetObjectBinding': ("view.targetObject"),
    'content': ("btn")
  },"hashTypes":{'targetObjectBinding': "STRING",'content': "ID"},"hashContexts":{'targetObjectBinding': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n");
  return buffer;
},"9":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("                ");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "btn", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <div class=\"modal-header\">\n            <button type=\"button\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'class': (":close allowClose::hide")
  },"hashTypes":{'class': "STRING"},"hashContexts":{'class': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n            <h4 class=\"modal-title\">\n");
  stack1 = helpers['if'].call(depth0, "titleIconClasses", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("                ");
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "title", {"name":"_triageMustache","hash":{
    'unescaped': ("true")
  },"hashTypes":{'unescaped': "STRING"},"hashContexts":{'unescaped': depth0},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n            </h4>\n        </div>\n        <div class=\"modal-body\">\n");
  stack1 = helpers['if'].call(depth0, "body", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(5, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("        </div>\n        <div ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'class': (":modal-footer fullSizeButtons:modal-footer-full")
  },"hashTypes":{'class': "STRING"},"hashContexts":{'class': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "btn", "in", "footerButtons", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(7, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = helpers.each.call(depth0, "btn", "in", "footerViews", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(9, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("        </div>\n    </div>\n</div>");
  return buffer;
},"useData":true});