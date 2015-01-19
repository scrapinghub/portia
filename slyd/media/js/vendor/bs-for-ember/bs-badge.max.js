(function() {
  Bootstrap.BsBadgeComponent = Ember.Component.extend(Bootstrap.TypeSupport, {
    layoutName: 'components/bs-badge',
    tagName: 'span',
    classNames: ['badge'],
    classTypePrefix: 'badge'
  });

  Ember.Handlebars.helper('bs-badge', Bootstrap.BsBadgeComponent);

}).call(this);

Ember.TEMPLATES["components/bs-badge"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "content", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true});