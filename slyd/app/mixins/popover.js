import Ember from 'ember';

export default Ember.Mixin.create({
    addTooltip: function() {
        if (this.get('title')) {
            this.$().tooltip({
                placement: this.getWithDefault('popoverPlacement', 'bottom'),
                template: '<div class="tooltip" role="tooltip">' +
                            '<div class="tooltip-arrow"></div>' +
                            '<div><div class="tooltip-inner"></div>' +
                            '</div></div>' +
                          '</div>',
                html: this.getWithDefault('html', false)
            });
        }
    },

    didInsertElement: function() {
        this.addTooltip();
        this._super();
    }
});
