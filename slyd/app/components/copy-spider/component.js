import Ember from 'ember';

export default Ember.Component.extend({
    watchDestinationProject: function() {
        this.get('data').params.destinationProject = this.get('destinationProject');
    }.observes('destinationProject'),

    willInsertElement: function() {
        this.get('data').params = {
            spiders: [],
            items: []
        };

        this.get('slyd').getProjectNames().then(function(projects) {
            this.set('projects', projects);
            this.set('destinationProject', projects[0].id);
        }.bind(this));

        this.get('slyd').getSpiderNames().then(function(spiders) {
            this.set('spiders', spiders);
        }.bind(this));

        this.get('slyd').loadItems().then(function(items) {
            this.set('items', items.map(function(item) {
                return item.name;
            }));
        }.bind(this));
    },

    actions: {
        selectSpider: function(spider, isSelected) {
            var params = this.get('data').params;
            if (!isSelected) {
                params.spiders = params.spiders.without(spider);
            } else if (!params.spiders.contains(spider)) {
                params.spiders.push(spider);
            }
        },

        selectItem: function(item, isSelected) {
            var params = this.get('data').params;
            if (!isSelected) {
                params.items = params.items.without(item);
            } else if (!params.items.contains(item)) {
                params.items.push(item);
            }
        }
    }
});
