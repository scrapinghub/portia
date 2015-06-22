import { Canvas } from 'portia-web/utils/canvas';
import Ember from 'ember';

var canvas = null;

module('portia | utils | canvas');

// Replace this with your real tests.
test('it works', function() {
  var canvas = $('<canvas id="portiacanvas"/>').appendTo(document.body);
  var result = Canvas.create({
    canvasId: 'portiacanvas'
  });
  canvas.remove();
  ok(result);
});
