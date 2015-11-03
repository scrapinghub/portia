import Ember from 'ember';

export default Ember.Component.extend({
    uiState: Ember.inject.service(),

    classNames: ['tool-group'],
    classNameBindings: ['collapsed'],

    collapsed: false,
    selected: null,

    init() {
        this._super();
        const id = this.get('elementId');
        this.set('selected', Ember.computed.alias('uiState.selectedTools.' + id));
        this.set('collapsed', Ember.computed.alias('uiState.collapsedPanels.' + id));
    },

    actions: {
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
