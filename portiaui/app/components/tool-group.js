import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['tool-group'],
    classNameBindings: ['collapsed'],
    panels: null,
    panelsOrderBy: ['panelOrder'],
    orderedPanels: Ember.computed.sort('panels', 'panelsOrderBy'),
    toolGroupState: Ember.inject.service(),
    _selected: null,
    selected: Ember.computed.or('_selected', 'orderedPanels.firstObject.toolId'),
    collapsed: false,

    init() {
        this._super();
        var id = this.get('id');
        if (id) {
            this.set('_selected', Ember.computed.alias('toolGroupState.' + this.get('id')));
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
