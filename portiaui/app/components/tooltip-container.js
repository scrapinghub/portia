import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    delay: {
        show: 500,
        hide: 0
    },
    placement: 'top',
    text: false,
    tooltipContainer: false,
    tooltipFor: false,
    triggerEvents: 'hover focus',
    viewport: {
        selector: 'body',
        padding: 0
    },

    didInsertElement() {
        Ember.run.schedule('afterRender', this, 'createTooltip');
    },

    willDestroyElement() {
        Ember.run.schedule('afterRender', this, 'destroyTooltip');
    },

    createTooltip() {
        const selector = this.get('tooltipFor');
        Ember.$(`#${selector}`).tooltip({
            /*
                We pass in an existing element as the template. Bootstrap's
                tooltip code will happily swallow this and insert it into the
                DOM. Ember will keep this element updated as data changes.
             */
            template: Ember.$(`[data-tooltip-id="${this.elementId}"]`).detach(),
            // title is check for truthiness by bootstrap
            title: true,
            container: this.get('tooltipContainer'),
            delay: this.get('delay'),
            placement: this.get('placement'),
            trigger: this.get('triggerEvents'),
            viewport: this.get('viewport')
        });
    },

    destroyTooltip() {
        const selector = this.get('tooltipFor');
        Ember.$(`#${selector}`).tooltip('destroy');
    }
});
