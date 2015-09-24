import Ember from 'ember';
import ToolPanel from './tool-panel';

export default ToolPanel.extend({
    classNames: ['extracted-items-json'],
    title: 'JSON',
    toolId: 'extracted-items-json',
    extractedItems: Ember.inject.service()
});
