import Ember from 'ember';

export default Ember.Component.extend({
        attributeBindings: ['draggable', 'style'],
        draggable: true,
        tagName: 'i',
        classNames: 'fa fa-icon fa-arrows reorder-handler',
        dragStart: function(event) {
            var dataTransfer = event.originalEvent.dataTransfer;
            dataTransfer.effectAllowed = "move";
            dataTransfer.setData('text/plain', "");
            var dragElement = this.$().parentsUntil('.reorderable-list').eq(-1);
            dataTransfer.addElement(dragElement[0]);
            dragElement.addClass('dragging').one("dragend", function(){
                dragElement.removeClass('dragging');
            });
        },
});

