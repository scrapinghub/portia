import ModalManager from '../utils/modal-manager';

export function initialize(container, application) {
    var manager = new ModalManager();
    container.register('modal:manager', manager, { instantiate: false });
    application.inject('component:bs-modal', 'ModalManager', 'modal:manager');
    application.inject('component:bs-dropdown', 'ModalManager', 'modal:manager');
    application.inject('controller', 'ModalManager', 'modal:manager');
}

export default {
    name: 'register-modal',
    initialize: initialize
};
