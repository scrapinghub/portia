import Ember from 'ember';

const $ = Ember.$;

export default Ember.Component.extend({
    tagName: 'ul',
    classNames: ['tree-list'],
    reorderable: false,
    classNameBindings: ['reorderable:reorderable-list'],

    drop: function(event) {
        if(this.get('reorderable')){
            event.preventDefault();
            this.$('.drop-helper').remove();
            var $moved = this.$('.dragging');
            var [target, after] = this.getDropTarget(event.originalEvent);

            // All this are no-ops
            if(after && (target === $moved.prev()[0]) ||
               !after && (target === $moved.next()[0]) ||
               target === $moved[0]) {
                return;
            }
            var originalIndex = $moved.prevAll().length;
            var newIndex = $(target).prevAll().length + (after?1:0);
            if($(target).prevAll().filter($moved).length) {
                // If dropping after the original position, remove one to
                // compensate for the removed element
                newIndex -= 1;
            }
            this.sendAction('reorder', originalIndex, newIndex);
        }
    },

    dragLeave: function(event) {
        if(this.get('reorderable')) {
            event.preventDefault();
            this.$('.drop-helper').remove();
        }
    },

    getDropTarget: function(event){
        var container = this.$()[0];
        if(event.target === container){ return [null, null]; }

        var overTarget = event.target.parentNode === container ? event.target: $(event.target).parentsUntil(this.$()).get(-1);

        var clientRect = overTarget.getBoundingClientRect();
        var targetY = event.clientY - clientRect.top;
        var after = targetY > clientRect.height/2;
        return [overTarget, after];
    },

    dragOver: function(event) {
        if(this.get('reorderable')) {
            this.$('.drop-helper').remove();
            var [target, after] = this.getDropTarget(event.originalEvent);
            if(target){
                event.preventDefault();
                var helper = $('<div/>').addClass('drop-helper');
                helper[after?'insertAfter':'insertBefore'](target);
            }
        }
    },

});
