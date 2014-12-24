(function() {
  Bootstrap.BsBadgeComponent = Ember.Component.extend(Bootstrap.TypeSupport, {
    layoutName: 'components/bs-badge',
    tagName: 'span',
    classNames: ['badge'],
    classTypePrefix: 'badge'
  });

  Ember.Handlebars.helper('bs-badge', Bootstrap.BsBadgeComponent);

}).call(this);

this["Ember"] = this["Ember"] || {};
this["Ember"]["TEMPLATES"] = this["Ember"]["TEMPLATES"] || {};

this["Ember"]["TEMPLATES"]["components/bs-badge"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var hashTypes, hashContexts, escapeExpression=this.escapeExpression;


  hashTypes = {};
  hashContexts = {};
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "content", {hash:{},contexts:[depth0],types:["ID"],hashContexts:hashContexts,hashTypes:hashTypes,data:data})));
});