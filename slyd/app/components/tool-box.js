import Ember from 'ember';

export default Ember.Component.extend({
    documentView: function() {
        this.set('documentView', this.get('document.view'));
    }.property('document.view'),

    handlerInfos: function() {
        return this.get('router').router.currentHandlerInfos;
    }.property('applicationController.currentPath'),

    pathNames: Ember.computed.mapBy('handlerInfos', 'name'),
    controllers: Ember.computed.mapBy('handlerInfos', 'handler.controller'),

    fixed: function() {
        var activeController = this.get('controllers').get('lastObject');
        return activeController.getWithDefault('fixedToolbox', false) || this.get('control.fixed');
    }.property('controllers.@each.fixedToolbox', 'control.fixed'),

    setBlocked: function() {
        if (this.get('documentView')) {
            this.get('documentView').setInteractionsBlocked(this.get('fixed'));
        }
    }.observes('fixed'),

    timeoutHandle: null,

    showToolbox: function() {
        if (this.get('timeoutHandle')) {
            Ember.run.cancel(this.get('timeoutHandle'));
            this.set('timeoutHandle', null);
        }
        var timeoutHandle = Ember.run.later(function() {
            var self = this;
            Ember.$('#toolbox').css('margin-right', 0);
            Ember.$('#scraped-doc').css('margin-right', 400);
            Ember.run.later(function() {
                if (self.get && self.get('documentView') &&
                      self.get('documentView').redrawNow) {
                    self.get('documentView').redrawNow();
                }
            }, 320);
        }.bind(this), 300);
        this.set('timeoutHandle', timeoutHandle);
    },

    hideToolbox: function() {
        if (this.get('timeoutHandle')) {
            Ember.run.cancel(this.get('timeoutHandle'));
            this.set('timeoutHandle', null);
        }
        var timeoutHandle = Ember.run.later(function() {
            var self = this;
            if (!this.get('control.fixed')) {
                Ember.$('#toolbox').css('margin-right', -365);
                Ember.$('#scraped-doc').css('margin-right', 35);
                Ember.run.later(function() {
                    if (self.get && self.get('documentView') &&
                          self.get('documentView').redrawNow) {
                        self.get('documentView').redrawNow();
                    }
                }, 820);
            }
        }.bind(this), 800);
        this.set('timeoutHandle', timeoutHandle);
    },

    mouseEnter: function() {
        this.showToolbox();
    },

    mouseLeave: function(e) {
        if (!this.get('fixed') && !this.get('control.pinned')) {
            if (e.target.tagName.toLowerCase() !== 'select') {
                this.hideToolbox();
            }
        }
    },

    changeState: function() {
        if (this.get('control.expand') || this.get('control.pinned') ||
              this.get('fixed')) {
            this.showToolbox();
            this.get('control').set('expand', false);
        } else {
            this.hideToolbox();
        }
    }.observes('fixed', 'control.fixed'),

    didInsertElement: function() {
        this._super();
    },
});