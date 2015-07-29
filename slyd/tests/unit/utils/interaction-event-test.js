import interactionEvent from 'portia-web/utils/interaction-event';

module('interactionEvent');

// Replace this with your real tests.
test('it works', function() {
  var evt = document.createEvent('Event');
  evt.initEvent('TestEvent', true, true);
  document.documentElement.dispatchEvent(evt);
  var result = interactionEvent(evt);
  ok(result);
});
