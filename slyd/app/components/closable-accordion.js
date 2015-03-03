import AccordionComponent from 'ember-idx-accordion/accordion';

export default AccordionComponent.extend({
    select: function(item) {
        if (!item) {
            return;
        }
        if (item === this.get('selected')) {
            this.set('selected', null);
            return this.set('selected-idx', -1);
        } else {
            this.set('selected', item);
            return this.set('selected-idx', item.get('index'));
        }
    }
});
