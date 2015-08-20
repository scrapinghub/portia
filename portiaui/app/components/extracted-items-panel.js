import Ember from 'ember';
import ToolPanel from './tool-panel';

export default ToolPanel.extend({
    extractedItems: Ember.inject.service(),

    classNames: ['extracted-items', 'container-fluid'],

    tabComponentName: 'extracted-items-tab',
    toolId: 'extracted-items'
});
