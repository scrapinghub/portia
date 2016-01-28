import Ember from 'ember';

export default Ember.Component.extend({
    uiState: Ember.inject.service(),

    classNames: ['tool-group'],
    classNameBindings: ['collapsed'],

    close: false,
    collapsible: true,
    collapsed: false,
    selected: null,

    init() {
        this._super();
        const id = this.get('elementId');
        Ember.mixin(this, {
            selected: Ember.computed.alias('uiState.selectedTools.' + id),
            collapsed: Ember.computed.alias('uiState.collapsedPanels.' + id)
        });
    },

    actions: {
        close() {
            if (this.attrs.close) {
                this.attrs.close();
            }
        },
        selectTab(toolId) {
            this.setProperties({
                selected: toolId,
                collapsed: false
            });
        },
        toggleCollapsed() {
            this.toggleProperty('collapsed');
        }
    }
});
