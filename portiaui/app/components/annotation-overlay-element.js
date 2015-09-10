import Ember from 'ember';


function computedPropertiesEqual(a, b) {
    return Ember.computed(a, b, function() {
        return this.get(a) === this.get(b);
    });
}


export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    uiState: Ember.inject.service(),

    classNames: ['overlay', 'annotation-overlay'],
    classNameBindings: ['hovered', 'selected'],

    hovered: computedPropertiesEqual('viewPortElement', 'uiState.viewPort.hoveredElement'),
    selected: computedPropertiesEqual('viewPortElement', 'uiState.viewPort.selectedElement'),

    click() {
        this.set('uiState.viewPort.selectedElement', this.get('viewPortElement'));
        if (!this.get('parent.groupSelected')) {
            const routing = this.get('routing');
            const models = [this.get('parent.overlay.id')];
            routing.transitionTo('projects.project.spider.sample.annotation', models, {}, true);
        }
    },

    willInsertElement() {
        this.get('browserOverlays').addElementOverlay(this);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeElementOverlay(this);
    }
});
