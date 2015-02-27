import Ember from 'ember';

export default Ember.Mixin.create({
    classNameBindings : [ 'dragClass' ],
    dragClass : 'deactivated',
    content: null,

    drop: function(event) {
        event.preventDefault();
        this.set('dragClass', '');
        var data = event.originalEvent.dataTransfer.getData('data');
        this.sendAction('action', this.get('content'), data);
        return false;
    },

    dragLeave: function(event) {
        event.preventDefault();
        this.set('dragClass', '');
    },

    dragOver: function(event) {
        event.preventDefault();
        this.set('dragClass', 'drop-target-dragging');
    },
});
