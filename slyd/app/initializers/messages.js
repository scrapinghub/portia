import Messages from '../utils/messages';

export function initialize(container, application) {
    container.register('app:messages', Messages, { instantiate: false });
    application.inject('controller', 'messages', 'app:messages');
    application.inject('component:inline-help', 'messages', 'app:messages');
}

export default {
  name: 'messages',
  initialize: initialize
};
