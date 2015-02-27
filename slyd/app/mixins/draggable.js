import Ember from 'ember';

export default Ember.Mixin.create({
    attributeBindings: ['draggable'],
    draggable: true,
    content: null,

    dragStart: function(event) {
        this._super(event);
        var dataTransfer = event.originalEvent.dataTransfer;
        dataTransfer.setDragImage(this.get('element'),
            Ember.$(this.get('element')).width() / 2 , Ember.$(this.get('element')).height());
        dataTransfer.setData('data', this.get('content'));
    }
});
