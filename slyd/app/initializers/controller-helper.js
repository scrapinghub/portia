export function initialize(_, app) {
  app.inject('controller', 'router', 'router:main');
}

export default {
  name: 'controller-helper',
  initialize: initialize
};
