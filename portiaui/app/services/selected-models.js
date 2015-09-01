import Ember from 'ember';


function computedRouteModel(routeProperty) {
    return Ember.computed('router.currentState', routeProperty, function() {
        const routeName = this.get(`${routeProperty}.routeName`);
        const currentRouteName = this.get('router.currentRouteName');
        return currentRouteName.startsWith(routeName) ?
            this.get(routeProperty).modelFor(routeName) :
            null;
    });
}

export function computedIsCurrentModelById(modelName, idProperty = 'id') {
    var capFirstModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    var currentModelIdProperty = `selectedModels.current${capFirstModelName}.id`;
    return Ember.computed(idProperty, currentModelIdProperty, function () {
        return this.get(currentModelIdProperty) === this.get(idProperty);
    });
}

export default Ember.Service.extend({
    currentSpider: computedRouteModel('spiderRoute'),
    currentSample: computedRouteModel('sampleRoute'),
    currentAnnotation: computedRouteModel('annotationRoute'),
    currentSchema: computedRouteModel('schemaRoute')
});
