import Ember from 'ember';

export default Ember.Component.extend({
    classNameBindings: ['fixed:toolbox-fixed'],

    documentView: function() {
        this.set('documentView', this.get('document.view'));
    }.property('document.view'),

    fixed: Ember.computed.reads('control.fixed'),
    pinned: Ember.computed.reads('control.pinned'),

    setBlocked: function() {
        if (this.get('documentView')) {
            this.get('documentView').setInteractionsBlocked(this.get('fixed'));
        }
    }.observes('fixed'),

    setToolboxNow: function(show){
        if (!show && this.get('fixed')) {
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
        if (!this.get('fixed') && !this.get('pinned')) {
            if (e.target.tagName.toLowerCase() !== 'select') {
                this.hideToolbox();
            }
        }
    },

    changeState: function() {
        if (this.get('pinned') || this.get('fixed')) {
            this.showToolbox();
        } else {
            this.hideToolbox();
        }
    }.observes('fixed', 'pinned'),

    didInsertElement: function() {
        this._super();
    },
});
