import Ember from 'ember';

export default Ember.Component.extend({
    classNameBindings: ['fixed:toolbox-fixed'],

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

    setToolboxNow: function(show){
        if (!show && this.get('control.fixed')) {
            return;
        }
        Ember.$('#toolbox').css('margin-right', show ? 0 : -365);
        Ember.$('#scraped-doc').css('margin-right', show ? 400 : 35);

        Ember.run.later(this, function(){
            var docView = this.get('documentView');
            if(docView && docView.redrawNow) {
                docView.redrawNow();
            }
        }, show ? 320 : 820);
    },

    setToolbox: function(show) {
        Ember.run.debounce(this, this.setToolboxNow, show, show ? 300 : 800);
    },

    showToolbox: function(){ return this.setToolbox(true); },
    hideToolbox: function() { return this.setToolbox(false); },

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
