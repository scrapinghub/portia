import {
  moduleForComponent,
  test
} from 'ember-qunit';

import ModalManager from 'portia-web/utils/modal-manager';

moduleForComponent('bs-modal', 'BsModalComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
});

test('it renders', function() {
  expect(2);

  var manager = new ModalManager();
  // creates the component instance
  var component = this.subject({
    name: 'test modal',
    ModalManager: manager
  });

  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});
