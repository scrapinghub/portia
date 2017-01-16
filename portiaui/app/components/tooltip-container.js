import Ember from 'ember';
import { shortGuid } from '../utils/utils';

export default Ember.Component.extend({
    tagName: '',

    delay: {
        show: 500,
        hide: 0
    },
    placement: 'top',
    text: false,
    tooltipClasses: null,
    tooltipContainer: false,
    tooltipFor: false,
    triggerEvents: 'hover',
    viewport: {
        selector: 'body',
        padding: 0
    },

    init() {
        this._super();
        this.$tooltipElement = null;
        this.set('uniqueId', `${shortGuid()}-tooltip`);
    },

    didInsertElement() {
        Ember.run.next(this, this.createTooltip);
    },

    willDestroyElement() {
        Ember.run.next(this, this.destroyTooltip);
    },

    createTooltip() {
        const selector = this.get('tooltipFor');
        const $tooltipElement = this.$tooltipElement = Ember.$(`#${selector}`);
        $tooltipElement.tooltip({
            /*
                We pass in an existing element as the template. Bootstrap's
                tooltip code will happily swallow this and insert it into the
                DOM. Ember will keep this element updated as data changes.
             */
            template: Ember.$(`[data-tooltip-id="${this.get('uniqueId')}"]`).detach(),
            // title is checked for truthiness by bootstrap
            title: true,
            container: this.get('tooltipContainer'),
            delay: this.get('delay'),
            placement: this.get('placement'),
            trigger: this.get('triggerEvents'),
            viewport: this.get('viewport')
        });
    },

    destroyTooltip() {
        this.$tooltipElement.tooltip('destroy');
        this.$tooltipElement = null;
    },

    toggleChanged: Ember.observer('toggleTooltip', function() {
        const e = this.$tooltipElement;
        if (e) {
            const action = this.get('toggleTooltip') ? 'show' : 'hide';
            e.tooltip(action);
        }
    })
});
