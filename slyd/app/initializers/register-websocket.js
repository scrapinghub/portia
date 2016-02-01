import FerryWebsocket from '../utils/ferry-websocket';
import Timer from '../utils/timer';

export function initialize(container, application) {
    var websocket = new FerryWebsocket();

    container.register('websocket:slyd', websocket, { instantiate: false });
    application.inject('route', 'ws', 'websocket:slyd');
    application.inject('adapter', 'ws', 'websocket:slyd');
    application.inject('controller', 'ws', 'websocket:slyd');
    application.inject('component', 'ws', 'websocket:slyd');

    websocket.connect();
    container.register('websocket:timer', new Timer(websocket), { instantiate: false });
}

export default {
  name: 'register-websocket',
  initialize: initialize
};
