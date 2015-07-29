import Ember from 'ember';
import ControllerUtils from '../mixins/controller-utils';
import ModalHandler from '../mixins/modal-handler';
import NotificationHandler from '../mixins/notification-handler';
import SizeListener from '../mixins/size-listener';

export default Ember.Controller.extend(SizeListener,
        ModalHandler, NotificationHandler, ControllerUtils, {
    documentView: null,
    breadCrumb: null,
    breadCrumbs: null,

    setBreadCrumbs: function() {
        this.set('breadCrumb', null);
        this.set('breadCrumbs', null);
    }.on('init'),

    extractionTypes: ['text', 'number', 'image', 'price', 'raw html',
                      'safe html', 'geopoint', 'url', 'date'],

    setDocumentView: function() {
        this.set('documentView', this.get('document.view'));
    }.on('init'),

    annotationsStore: Ember.computed.reads('document.store'),

    actions: {
        updateField: function(value, field) {
            if (field) {
                this.set(field, value);
            }
        },
    }
});
