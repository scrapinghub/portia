import Ember from 'ember';
import Draggable from '../mixins/draggable';

export default Ember.Component.extend(Draggable, {
        tagName: 'i',
        classNames: 'fa fa-icon fa-arrows reorder-handler',
        attributeBindings: ['style'],
        dragStart: function(event) {
            var dataTransfer = event.originalEvent.dataTransfer;
            dataTransfer.effectAllowed = "move";
            dataTransfer.setData('text/plain', "");
            var dragElement = this.$().parentsUntil('.reorderable-list').eq(-1);
            dataTransfer.setDragImage(dragElement[0], 5, 5);
            dragElement.addClass('dragging');
        }
});

