import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

function computedActiveRoutes(mapping) {
    const properties = Object.keys(mapping);
    return Ember.computed(
        'router.currentState', ...properties.map(key => mapping[key]), function() {
            const activeRoutes = {};
            const currentRouteName = this.get('router.currentRouteName');
            properties.forEach(property => {
                const routeProperty = mapping[property];
                const routeName = this.get(`${routeProperty}.routeName`);
                activeRoutes[property] = currentRouteName.startsWith(routeName);
            });
            return activeRoutes;
        });
}

function computedRouteModels(mapping) {
    const properties = Object.keys(mapping);
    return Ember.computed(
        'router.currentState', ...properties.map(key => mapping[key]), function() {
            const models = {};
            const currentRouteName = this.get('router.currentRouteName');
            properties.forEach(property => {
                const routeProperty = mapping[property];
                const routeName = this.get(`${routeProperty}.routeName`);
                const startsWithRoute = currentRouteName && currentRouteName.startsWith(routeName);
                models[property] = startsWithRoute ?
                    this.get(routeProperty).modelFor(routeName) :
                    null;
            });
            return models;
        });
}

export default Ember.Service.extend({
    models: computedRouteModels({
        project: 'projectRoute',
        spider: 'spiderRoute',
        sample: 'sampleRoute',
        item: 'itemRoute',
        annotation: 'annotationRoute',
        schema: 'schemaRoute',
        field: 'fieldRoute'
    }),
    routes: computedActiveRoutes({
        project: 'projectRoute',
        spider: 'spiderRoute',
        sample: 'sampleRoute',
        data: 'dataRoute',
        item: 'itemRoute',
        annotation: 'annotationRoute',
        schema: 'schemaRoute',
        field: 'fieldRoute'
    }),
    slideMain: false,
    selectedTools: storageFor('uiStateSelectedTools'),
    collapsedPanels: storageFor('uiStateCollapsedPanels'),
    viewPort: {
        hoveredElement: null,
        hoveredModels: [],
        // When the selected element is changed by clicking a parent in
        // the inspector, this is the original element that was selected
        originalSelectedElement: null,
        selectedElement: null,
        selectedModel: null,
        hoverOverlayColor: null
    }
});
