/*
Modal component.
*/


(function() {
  Bootstrap.BsModalComponent = Ember.Component.extend(Ember.Evented, {
    layoutName: 'components/bs-modal',
    classNames: ['modal'],
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
      if (this.get("backdrop")) {
        return this.appendBackdrop();
      }
    },
    becameHidden: function() {
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
      return this.set('isVisible', true);
    },
    hide: function() {
      return this.set('isVisible', false);
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
      if (this.get('manual')) {
        this.destroy();
      } else {
        this.hide();
      }
      return this.trigger('closed');
    },
    willDestroyElement: function() {
      var name;
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
    confirm: function(controller, title, message, confirmButtonTitle, cancelButtonTitle) {
      var body, buttons;
      if (confirmButtonTitle == null) {
        confirmButtonTitle = "Confirm";
      }
      if (cancelButtonTitle == null) {
        cancelButtonTitle = "Cancel";
      }
      body = Ember.View.extend({
        template: Ember.Handlebars.compile(message || "Are you sure you would like to perform this action?")
      });
      buttons = [
        Ember.Object.create({
          title: confirmButtonTitle,
          clicked: "modalConfirmed",
          dismiss: 'modal'
        }), Ember.Object.create({
          title: cancelButtonTitle,
          clicked: "modalCanceled",
          dismiss: 'modal'
        })
      ];
      return this.open('confirm-modal', title || 'Confirmation required!', body, buttons, controller);
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
    open: function(name, title, view, footerButtons, controller) {
      var cl, modalComponent, template;
      cl = controller.container.lookup('component-lookup:main');
      modalComponent = cl.lookupFactory('bs-modal', controller.get('container')).create();
      modalComponent.setProperties({
        name: name,
        title: title,
        manual: true,
        footerButtons: footerButtons,
        targetObject: controller
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

this["Ember"] = this["Ember"] || {};
this["Ember"]["TEMPLATES"] = this["Ember"]["TEMPLATES"] || {};

this["Ember"]["TEMPLATES"]["components/bs-modal"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, hashTypes, hashContexts, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = '', stack1, hashContexts, hashTypes, options;
  data.buffer.push("\n                    <i ");
  hashContexts = {'class': depth0};
  hashTypes = {'class': "STRING"};
  options = {hash:{
    'class': ("titleIconClasses")
  },contexts:[],types:[],hashContexts:hashContexts,hashTypes:hashTypes,data:data};
  data.buffer.push(escapeExpression(((stack1 = helpers['bind-attr'] || depth0['bind-attr']),stack1 ? stack1.call(depth0, options) : helperMissing.call(depth0, "bind-attr", options))));
  data.buffer.push("></i>\n                ");
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = '', hashTypes, hashContexts;
  data.buffer.push("\n                ");
  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.body", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("\n            ");
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = '', hashTypes, hashContexts;
  data.buffer.push("\n                ");
  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "yield", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("\n            ");
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = '', stack1, hashContexts, hashTypes, options;
  data.buffer.push("\n                ");
  hashContexts = {'content': depth0,'targetObjectBinding': depth0};
  hashTypes = {'content': "ID",'targetObjectBinding': "STRING"};
  options = {hash:{
    'content': (""),
    'targetObjectBinding': ("view.targetObject")
  },contexts:[],types:[],hashContexts:hashContexts,hashTypes:hashTypes,data:data};
  data.buffer.push(escapeExpression(((stack1 = helpers['bs-button'] || depth0['bs-button']),stack1 ? stack1.call(depth0, options) : helperMissing.call(depth0, "bs-button", options))));
  data.buffer.push("\n            ");
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = '', hashTypes, hashContexts;
  data.buffer.push("\n                ");
  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
  data.buffer.push("\n            ");
  return buffer;
  }

  data.buffer.push("<div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n        <div class=\"modal-header\">\n            <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n            <h4 class=\"modal-title\">\n                ");
  hashTypes = {};
  hashContexts = {};
  stack1 = helpers['if'].call(depth0, "titleIconClasses", {hash:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n                ");
  hashContexts = {'unescaped': depth0};
  hashTypes = {'unescaped': "STRING"};
  stack1 = helpers._triageMustache.call(depth0, "title", {hash:{
    'unescaped': ("true")
  },contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            </h4>\n        </div>\n        <div class=\"modal-body\">\n            ");
  hashTypes = {};
  hashContexts = {};
  stack1 = helpers['if'].call(depth0, "body", {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data),contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n        </div>\n        <div class=\"modal-footer\">\n            ");
  hashTypes = {};
  hashContexts = {};
  stack1 = helpers.each.call(depth0, "footerButtons", {hash:{},inverse:self.noop,fn:self.program(7, program7, data),contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n            ");
  hashTypes = {};
  hashContexts = {};
  stack1 = helpers.each.call(depth0, "footerViews", {hash:{},inverse:self.noop,fn:self.program(9, program9, data),contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n        </div>\n    </div>\n</div>");
  return buffer;
  
});