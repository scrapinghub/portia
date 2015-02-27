import Ember from 'ember';
import AccordionItemComponent from 'ember-idx-accordion/accordion-item';

export default AccordionItemComponent.extend({

    select: function(e) {
        if (!(e || this.getWithDefault('reTrigger', true))) {
            return;
        }
        if (e) {
            var target = Ember.$(e.target);
            if (!(target.data('header') ||
                target.parents('*[data-header]').length > 0)) {
                return;
            }
        }
        this.set('reTrigger', false);
        return this.get('accordion').select(this);
    }.on('click'),
});
