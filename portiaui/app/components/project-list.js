import Ember from 'ember';

export default Ember.Component.extend({
    minSearchableProjects: 8,
    searchTerm: '',
    projects: [],
    store: Ember.inject.service(),

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
