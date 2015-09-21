import Ember from 'ember';


function computedRouteModels(mapping) {
    const properties = Object.keys(mapping);
    return Ember.computed(
        'router.currentState', ...properties.map(key => mapping[key]), function() {
            const models = {};
            const currentRouteName = this.get('router.currentRouteName');
            properties.forEach(property => {
                const routeProperty = mapping[property];
                const routeName = this.get(`${routeProperty}.routeName`);
                models[property] = currentRouteName.startsWith(routeName) ?
                    this.get(routeProperty).modelFor(routeName) :
                    null;
            });
            return models;
        });
}

export function computedIsCurrentModelById(modelName, idProperty = 'id') {
    var currentModelIdProperty = `uiState.models.${modelName}.id`;
    return Ember.computed(idProperty, currentModelIdProperty, function () {
        return this.get(currentModelIdProperty) === this.get(idProperty);
    });
}

export default Ember.Service.extend({
    models: computedRouteModels({
        project: 'projectRoute',
        spider: 'spiderRoute',
        sample: 'sampleRoute',
        annotation: 'annotationRoute',
        schema: 'schemaRoute'
    }),
    selectedTools: {},
    viewPort: {
        selectedElement: null,
        hoveredElement: null
    }
});
