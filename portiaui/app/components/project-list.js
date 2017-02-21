import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    store: Ember.inject.service(),

    classNames: ['project-list', 'list-group'],
    classNameBindings: [
        'showSearch',
        'filteredProjects.length::empty',
        'withinDropdown:project-within-dropdown',
        'showSearch::not-searchable'
    ],

    withinDropdown: false,
    minSearchableProjects: 8,
    projects: [],
    searchTerm: '',

    isSelecting: computed.bool('selectProject'),
    emptySearchTerm: computed.equal('searchTerm', ''),
    showSearch: computed('projects', function() {
        return this.get('projects.length') > this.get('minSearchableProjects');
    }),

    filteredProjects: computed('projects', 'searchTerm', function() {
            let term = this.get('searchTerm');
            if (term.length === 0) {
                return this.get('projects');
            }
            return this.get('store').peekAll('project').filter(function(item) {
                return item.get('name').toLowerCase().indexOf(term) > -1;
            });
    }),

    actions: {
        search(value) {
            this.set('searchTerm', value.toLowerCase().trim());
        },
        clear() {
            const action = this.get('onClear');
            if (action && this.get('emptySearchTerm')) {
                action();
            }

            this.set('searchTerm', '');
        },
        selectProject(project) {
            const action = this.get('selectProject');
            if (action) { action(project); }
        }
    }
});
