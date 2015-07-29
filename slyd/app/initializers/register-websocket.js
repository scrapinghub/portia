import FerryWebsocket from '../utils/ferry-websocket';

export function initialize(container, application) {
    application.deferReadiness();
    var websocket = new FerryWebsocket();
    websocket.connect().then(function() {
        container.register('websocket:slyd', websocket, { instantiate: false });
        application.inject('route', 'ws', 'websocket:slyd');
        application.inject('adapter', 'ws', 'websocket:slyd');
        application.inject('controller', 'ws', 'websocket:slyd');
        application.inject('component', 'ws', 'websocket:slyd');
        window.addEventListener('beforeunload', function() {
            websocket.close();
        });
        application.advanceReadiness();
    });
}

export default {
  name: 'register-websocket',
  initialize: initialize
};
