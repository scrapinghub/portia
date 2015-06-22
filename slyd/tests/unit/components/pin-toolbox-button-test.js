import {
  moduleForComponent,
  test
} from 'ember-qunit';

moduleForComponent('pin-toolbox-button', 'PinToolboxButtonComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
});

test('it renders', function() {
  expect(2);

  // creates the component instance
  var component = this.subject();
  equal(component._state, 'preRender');

  // appends the component to the page
  this.append();
  equal(component._state, 'inDOM');
});

test('flips the state when clicked', function() {
  var toolbox = {
    pinned: false,
    fixed: false
  };
  var component = this.subject({ toolbox: toolbox });
  equal(toolbox.pinned, false);
  equal(toolbox.fixed, false);
  component.click();
  equal(toolbox.pinned, true);
  equal(toolbox.fixed, false);
  component.click();
  equal(toolbox.pinned, false);
  equal(toolbox.fixed, false);
});

test('sets state in localStorage', function() {
  if(!window.localStorage) {
    window.localStorage = {};
  }
  var toolbox = {
    pinned: false,
    fixed: false
  };
  var component = this.subject({ toolbox: toolbox });
  component.click();
  ok(window.localStorage.portia_toolbox_pinned);
  component.click();
  ok(!window.localStorage.portia_toolbox_pinned);
});

