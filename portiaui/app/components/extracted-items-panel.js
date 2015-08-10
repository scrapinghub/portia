import Ember from 'ember';
import ToolPanel from './tool-panel';

export default ToolPanel.extend({
    classNames: ['extracted-items', 'container-fluid'],
    toolId: 'extracted-items',
    tabComponent: 'extracted-items-tab',
    extractedItems: Ember.inject.service()
});
