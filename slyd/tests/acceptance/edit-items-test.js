import acceptanceTest from '../helpers/acceptance-test';
import Ember from 'ember';
import { lastRequest, fixtures } from '../helpers/fixtures';
import ws from '../helpers/websocket-mock';


module('Acceptance | Edit Items', { });

const save = 'button:contains("Save changes")';
const add_item = 'button:contains("Item") .fa-plus';
const inline_field = '.form-control.input-sm';

var savedItems = null;

fixtures['POST /projects/11/spec/items'] = function(items){
    savedItems = items;
};


acceptanceTest('Edit Items', function(app, assert) {

  var reset = () => visit('/projects/11/items');

  function getItemNames (){
      return Object.values(ws.lastMessage.items).map((item) => item.display_name).sort();
  }

  reset().then(function(){
      return click(save);
  }).then(function(){
      var saveMeta = ws.lastMessage._meta;
      equal([saveMeta.project, saveMeta.type].join('/'), '11/items');
      deepEqual(Object.keys(ws.lastMessage.items), ['default']);
      return reset();
  })
  .then(() => click(add_item))
  .then(() => click('.editable-name:contains("Item: New")'))
  .then(() => fillIn(inline_field, 'foobar'))
  .then(() => triggerEvent(inline_field, 'blur'))
  .then(() => click(save)).then(function(){
      deepEqual(getItemNames(), ['default_item', 'foobar']);
      return reset();
  })
  .then(() => click('.editable-name:contains("optional")'))
  .then(() => fillIn(inline_field, 'url'))
  .then(() => triggerEvent(inline_field, 'blur')).then(function(){
    ok($(inline_field).length, "Can't name a field 'url'");
    ok(app.lastNotification.message, 'Shows a message explaining');
    app.lastNotification = null;
  })
  .then(() => fillIn(inline_field, '_foobar'))
  .then(() => triggerEvent(inline_field, 'blur')).then(function(){
    ok($(inline_field).length, "Can't start a field with underscore");
    ok(app.lastNotification.message, 'Shows a message explaining');
    app.lastNotification = null;
  })
  .then(() => fillIn(inline_field, 'price'))
  .then(() => triggerEvent(inline_field, 'blur')).then(function(){
    ok($(inline_field).length, "Can't name two fields the same");
    ok(app.lastNotification.message, 'Shows a message explaining');
    app.lastNotification = null;
  })
  .then(() => fillIn(inline_field, 'foobar'))
  .then(() => triggerEvent(inline_field, 'blur')).then(function(){
    ok($(inline_field).length === 0, "Works when valid name");
    ok(!app.lastNotification, "Doesn't show notification when valid name");
    return click(save);
  }).then(function(){
      var fields = Ember.copy(fixtures['/projects/11/spec/items'].default.fields, true);
      fields["2"].display_name = "foobar";
      deepEqual(ws.lastMessage.items.default.fields, fields);
      return reset();
  })
  .then(() => click('.row:has(.editable-name:contains("optional")) .fa-trash:eq(0)'))
  .then(() => click('.row:has(.editable-name:contains("price")) .fa-trash:eq(0)'))
  .then(() => click(save))
  .then(function(){
      var fields = Ember.copy(fixtures['/projects/11/spec/items'].default.fields, true);
      delete fields["2"];
      delete fields["5"];
      deepEqual(ws.lastMessage.items.default.fields, fields);
  });
});

