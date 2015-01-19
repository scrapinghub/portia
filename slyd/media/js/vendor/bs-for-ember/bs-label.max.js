(function() {
  Bootstrap.BsLabelComponent = Ember.Component.extend(Bootstrap.TypeSupport, {
    layoutName: 'components/bs-label',
    tagName: 'span',
    classNames: ['label'],
    classTypePrefix: 'label'
  });

  Ember.Handlebars.helper('bs-label', Bootstrap.BsLabelComponent);

}).call(this);

Ember.TEMPLATES["components/bs-label"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "content", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true});