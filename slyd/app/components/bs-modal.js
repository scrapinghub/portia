import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
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
        this.ModalManager.add(name, this);
        if (this.manual) {
            return this.show();
        }
    },

    becameVisible: function() {
        Ember.$('body').addClass('modal-open');
        if (this.get("backdrop")) {
            return this.appendBackdrop();
        }
    },

    becameHidden: function() {
        Ember.$('body').removeClass('modal-open');
        if (this._backdrop) {
            return this._backdrop.remove();
        }
    },

    appendBackdrop: function() {
        var parentElement;
        parentElement = this.$().parent();
        return this._backdrop = Ember.$(this.modalBackdrop).appendTo(parentElement);
    },

    show: function() {
        var current;
        this.set('isVisible', true);
        current = this;
        Ember.run.later((function() {
            current.set('isVis', true);
        }), 15);
    },

    hide: function() {
        var current;
        this.set('isVis', false);
        current = this;
        this.$().one('webkitTransitionEnd', function() {
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

    close: function() {
        var current;
        this.set('isVis', false);
        current = this;
        this.$().one('webkitTransitionEnd', function() {
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
        Ember.$('body').removeClass('modal-open');
        this.removeHandlers();
        name = this.get('name');
        if (name == null) {
            name = this.get('elementId');
        }
        this.ModalManager.remove(name, this);
        if (this._backdrop) {
            return this._backdrop.remove();
        }
    },

    removeHandlers: function() {
        return Ember.$(window.document).unbind("keyup", this._keyUpHandler);
    },

    setupBinders: function() {
        var handler;
        handler = (function(_this) {
            return function(event) {
                return _this.keyPressed(event);
            };
        })(this);
        Ember.$(window.document).bind("keyup", handler);
        return this._keyUpHandler = handler;
    }
});
