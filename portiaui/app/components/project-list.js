import Ember from 'ember';

export default Ember.Component.extend({
    store: Ember.inject.service(),

    classNames: ['project-list', 'list-group'],
    classNameBindings: ['showSearch', 'filteredProjects.length::empty'],

    minSearchableProjects: 8,
    projects: [],
    searchTerm: '',

    showSearch: Ember.computed('projects', function() {
        return this.get('projects.content.length') > this.get('minSearchableProjects');
    }),

    filteredProjects: Ember.computed('projects', 'searchTerm', function() {
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
            this.set('searchTerm', '');
        }
    }
});
