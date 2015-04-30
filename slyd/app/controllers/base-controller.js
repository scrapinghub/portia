import Ember from 'ember';
import ApplicationUtils from '../mixins/application-utils';
import ControllerUtils from '../mixins/controller-utils';
import ModalHandler from '../mixins/modal-handler';
import NotificationHandler from '../mixins/notification-handler';
import SizeListener from '../mixins/size-listener';
import ToolboxStateMixin from '../mixins/toolbox-state-mixin';

export default Ember.Controller.extend(ApplicationUtils, SizeListener, ModalHandler, NotificationHandler, ControllerUtils, ToolboxStateMixin, {
    documentView: null,
    breadCrumb: null,
    breadCrumbs: null,

    setBreadCrumbs: function() {
        this.set('breadCrumb', null);
        this.set('breadCrumbs', null);
    }.on('init'),

    extractionTypes: ['text', 'number', 'image', 'price', 'raw html',
                      'safe html', 'geopoint', 'url'],

    setDocumentView: function() {
        this.set('documentView', this.get('document.view'));
    }.on('init'),

    annotationsStore: function() {
        return this.get('document.store');
    }.property('document.store'),

    actions: {
        updateField: function(value, field) {
            if (field) {
                this.set(field, value);
            }
        },
    }
});
