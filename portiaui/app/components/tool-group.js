import Ember from 'ember';


export default Ember.Component.extend({
    uiState: Ember.inject.service(),

    classNames: ['tool-group'],
    classNameBindings: ['collapsed'],

    collapsed: false,
    panels: null,
    panelsOrderBy: ['panelOrder'],
    _selected: null,

    orderedPanels: Ember.computed.sort('panels', 'panelsOrderBy'),
    selected: Ember.computed.or('_selected', 'orderedPanels.firstObject.toolId'),

    init() {
        this._super();
        var id = this.get('id');
        if (id) {
            this.set('_selected', Ember.computed.alias('uiState.selectedTools.' + this.get('id')));
        } else {
            this.set('_selected', null);
        }
        this.set('panels', []);
    },

    unregister(tab) {
        this.get('panels').removeObject(tab);
    },

    register(tab) {
        this.get('panels').addObject(tab);
    },

    actions: {
        selectTab(toolId) {
            this.setProperties({
                _selected: toolId,
                collapsed: false
            });
        },
        toggleCollapsed() {
            this.toggleProperty('collapsed');
        }
    }
});
