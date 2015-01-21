Ember.TEMPLATES["annotated-document-view"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  data.buffer.push("<div id=\"scraped-doc\">\n	<iframe id=\"scraped-doc-iframe\" src=\"start.html\" class=\"adjust-height\"></iframe>\n	<canvas id=\"infocanvas\" class=\"doc-canvas adjust-height\"></canvas>\n	<div id=\"loader-container\" class=\"adjust-height\"></div>\n	<div style=\"position:absolute;z-index:20;width:100%;pointer-events:none\">\n		<div id=\"hovered-element-info\"></div>\n	</div>\n</div>\n");
  },"useData":true});

Ember.TEMPLATES["annotation-widget"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("\n");
  stack1 = helpers.unless.call(depth0, "view.hasMultipleMappings", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(2, data),"inverse":this.program(4, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.attributeSelect", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.fieldSelect", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "variant-select", {"name":"view","hash":{
    'annotation': ("view.annotation")
  },"hashTypes":{'annotation': "ID"},"hashContexts":{'annotation': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		<div style=\"margin-top:5px;padding:5px\">\n			<div style=\"display:inline-block;width:72%\">\n				<h5>Attribute value:</h5>\n				<span style=\"color:black;word-wrap:break-word;\">\n					");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "collapsible-text", {"name":"view","hash":{
    'trimTo': (40),
    'fullText': ("view.attributeValue")
  },"hashTypes":{'trimTo': "NUMBER",'fullText': "ID"},"hashContexts":{'trimTo': depth0,'fullText': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				</span>\n			</div>\n			<div style=\"text-align:right;display:inline-block;width:24%\">\n				");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'icon': ("fa fa-icon fa-gear"),
    'clickedParam': ("view.annotation"),
    'clicked': ("editAnnotation"),
    'type': ("primary")
  },"hashTypes":{'size': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING",'type': "STRING"},"hashContexts":{'size': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0,'type': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n				");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("view.annotation"),
    'clicked': ("deleteAnnotation"),
    'type': ("danger")
  },"hashTypes":{'size': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING",'type': "STRING"},"hashContexts":{'size': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0,'type': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n			</div>\n		</div>\n\n");
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("		<div>\n			<div style=\"display:inline-block;width:75%\">\n");
  stack1 = helpers.each.call(depth0, "ann", "in", "view.mappings", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(5, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n			<div style=\"text-align:right;display:inline-block;width:21%;\">\n				<div style=\"text-align:center;display:inline-block;width:60px;margin:4px\">");
  stack1 = helpers._triageMustache.call(depth0, "view.annotation.variant", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n				");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'icon': ("fa fa-icon fa-gear"),
    'clickedParam': ("view.annotation"),
    'clicked': ("editAnnotation"),
    'type': ("primary")
  },"hashTypes":{'size': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING",'type': "STRING"},"hashContexts":{'size': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0,'type': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n				");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("view.annotation"),
    'clicked': ("deleteAnnotation"),
    'type': ("danger")
  },"hashTypes":{'size': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING",'type': "STRING"},"hashContexts":{'size': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0,'type': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n			</div>\n		</div>\n");
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					<div class=\"attribute multimap\">");
  stack1 = helpers._triageMustache.call(depth0, "ann.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n					<div class=\"field multimap\" >");
  stack1 = helpers._triageMustache.call(depth0, "ann.mappedField", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n");
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("	<div style=\"float:right;margin-right:4px\"");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "createField", {"name":"action","hash":{
    'target': ("view")
  },"hashTypes":{'target': "STRING"},"hashContexts":{'target': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push(">\n	");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("view.createFieldDisabled"),
    'icon': ("fa fa-icon fa-icon-plus"),
    'type': ("primary")
  },"hashTypes":{'disabled': "ID",'icon': "STRING",'type': "STRING"},"hashContexts":{'disabled': depth0,'icon': depth0,'type': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</div>\n\n	<div class=\"row\">\n		<div class=\"col-xs-6\">\n			<label class=\"small-label\">Field name</label>\n		</div>\n		<div class=\"col-xs-6\">\n			<label class=\"small-label\">Field type</label>\n		</div>\n	</div>\n	<div class=\"row\">\n		<div class=\"col-xs-6\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.fieldTextField", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n		<div class=\"col-xs-6\">");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.typeSelect", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("</div>\n	</div>\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers.unless.call(depth0, "view.creatingField", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(7, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true});

Ember.TEMPLATES["application"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push(escapeExpression(((helpers.outlet || (depth0 && depth0.outlet) || helperMissing).call(depth0, "topbar", {"name":"outlet","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n");
  data.buffer.push(escapeExpression(((helpers.outlet || (depth0 && depth0.outlet) || helperMissing).call(depth0, "conflictResolver", {"name":"outlet","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "annotated-document", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n<div id=\"toolbox\" class=\"adjust-height\">\n	");
  data.buffer.push(escapeExpression(((helpers.outlet || (depth0 && depth0.outlet) || helperMissing).call(depth0, "main", {"name":"outlet","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["collapsible-text"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "view.collapsed", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(2, data),"inverse":this.program(4, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  data.buffer.push("		<span class=\"blue-label collapse-button\"> [+] </span>\n");
  },"4":function(depth0,helpers,partials,data) {
  data.buffer.push("		<span class=\"blue-label collapse-button\"> [-] </span>\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers._triageMustache.call(depth0, "view.displayedText", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  stack1 = helpers['if'].call(depth0, "view.collapsible", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"useData":true});

Ember.TEMPLATES["conflict-resolver"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div style=\"position:relative;margin-right:400px;\">\n	<div style=\"width:100%;position:absolute;top:30px;z-index:1;font:12px 'Courier';overflow-y:auto\" class=\"adjust-height conflicted-file\">\n		<div style=\"padding:10px\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "json", {"name":"view","hash":{
    'json': ("controller.currentFileContents")
  },"hashTypes":{'json': "ID"},"hashContexts":{'json': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n	</div>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["edit-item"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				<span class=\"editable-name\">Item ");
  stack1 = helpers._triageMustache.call(depth0, "item.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div class=\"row small-label\">\n					<div class=\"col-xs-4\">Field</div>\n					<div class=\"col-xs-3\">Type</div>\n					<div class=\"col-xs-5\">Required Vary</div>\n				</div>\n				<div class=\"row\" style=\"color: #CCC;margin:0\">\n					<div class=\"col-xs-4\">url</div>\n					<div class=\"col-xs-4\">url</div>\n					<div class=\"col-xs-1\"><input type=\"checkbox\" checked=true disabled=true></div>\n					<div class=\"col-xs-1\"><input type=\"checkbox\" checked=true disabled=true></div>\n					<div class=\"col-xs-1\">");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'disabled': (true),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash")
  },"hashTypes":{'size': "STRING",'disabled': "BOOLEAN",'type': "STRING",'icon': "STRING"},"hashContexts":{'size': depth0,'disabled': depth0,'type': depth0,'icon': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("</div>\n				</div>\n");
  stack1 = helpers.each.call(depth0, "field", "in", "item.fields", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(4, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("					<div class=\"row\" style=\"margin:0\">\n						<div class=\"col-xs-4 top-div\">\n							<div class=\"field-name\">\n");
  stack1 = helpers.view.call(depth0, "inline-text-field", {"name":"view","hash":{
    'validate': (true),
    'value': ("field.name")
  },"hashTypes":{'validate': "BOOLEAN",'value': "ID"},"hashContexts":{'validate': depth0,'value': depth0},"fn":this.program(5, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("							</div>\n						</div>\n						<div class=\"col-xs-4\">\n							");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "type-select", {"name":"view","hash":{
    'itemField': ("field"),
    'value': ("field.type"),
    'name': ("fieldType")
  },"hashTypes":{'itemField': "ID",'value': "ID",'name': "STRING"},"hashContexts":{'itemField': depth0,'value': depth0,'name': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n						</div>\n						<div class=\"col-xs-1\" style=\"text-align:center;\">\n							");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "check-box", {"name":"view","hash":{
    'name': ("fieldRequired"),
    'checked': ("field.required")
  },"hashTypes":{'name': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n						</div>\n						<div class=\"col-xs-1\" style=\"text-align:center;\">\n							");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "check-box", {"name":"view","hash":{
    'name': ("fieldVary"),
    'checked': ("field.vary")
  },"hashTypes":{'name': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n						</div>\n						<div class=\"col-xs-1\">\n							");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'clickedParam2': ("field"),
    'clickedParam': ("view.item"),
    'clicked': ("deleteField"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'size': ("xs")
  },"hashTypes":{'clickedParam2': "ID",'clickedParam': "ID",'clicked': "STRING",'type': "STRING",'icon': "STRING",'size': "STRING"},"hashContexts":{'clickedParam2': depth0,'clickedParam': depth0,'clicked': depth0,'type': depth0,'icon': depth0,'size': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n						</div>\n					</div>\n");
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("									<span class=\"editable-name\">");
  stack1 = helpers._triageMustache.call(depth0, "field.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n");
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  data.buffer.push("			<h5>No fields defined yet.</h5>\n");
  },"9":function(depth0,helpers,partials,data) {
  data.buffer.push("				Field\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div class=\"editable-item-container\">\n	<div>\n		<span style=\"margin:2px 0px 0px 10px\">\n");
  stack1 = helpers.view.call(depth0, "inline-text-field", {"name":"view","hash":{
    'validate': (true),
    'value': ("item.name")
  },"hashTypes":{'validate': "BOOLEAN",'value': "ID"},"hashContexts":{'validate': depth0,'value': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</span>\n		<span style=\"float:right\">\n			");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("item"),
    'clicked': ("deleteItem")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n		</span>\n	</div>\n	<div style=\"margin-top:20px\">\n");
  stack1 = helpers['if'].call(depth0, "item.fields", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(7, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		<div style=\"text-align:center;margin-top:10px\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'small': (true),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-plus"),
    'clickedParam': ("item"),
    'clicked': ("addField")
  },"hashTypes":{'small': "BOOLEAN",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'small': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(9, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n	</div>\n</div>");
  return buffer;
},"useData":true});

Ember.TEMPLATES["floating-annotation-widget"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("	<div>\n		<span class=\"attribute\">Map attribute</span>\n		<span style=\"margin-left:44px\" class=\"field\">To field</span>\n		<div style=\"display:inline-block;margin-top:2px;margin-left:50px\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("annotation_widget")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n		");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("default"),
    'icon': ("fa fa-icon fa-gear"),
    'clickedParam': ("controller.floatingAnnotation"),
    'clicked': ("editAnnotation")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n		");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("default"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("controller.floatingAnnotation"),
    'clicked': ("deleteAnnotation")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</div>\n");
  stack1 = helpers.unless.call(depth0, "view.hasMultipleMappings", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(2, data),"inverse":this.program(5, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	<div style=\"text-align:center\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("default"),
    'clicked': ("hideFloatingAnnotationWidget"),
    'icon': ("fa fa-icon fa-check-circle")
  },"hashTypes":{'size': "STRING",'type': "STRING",'clicked': "STRING",'icon': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'clicked': depth0,'icon': depth0},"fn":this.program(8, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n");
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("		<div style=\"margin-top:2px;\">\n			<div style=\"color:#333;\">\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.attributeSelect", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.fieldSelect", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				<div style=\"display:inline-block;margin-top:1px\">\n					<span ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "showCreateFieldWidget", {"name":"action","hash":{
    'target': ("view")
  },"hashTypes":{'target': "STRING"},"hashContexts":{'target': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push(">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("default"),
    'icon': ("fa fa-icon fa-plus")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0},"fn":this.program(3, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</span>\n				</div>\n			</div>\n			<div style=\"width:320px;margin:5px;overflow-y:auto;max-height:50px;padding-right:4px\">\n				<span style=\"color:#777\">Attribute value:</span>\n				<span style=\"color:color:#BBB;word-wrap:break-word;\">\n					");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "collapsible-text", {"name":"view","hash":{
    'trimTo': (30),
    'fullText': ("view.attributeValue")
  },"hashTypes":{'trimTo': "NUMBER",'fullText': "ID"},"hashContexts":{'trimTo': depth0,'fullText': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				</span>\n			</div>\n		</div>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  data.buffer.push("							field\n");
  },"5":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("		<div>\n");
  stack1 = helpers.each.call(depth0, "mapping", "in", "view.mappings", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(6, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n");
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				<div class=\"multimap\">\n					<div style=\"display:inline-block;width:120px\">");
  stack1 = helpers._triageMustache.call(depth0, "mapping.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n					<div style=\"display:inline-block;\">");
  stack1 = helpers._triageMustache.call(depth0, "mapping.mappedField", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n				</div>\n");
  return buffer;
},"8":function(depth0,helpers,partials,data) {
  data.buffer.push("			Done\n");
  },"10":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("	<div class=\"row\">\n		<div class=\"col-xs-6\">\n			<label class=\"small-label\" style=\"margin-left:40px\">Field name</label>\n		</div>\n		<div class=\"col-xs-6\">\n			<label class=\"small-label\">Field type</label>\n		</div>\n	</div>\n	<div class=\"row\">\n		<div class=\"col-xs-6\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.fieldTextField", {"name":"view","hash":{
    'width': ("110%")
  },"hashTypes":{'width': "STRING"},"hashContexts":{'width': depth0},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n		<div class=\"col-xs-6 button-align-sm\" style=\"color:#333;\">\n			<span>\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.typeSelect", {"name":"view","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			</span>\n			<span ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "createField", {"name":"action","hash":{
    'target': ("view")
  },"hashTypes":{'target': "STRING"},"hashContexts":{'target': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push(">\n				");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'disabled': ("view.createFieldDisabled"),
    'type': ("default"),
    'icon': ("fa fa-icon fa-check-circle")
  },"hashTypes":{'size': "STRING",'disabled': "ID",'type': "STRING",'icon': "STRING"},"hashContexts":{'size': depth0,'disabled': depth0,'type': depth0,'icon': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n			</span>\n		</div>\n	</div>\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers.unless.call(depth0, "view.creatingField", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(10, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"useData":true});

Ember.TEMPLATES["inline-textfield"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("		<span class=\"editable-name\">\n	 		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "view.textField", {"name":"view","hash":{
    'value': ("view.value")
  },"hashTypes":{'value': "ID"},"hashContexts":{'value': depth0},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n	 	</span>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("		");
  stack1 = helpers._triageMustache.call(depth0, "yield", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("<span>\n");
  stack1 = helpers['if'].call(depth0, "view.isEditing", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(3, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>");
  return buffer;
},"useData":true});

Ember.TEMPLATES["item"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("			<div style=\"margin-top:10px\">\n			<table style=\"margin:0 auto;\">\n				<tr class=\"small-label\"> <td>Field</td> <td>Type</td> <td>Required</td> <td>Vary</td> </tr>\n");
  stack1 = helpers.each.call(depth0, "field", "in", "fields", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(2, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</table>\n");
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<tr>\n						<td><h5 style=\"color:#666\">");
  stack1 = helpers._triageMustache.call(depth0, "field.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</h5></td>\n						<td><h5>");
  stack1 = helpers._triageMustache.call(depth0, "field.type", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</h5></td>\n						<td><h5>");
  stack1 = helpers['if'].call(depth0, "field.required", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(5, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</h5></td>\n						<td><h5>");
  stack1 = helpers['if'].call(depth0, "field.vary", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(5, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</h5></td>\n						<td style=\"padding-bottom:4px;\">\n							");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("primary"),
    'clickedParam': ("name"),
    'clicked': ("fieldSelected"),
    'icon': ("fa fa-icon fa-check-circle")
  },"hashTypes":{'size': "STRING",'type': "STRING",'clickedParam': "ID",'clicked': "STRING",'icon': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'clickedParam': depth0,'clicked': depth0,'icon': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n						</td>\n					</tr>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  data.buffer.push("yes");
  },"5":function(depth0,helpers,partials,data) {
  data.buffer.push("no");
  },"7":function(depth0,helpers,partials,data) {
  data.buffer.push("			<h5>The item has no fields.</h5>\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("<div>\n	<h5 style=\"text-align:center;\">Choose an item field</h5>\n	<div style=\"text-align:center; margin-top:10px\">\n		<h4>Item ");
  stack1 = helpers._triageMustache.call(depth0, "name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</h4>\n");
  stack1 = helpers['if'].call(depth0, "fields", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(7, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n</div>");
  return buffer;
},"useData":true});

Ember.TEMPLATES["json-view"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "view.isConflict", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(2, data),"inverse":this.program(8, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "view.resolved", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(5, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("			<span style=\"color:green;font-weight:bold\">RESOLVED TO ");
  stack1 = helpers._triageMustache.call(depth0, "view.selectedOption", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n			<div ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "conflictOptionSelected", "view.path", "null", {"name":"action","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data})));
  data.buffer.push(" style=\"margin:5px 0px 0px 40px;background:#AEA;\" class=\"conflict-option\">\n				<span style=\"font-weight:bold;color:green;margin:5px\"> [CHANGE SELECTION] </span>\n				");
  stack1 = helpers._triageMustache.call(depth0, "view.resolvedValue", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(",\n			</div>\n");
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("			<span style=\"color:red;font-weight:bold\">CONFLICTED VALUE</span>\n			<div style=\"margin-left:40px;\">\n");
  stack1 = helpers.each.call(depth0, "value", "in", "view.conflictValues", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(6, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n");
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<div ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "conflictOptionSelected", "view.path", "key", {"name":"action","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data})));
  data.buffer.push(" class=\"conflict-option\">\n						<div style=\"color:white\">");
  stack1 = helpers._triageMustache.call(depth0, "value.label", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(":</div>\n						<div style=\"word-break:break-word\">\n							");
  stack1 = helpers._triageMustache.call(depth0, "value.value", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n						</div>\n					</div>\n");
  return buffer;
},"8":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("		<div>{\n");
  stack1 = helpers.each.call(depth0, "entry", "in", "view.entries", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(9, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		},</div>\n");
  return buffer;
},"9":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div style=\"margin:5px 5px 0px 20px;\">\n					<span style=\"font-weight:bold\">");
  stack1 = helpers._triageMustache.call(depth0, "entry.key", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(":</span>");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "json-view", {"name":"view","hash":{
    'path': ("entry.path"),
    'json': ("entry.json")
  },"hashTypes":{'path': "ID",'json': "ID"},"hashContexts":{'path': depth0,'json': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				</div>\n");
  return buffer;
},"11":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("	");
  stack1 = helpers._triageMustache.call(depth0, "view.value", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(",\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "view.isObject", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(11, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"useData":true});

Ember.TEMPLATES["loading"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  data.buffer.push("<div style='position:fixed; width:100%; left:0%; height:100%; background:linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.05));'>\n\n<h3 style='text-align:left; margin:50px 0px 0px 20px; color:#FFF; width:200px; font-size: 1.2em'>Loading. Please wait...</h3>\n\n</div>\n");
  },"useData":true});

Ember.TEMPLATES["modal"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div class=\"scrolling-container\" style=\"max-height:400px\">\n    ");
  data.buffer.push(escapeExpression(helpers._triageMustache.call(depth0, "_modalContent", {"name":"_triageMustache","hash":{
    'unescaped': ("true")
  },"hashTypes":{'unescaped': "STRING"},"hashContexts":{'unescaped': depth0},"types":["ID"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n</div>");
  return buffer;
},"useData":true});

Ember.TEMPLATES["navigation"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers._triageMustache.call(depth0, "bs-breadcrumbs", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  else { data.buffer.push(''); }
  },"useData":true});

Ember.TEMPLATES["toolbox-annotation"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<li style=\"float:left; padding:3px 2px 3px 2px;\">\n						");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "css-path-widget", {"name":"view","hash":{
    'class': ("light-button"),
    'minWidth': ("73px"),
    'label': ("path.label"),
    'argument': ("path.element"),
    'action': ("selectElement")
  },"hashTypes":{'class': "STRING",'minWidth': "STRING",'label': "ID",'argument': "ID",'action': "STRING"},"hashContexts":{'class': depth0,'minWidth': depth0,'label': depth0,'argument': depth0,'action': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n					</li>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<li style=\"float:left;padding:3px 2px 3px 2px;\">\n						");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "css-path-widget", {"name":"view","hash":{
    'class': ("light-button"),
    'minWidth': ("73px"),
    'label': ("path.label"),
    'argument': ("path.element"),
    'action': ("selectElement")
  },"hashTypes":{'class': "STRING",'minWidth': "STRING",'label': "ID",'argument': "ID",'action': "STRING"},"hashContexts":{'class': depth0,'minWidth': depth0,'label': depth0,'argument': depth0,'action': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n					</li>\n");
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("			<h4>Not mapped</h4>\n			<div class=\"scrolling-container\" style=\"max-height:180px;\">\n");
  stack1 = helpers.each.call(depth0, "attr", "in", "unmappedAttributes", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(6, data),"inverse":this.program(9, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n\n			<div style=\"margin-bottom:10px\"></div>\n\n			<h4>Mapped</h4>\n			<div class=\"scrolling-container\" style=\"max-height:180px;\">\n");
  stack1 = helpers.each.call(depth0, "attr", "in", "mappedAttributes", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(11, data),"inverse":this.program(14, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n\n			<div style=\"margin-bottom:10px\"></div>\n\n			<h4>Required attributes</h4>");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("sticky_fields")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			<div class=\"scrolling-container\" style=\"max-height:180px;\">\n");
  stack1 = helpers.each.call(depth0, "attr", "in", "stickyAttributes", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(16, data),"inverse":this.program(19, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n");
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					<div class=\"attribute-field-mapping\">\n");
  stack1 = helpers.view.call(depth0, "elem-attribute", {"name":"view","hash":{
    'attribute': ("attr")
  },"hashTypes":{'attribute': "ID"},"hashContexts":{'attribute': depth0},"fn":this.program(7, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n");
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("							<div>\n								<div class=\"attribute-name\">");
  stack1 = helpers._triageMustache.call(depth0, "view.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n								<span style=\"float:right\">\n									");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-exchange"),
    'clickedParam': ("attr"),
    'clicked': ("mapAttribute")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n									");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'title': ("Make this attribute sticky"),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-thumb-tack"),
    'clickedParam': ("attr"),
    'clicked': ("makeSticky")
  },"hashTypes":{'size': "STRING",'title': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'title': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n								</span>\n							</div>\n							<div class=\"attribute-val\">");
  stack1 = helpers._triageMustache.call(depth0, "view.value", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n");
  return buffer;
},"9":function(depth0,helpers,partials,data) {
  data.buffer.push("					<h5>No unmapped attributes.</h5>\n");
  },"11":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					<div class=\"attribute-field-mapping\" style=\"padding-bottom:14px\">\n");
  stack1 = helpers.view.call(depth0, "elem-attribute", {"name":"view","hash":{
    'attribute': ("attr")
  },"hashTypes":{'attribute': "ID"},"hashContexts":{'attribute': depth0},"fn":this.program(12, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n");
  return buffer;
},"12":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("							<div class=\"attribute-name\">");
  stack1 = helpers._triageMustache.call(depth0, "view.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(" -> ");
  stack1 = helpers._triageMustache.call(depth0, "view.field", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n							<span style=\"float:right\">\n								");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("attr"),
    'clicked': ("unmapAttribute")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n							</span>\n");
  return buffer;
},"14":function(depth0,helpers,partials,data) {
  data.buffer.push("					<h5>No mapped attributes.</h5>\n");
  },"16":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					<div class=\"attribute-field-mapping\" style=\"padding-bottom:14px\">\n");
  stack1 = helpers.view.call(depth0, "elem-attribute", {"name":"view","hash":{
    'attribute': ("attr")
  },"hashTypes":{'attribute': "ID"},"hashContexts":{'attribute': depth0},"fn":this.program(17, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n");
  return buffer;
},"17":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("							<div class=\"attribute-name\">");
  stack1 = helpers._triageMustache.call(depth0, "view.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n							<span style=\"float:right\">\n								");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("attr"),
    'clicked': ("unmapAttribute")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n							</span>\n");
  return buffer;
},"19":function(depth0,helpers,partials,data) {
  data.buffer.push("					<h5>No required attributes.</h5>\n");
  },"21":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("			");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "item", "controller.scrapedItem", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","ID"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("\n");
  return buffer;
},"23":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				<div>\n");
  stack1 = helpers.view.call(depth0, "ignore-widget", {"name":"view","hash":{
    'ignore': ("ignore")
  },"hashTypes":{'ignore': "ID"},"hashContexts":{'ignore': depth0},"fn":this.program(24, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n				</div>\n");
  return buffer;
},"24":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("						<div class=\"ignore-widget\">\n							<label class=\"small-label\">Ignore elements beneath</label>\n							");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "check-box", {"name":"view","hash":{
    'name': ("ignoreBeneath"),
    'checked': ("ignore.ignoreBeneath")
  },"hashTypes":{'name': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n						</div>\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("ignore"),
    'clicked': ("deleteIgnore")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n");
  return buffer;
},"26":function(depth0,helpers,partials,data) {
  data.buffer.push("					<h5>No ignored subregions defined.</h5>\n");
  },"28":function(depth0,helpers,partials,data) {
  data.buffer.push("	Save changes\n");
  },"30":function(depth0,helpers,partials,data) {
  data.buffer.push("	Discard changes\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("\n<div style=\"text-align:center;margin:10px 0px 10px 0px\">\n	<h4>Annotation options</h4>\n</div>\n<div class=\"accordion\">\n	<h3>Selected region</h3>\n	<div>\n		<h4>Ancestors</h4>");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("selected_region_ancestors")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		<div class=\"scrolling-container\" style=\"max-height:180px;\">\n			<ul style=\"list-style-type:none;padding:0px;margin:0px\">\n");
  stack1 = helpers.each.call(depth0, "path", "in", "ancestorPaths", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</ul>\n		</div>\n		<br/>\n		<h4>Children</h4>");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("selected_region_children")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		<div class=\"scrolling-container\" style=\"max-height:180px;\">\n			<ul style=\"list-style-type:none;padding:0px;margin:0px\">\n");
  stack1 = helpers.each.call(depth0, "path", "in", "childPaths", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</ul>\n		</div>\n	</div>\n\n	<h3>Attribute mappings</h3>\n	<div>\n");
  stack1 = helpers.unless.call(depth0, "mappingAttribute", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(5, data),"inverse":this.program(21, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n\n	<h3>Ignored subregions</h3>\n	<div style=\"text-align:center\">\n		<div class=\"scrolling-container\">\n");
  stack1 = helpers.each.call(depth0, "ignore", "in", "model.ignores", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(23, data),"inverse":this.program(26, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n		<div style=\"margin-top:10px;\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "toggle-button", {"name":"view","hash":{
    'name': ("addIgnore"),
    'id': ("addIgnore"),
    'icon': ("ui-icon-cancel"),
    'checked': ("selectingIgnore")
  },"hashTypes":{'name': "STRING",'id': "STRING",'icon': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'id': depth0,'icon': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			<label for=\"addIgnore\">Ignore region</label>");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("ignored_subregions")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n	</div>\n\n	<h3>Variant</h3>\n	<div>\n		<div class=\"variantBox\" style=\"margin-right:20px\">\n			<label class=\"important-label\">Choose a variant:</label>\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "variant-select", {"name":"view","hash":{
    'annotation': ("model")
  },"hashTypes":{'annotation': "ID"},"hashContexts":{'annotation': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("variant")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n	</div>\n</div>\n<br/>\n<div style=\"text-align:center\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("primary"),
    'icon': ("fa fa-icon fa-check-circle"),
    'clicked': ("doneEditing")
  },"hashTypes":{'type': "STRING",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'icon': depth0,'clicked': depth0},"fn":this.program(28, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("danger"),
    'icon': ("fa fa-icon fa-times-circle"),
    'clicked': ("cancelEdit")
  },"hashTypes":{'type': "STRING",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'icon': depth0,'clicked': depth0},"fn":this.program(30, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>");
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox-conflicts"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("			<div style=\"margin:4px 0px 4px 0px\" class=\"pattern\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("light"),
    'clickedParam': ("name"),
    'clicked': ("displayConflictedFile")
  },"hashTypes":{'type': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'type': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(2, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n");
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					");
  stack1 = helpers._triageMustache.call(depth0, "name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("<div style=\"margin:10px 0px 0px 10px\">\n	<h4>Conflicted files</h4>\n	<div>\n");
  stack1 = helpers.each.call(depth0, "name", "in", "controller.conflictedFileNames", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox-empty"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  data.buffer.push("<div style=\"text-align:center;margin:10px 0px 10px 0px;\">\n	<h3 style='color:#555; font-size: 1.2em'>Portia Developer Preview</h2>\n</div>");
  },"useData":true});

Ember.TEMPLATES["toolbox-items"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "edit-item", {"name":"view","hash":{
    'item': ("item")
  },"hashTypes":{'item': "ID"},"hashContexts":{'item': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  data.buffer.push("		 		<h4>No items have been defined yet.</h4>\n");
  },"5":function(depth0,helpers,partials,data) {
  data.buffer.push("				Item\n");
  },"7":function(depth0,helpers,partials,data) {
  data.buffer.push("				Save changes\n");
  },"9":function(depth0,helpers,partials,data) {
  data.buffer.push("				Discard Changes\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("<div style=\"margin:10px 0px 0px 10px\">\n	<h4>Items</h4>\n	<div>\n		<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("full_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "item", "in", "model", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(3, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n		<div class=\"button-spacer\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'small': (true),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("addItem")
  },"hashTypes":{'small': "BOOLEAN",'type': "STRING",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'small': depth0,'type': depth0,'icon': depth0,'clicked': depth0},"fn":this.program(5, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'small': (true),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-save"),
    'size': ("sm"),
    'clicked': ("saveChanges")
  },"hashTypes":{'small': "BOOLEAN",'type': "STRING",'icon': "STRING",'size': "STRING",'clicked': "STRING"},"hashContexts":{'small': depth0,'type': depth0,'icon': depth0,'size': depth0,'clicked': depth0},"fn":this.program(7, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'small': (true),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-reply"),
    'size': ("sm"),
    'clicked': ("undoChanges")
  },"hashTypes":{'small': "BOOLEAN",'type': "STRING",'icon': "STRING",'size': "STRING",'clicked': "STRING"},"hashContexts":{'small': depth0,'type': depth0,'icon': depth0,'size': depth0,'clicked': depth0},"fn":this.program(9, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n	</div>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox-project"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers.view.call(depth0, "rename-text-field", {"name":"view","hash":{
    'value': ("name")
  },"hashTypes":{'value': "ID"},"hashContexts":{'value': depth0},"fn":this.program(2, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				<span class=\"editable-name\">Project ");
  stack1 = helpers._triageMustache.call(depth0, "name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n");
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("			<h4>Project ");
  stack1 = helpers._triageMustache.call(depth0, "name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</h4>\n");
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div class=\"row\">\n					<div class=\"col-xs-9 clickable-url\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("light"),
    'clickedParam': ("spider"),
    'clicked': ("editSpider")
  },"hashTypes":{'type': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'type': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(7, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n					<div class=\"col-xs-3 button-align\">\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("spider"),
    'size': ("sm"),
    'clicked': ("deleteSpider")
  },"hashTypes":{'type': "STRING",'icon': "STRING",'clickedParam': "ID",'size': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'icon': depth0,'clickedParam': depth0,'size': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</div>\n				</div>\n");
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("							");
  stack1 = helpers._triageMustache.call(depth0, "spider", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"9":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "controller.filterSpider", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(10, data),"inverse":this.program(12, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"10":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					<h4>No Spiders matching \"");
  stack1 = helpers._triageMustache.call(depth0, "controller.filterSpider", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\" found in this project.</h4>\n");
  return buffer;
},"12":function(depth0,helpers,partials,data) {
  data.buffer.push("					<h4>No spiders for this project.</h4>\n");
  },"14":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "controller.hasChanges", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(15, data),"inverse":this.program(20, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"15":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("			<div class=\"button-spacer\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("primary"),
    'icon': ("fa fa-icon fa-upload"),
    'size': ("sm"),
    'clicked': ("publishProject")
  },"hashTypes":{'type': "STRING",'icon': "STRING",'size': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'icon': depth0,'size': depth0,'clicked': depth0},"fn":this.program(16, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'size': ("sm"),
    'clicked': ("discardChanges")
  },"hashTypes":{'type': "STRING",'icon': "STRING",'size': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'icon': depth0,'size': depth0,'clicked': depth0},"fn":this.program(18, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n");
  return buffer;
},"16":function(depth0,helpers,partials,data) {
  data.buffer.push("					Publish changes\n");
  },"18":function(depth0,helpers,partials,data) {
  data.buffer.push("					Discard Changes\n");
  },"20":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  stack1 = ((helpers.ifHasCapability || (depth0 && depth0.ifHasCapability) || helperMissing).call(depth0, "deploy_projects", {"name":"ifHasCapability","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(21, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"21":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("				<div style=\"text-align:center;font-size:1.1em;margin-top:10px\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("controller.isDeploying"),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-upload"),
    'size': ("sm"),
    'clicked': ("deployProject")
  },"hashTypes":{'disabled': "ID",'type': "STRING",'icon': "STRING",'size': "STRING",'clicked': "STRING"},"hashContexts":{'disabled': depth0,'type': depth0,'icon': depth0,'size': depth0,'clicked': depth0},"fn":this.program(22, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("				</div>\n");
  return buffer;
},"22":function(depth0,helpers,partials,data) {
  data.buffer.push("						Deploy\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div style=\"margin:10px 0px 0px 10px\">\n	<div style=\"text-align:center;font-size:1.1em;margin-bottom:5px\">\n");
  stack1 = ((helpers.ifHasCapability || (depth0 && depth0.ifHasCapability) || helperMissing).call(depth0, "rename_projects", {"name":"ifHasCapability","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(4, data),"types":["STRING"],"contexts":[depth0],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n\n	<h4>Spiders</h4>\n	<div>\n		<div class=\"input-group col-xs-11\">\n			");
  data.buffer.push(escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, {"name":"input","hash":{
    'placeholder': ("Filter Spiders"),
    'class': ("form-control"),
    'value': ("filterSpider")
  },"hashTypes":{'placeholder': "STRING",'class': "STRING",'value': "ID"},"hashContexts":{'placeholder': depth0,'class': depth0,'value': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n			<div class=\"input-group-addon\"><span class=\"fa fa-search\"></span></div>\n		</div>\n		<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("full_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "spider", "in", "controller.filteredSpiders", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(6, data),"inverse":this.program(9, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n	</div>\n");
  stack1 = ((helpers.ifHasCapability || (depth0 && depth0.ifHasCapability) || helperMissing).call(depth0, "version_control", {"name":"ifHasCapability","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(14, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox-projects"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("			<div class=\"row\">\n");
  stack1 = ((helpers.ifHasCapability || (depth0 && depth0.ifHasCapability) || helperMissing).call(depth0, "delete_projects", {"name":"ifHasCapability","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(2, data),"inverse":this.program(5, data),"types":["STRING"],"contexts":[depth0],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n");
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<div class=\"col-xs-9 clickable-url\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("light"),
    'clickedParam': ("project"),
    'clicked': ("openProject")
  },"hashTypes":{'type': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'type': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(3, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n					<div class=\"col-xs-3\">\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("project"),
    'clicked': ("deleteProject")
  },"hashTypes":{'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</div>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("							");
  stack1 = helpers._triageMustache.call(depth0, "project", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("					<div class=\"col-xs-11 clickable-url full-size\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("light"),
    'clickedParam': ("project"),
    'clicked': ("openProject")
  },"hashTypes":{'type': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'type': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(3, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n");
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  data.buffer.push("			<h5>No projects have been created yet.</h5>\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div style=\"margin:10px 0px 0px 10px\">\n	<div style=\"margin-top:10px\"></div>\n	<h4>Open project</h4>\n	<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("full_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "project", "in", "model", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.program(7, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n</div>");
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox-spider"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("		<span class=\"editable-name\">Spider ");
  stack1 = helpers._triageMustache.call(depth0, "name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div class=\"row\">\n					<div class=\"col-xs-9 clickable-url\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'title': ("url"),
    'type': ("light"),
    'clickedParam': ("url"),
    'clicked': ("fetchPage")
  },"hashTypes":{'title': "ID",'type': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'title': depth0,'type': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(4, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n					<div class=\"col-xs-3 button-align\">\n						");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "copy-clipboard", {"name":"view","hash":{
    'text': ("url")
  },"hashTypes":{'text': "ID"},"hashContexts":{'text': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("url"),
    'clicked': ("deleteStartUrl")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</div>\n				</div>\n");
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("							");
  stack1 = helpers._triageMustache.call(depth0, "url", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  data.buffer.push("				<h5>No start pages for this spider.</h5>\n");
  },"8":function(depth0,helpers,partials,data) {
  data.buffer.push("					Add urls\n");
  },"10":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("			<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("ex_tiny_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n				<div style=\"margin-top:10px\"></div>\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "login-field", {"name":"view","hash":{
    'action': ("updateLoginInfo"),
    'placeholder': ("Login URL"),
    'name': ("loginUrlField"),
    'width': ("94%"),
    'value': ("loginUrl")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				<div style=\"margin-top:5px\"></div>\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "login-field", {"name":"view","hash":{
    'action': ("updateLoginInfo"),
    'placeholder': ("Login user"),
    'name': ("loginUserField"),
    'width': ("94%"),
    'value': ("loginUser")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				<div style=\"margin-top:5px\"></div>\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "login-field", {"name":"view","hash":{
    'action': ("updateLoginInfo"),
    'placeholder': ("Login password"),
    'name': ("loginPasswordField"),
    'width': ("94%"),
    'value': ("loginPassword")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			</div>\n");
  return buffer;
},"12":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("			<div style=\"margin-top:10px; margin-bottom: 10px\">\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "check-box", {"name":"view","hash":{
    'name': ("respectNoFollow"),
    'checked': ("respect_nofollow")
  },"hashTypes":{'name': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				<span class=\"important-label\">Respect nofollow</span>\n			</div>\n");
  return buffer;
},"14":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("			<h4>Follow links that match this patterns</h4>\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("follow_links")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("tiny_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "pattern", "in", "follow_patterns", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(15, data),"inverse":this.program(19, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n			<div style=\"margin-top:10px\"></div>\n			<div class=\"row\">\n				<div class=\"col-xs-10\">\n					");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "text-field", {"name":"view","hash":{
    'action': ("addFollowPattern"),
    'placeholder': ("New follow pattern"),
    'name': ("followPatternTextField"),
    'width': ("110%"),
    'value': ("newFollowPattern")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				</div>\n				<div class=\"col-xs-2 button-align-sm\">\n					");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("primary"),
    'disabled': ("hasFollowPattern"),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("addFollowPattern")
  },"hashTypes":{'size': "STRING",'type': "STRING",'disabled': "ID",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'disabled': depth0,'icon': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n				</div>\n			</div>\n\n			<div style=\"margin-top:10px\"></div>\n\n			<h4>Exclude links that match this patterns</h4>\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("exclude_links")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			<div class=\"scrolling-container\" style=\"max-height:100px\">\n");
  stack1 = helpers.each.call(depth0, "pattern", "in", "exclude_patterns", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(21, data),"inverse":this.program(23, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n			<div style=\"margin-top:10px\"></div>\n			<div class=\"row\">\n				<div class=\"col-xs-10\">\n					");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "text-field", {"name":"view","hash":{
    'action': ("addExcludePattern"),
    'placeholder': ("New exclude pattern"),
    'name': ("excludePatternTextField"),
    'width': ("110%"),
    'value': ("newExcludePattern")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				</div>\n				<div class=\"col-xs-2 button-align-sm\">\n					");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("primary"),
    'disabled': ("hasExcludePattern"),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("addExcludePattern")
  },"hashTypes":{'size': "STRING",'type': "STRING",'disabled': "ID",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'disabled': depth0,'icon': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n				</div>\n			</div>\n");
  return buffer;
},"15":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<div class=\"col-xs-12\">\n");
  stack1 = helpers.view.call(depth0, "pattern-text-field", {"name":"view","hash":{
    'action': ("editFollowPattern"),
    'pattern': ("pattern")
  },"hashTypes":{'action': "STRING",'pattern': "ID"},"hashContexts":{'action': depth0,'pattern': depth0},"fn":this.program(16, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("pattern"),
    'clicked': ("deleteFollowPattern")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</div>\n");
  return buffer;
},"16":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("light"),
    'title': ("pattern"),
    'class': ("pattern")
  },"hashTypes":{'type': "STRING",'title': "ID",'class': "STRING"},"hashContexts":{'type': depth0,'title': depth0,'class': depth0},"fn":this.program(17, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"17":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("								");
  stack1 = helpers._triageMustache.call(depth0, "pattern", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"19":function(depth0,helpers,partials,data) {
  data.buffer.push("					<div class=\"col-xs-12\">\n						<h5>No follow patterns defined yet.</h5>\n					</div>\n");
  },"21":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<div class=\"col-xs-12\">\n");
  stack1 = helpers.view.call(depth0, "pattern-text-field", {"name":"view","hash":{
    'action': ("editExcludePattern"),
    'pattern': ("pattern")
  },"hashTypes":{'action': "STRING",'pattern': "ID"},"hashContexts":{'action': depth0,'pattern': depth0},"fn":this.program(16, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("pattern"),
    'clicked': ("deleteExcludePattern")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</div>\n");
  return buffer;
},"23":function(depth0,helpers,partials,data) {
  data.buffer.push("					<div class=\"col-xs-12\">\n						<h5>No exclude patterns defined yet.</h5>\n					</div>\n");
  },"25":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div class=\"row\">\n					<div class=\"col-xs-9 clickable-url\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("light"),
    'title': ("url"),
    'clickedParam': ("templ"),
    'clicked': ("editTemplate")
  },"hashTypes":{'type': "STRING",'title': "ID",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'type': depth0,'title': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(26, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n					<div class=\"col-xs-3 button-align-sm\">\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("primary"),
    'icon': (" fa fa-icon fa-external-link"),
    'clickedParam': ("templ"),
    'clicked': ("viewTemplate")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'size': ("xs"),
    'type': ("danger"),
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("templ"),
    'clicked': ("deleteTemplate")
  },"hashTypes":{'size': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'size': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</div>\n				</div>\n");
  return buffer;
},"26":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("							");
  stack1 = helpers._triageMustache.call(depth0, "templ", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"28":function(depth0,helpers,partials,data) {
  data.buffer.push("				<h5>No templates exist for this spider yet.</h5>\n");
  },"30":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("			");
  stack1 = helpers._triageMustache.call(depth0, "controller.testButtonLabel", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("\n<div style=\"text-align:center;font-size:1.1em;margin:10px 0px 10px 0px\">\n");
  stack1 = helpers.view.call(depth0, "rename-text-field", {"name":"view","hash":{
    'value': ("name")
  },"hashTypes":{'value': "ID"},"hashContexts":{'value': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n\n<div class=\"accordion\">\n	<h3>Initialize</h3>\n	<div class=\"section\">\n		<div class=\"row\">\n			<div class=\"col-xs-10\">\n				<h4>Start Pages</h4>\n			</div>\n			<div class=\"col-xs-2 start-url-badge\">\n				");
  data.buffer.push(escapeExpression(((helpers['bs-badge'] || (depth0 && depth0['bs-badge']) || helperMissing).call(depth0, {"name":"bs-badge","hash":{
    'content': ("startUrlCount"),
    'class': ("pull-right btn-primary")
  },"hashTypes":{'content': "ID",'class': "STRING"},"hashContexts":{'content': depth0,'class': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n			</div>\n		</div>\n		<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("ex_tiny_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "url", "in", "start_urls", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(6, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n\n		<div style=\"margin-top:10px\">\n			<div>\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "text-area", {"name":"view","hash":{
    'max_height': ("300px"),
    'resize': ("vertical"),
    'action': ("addStartUrls"),
    'placeholder': ("Enter one or multiple start page urls here"),
    'name': ("startUrlTextField"),
    'width': ("93%"),
    'value': ("newStartUrl")
  },"hashTypes":{'max_height': "STRING",'resize': "STRING",'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'max_height': depth0,'resize': depth0,'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			</div>\n			<div style=\"margin-top:5px;text-align:center\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("primary"),
    'disabled': ("hasStartUrl"),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("addStartUrls")
  },"hashTypes":{'type': "STRING",'disabled': "ID",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'disabled': depth0,'icon': depth0,'clicked': depth0},"fn":this.program(8, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n		</div>\n\n		<div style=\"margin-top:20px\" class=\"scrolling-container\">\n			<label class=\"important-label\">Perform login</label>\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "check-box", {"name":"view","hash":{
    'name': ("performLoginCheck"),
    'checked': ("performLogin")
  },"hashTypes":{'name': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("perform_login")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n\n");
  stack1 = helpers['if'].call(depth0, "performLogin", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(10, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n\n	<h3>Crawling</h3>\n	<div class=\"section\">\n		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "follow-select", {"name":"view","hash":{
    'value': ("controller.links_to_follow")
  },"hashTypes":{'value': "ID"},"hashContexts":{'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n\n");
  stack1 = helpers['if'].call(depth0, "displayNofollow", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(12, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  stack1 = helpers['if'].call(depth0, "displayEditPatterns", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(14, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n		<div style=\"margin-top:10px\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "check-box", {"name":"view","hash":{
    'name': ("showLinks"),
    'checked': ("showLinks")
  },"hashTypes":{'name': "STRING",'checked': "ID"},"hashContexts":{'name': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			<span class=\"important-label\">Overlay blocked links</span>\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("overlay_blocked_links")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</div>\n	</div>\n\n	<h3>Extraction</h3>\n\n	<div class=\"section\">\n		<h4>Templates</h4>\n		<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("mid_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "templ", "in", "template_names", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(25, data),"inverse":this.program(28, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n	</div>\n</div>\n\n<div style=\"margin-top:10px;text-align:center\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'title': ("Tests the spider on every start URL."),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-check"),
    'clickedParam': (""),
    'clicked': ("testSpider")
  },"hashTypes":{'title': "STRING",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'title': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(30, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</a>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox-template"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("		<div class=\"editable-name\">Template ");
  stack1 = helpers._triageMustache.call(depth0, "name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("			<div style=\"height:10px\">\n				<span class=\"small-label\" style=\"float:left;margin-left:5px;margin-right:5px;width:120px;text-align:center\">Map attribute</span>\n				<span class=\"small-label\" style=\"float:left;width:120px;text-align:center\">To field</span>\n				<span class=\"small-label\" style=\"float:left;text-align:center;margin-left:10px\">Variant</span>\n			</div>\n			<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("mid_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "anno", "in", "annotations", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(4, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n");
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "annotation-widget", {"name":"view","hash":{
    'templateName': ("annotation-widget"),
    'annotation': ("anno")
  },"hashTypes":{'templateName': "STRING",'annotation': "ID"},"hashContexts":{'templateName': depth0,'annotation': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n");
  return buffer;
},"6":function(depth0,helpers,partials,data) {
  data.buffer.push("			<h5>No annotations have been created yet.</h5>\n");
  },"8":function(depth0,helpers,partials,data) {
  data.buffer.push("				Edit Items\n");
  },"10":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers.view.call(depth0, "extractor-drop-target", {"name":"view","hash":{
    'dragging': ("controller.draggingExtractor"),
    'fieldName': ("field.fieldName")
  },"hashTypes":{'dragging': "ID",'fieldName': "ID"},"hashContexts":{'dragging': depth0,'fieldName': depth0},"fn":this.program(11, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"11":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("					<div class=\"target-container\">\n						 <span class=\"target\"><b style=\"margin-right:10px\">");
  stack1 = helpers._triageMustache.call(depth0, "field.fieldName", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</b>[+Drop here]</span>\n");
  stack1 = helpers['if'].call(depth0, "field.extractors", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(12, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = helpers.each.call(depth0, "ext", "in", "field.extractors", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(14, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n");
  return buffer;
},"12":function(depth0,helpers,partials,data) {
  data.buffer.push("							<div style=\"margin-top:10px\"></div>\n");
  },"14":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("							<div style=\"margin:4px 0px 4px 0px\">\n");
  stack1 = helpers.view.call(depth0, "extractor", {"name":"view","hash":{
    'extractor': ("ext")
  },"hashTypes":{'extractor': "ID"},"hashContexts":{'extractor': depth0},"fn":this.program(15, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("							</div>\n");
  return buffer;
},"15":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("									<span>\n										");
  stack1 = helpers._triageMustache.call(depth0, "view.extractorTypeLabel", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(" ");
  stack1 = helpers._triageMustache.call(depth0, "view.extractorDefinition", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n									</span>\n");
  return buffer;
},"17":function(depth0,helpers,partials,data) {
  data.buffer.push("				<h5>No field mappings have been defined yet.</h5>\n");
  },"19":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div style=\"margin:4px 0px 4px 0px\">\n");
  stack1 = helpers.view.call(depth0, "extractor", {"name":"view","hash":{
    'extractor': ("ext")
  },"hashTypes":{'extractor': "ID"},"hashContexts":{'extractor': depth0},"fn":this.program(20, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'icon': ("fa fa-icon fa-trash"),
    'clickedParam': ("ext"),
    'size': ("xs"),
    'type': ("danger"),
    'clicked': ("deleteExtractor")
  },"hashTypes":{'icon': "STRING",'clickedParam': "ID",'size': "STRING",'type': "STRING",'clicked': "STRING"},"hashContexts":{'icon': depth0,'clickedParam': depth0,'size': depth0,'type': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n				</div>\n");
  return buffer;
},"20":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("						<span>\n							");
  stack1 = helpers._triageMustache.call(depth0, "view.extractorTypeLabel", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(" ");
  stack1 = helpers._triageMustache.call(depth0, "view.extractorDefinition", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n						</span>\n");
  return buffer;
},"22":function(depth0,helpers,partials,data) {
  data.buffer.push("				<h5>No extractors have been created yet.</h5>\n");
  },"24":function(depth0,helpers,partials,data) {
  data.buffer.push("					New extractor\n");
  },"26":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("					<div class=\"row\">\n						<div class=\"col-xs-5 top-div\">\n							<div class=\"field-name\">\n								<span class=\"important-label\">");
  stack1 = helpers._triageMustache.call(depth0, "field.fieldName", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n							</div>\n						</div>\n						<div class=\"col-xs-3\">");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "required-field-checkbox", {"name":"view","hash":{
    'disabled': ("field.disabled"),
    'fieldName': ("field.fieldName"),
    'checked': ("field.required")
  },"hashTypes":{'disabled': "ID",'fieldName': "ID",'checked': "ID"},"hashContexts":{'disabled': depth0,'fieldName': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("</div>\n						<div class=\"col-xs-3\">");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "required-field-checkbox", {"name":"view","hash":{
    'disabled': (true),
    'fieldName': ("extracted"),
    'checked': ("field.extracted")
  },"hashTypes":{'disabled': "BOOLEAN",'fieldName': "STRING",'checked': "ID"},"hashContexts":{'disabled': depth0,'fieldName': depth0,'checked': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("</div>\n					</div>\n");
  return buffer;
},"28":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("	");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "annotation-widget", {"name":"view","hash":{
    'id': ("annotationWidget"),
    'templateName': ("floating-annotation-widget"),
    'pos': ("controller.showFloatingAnnotationWidgetAt"),
    'inDoc': (true),
    'annotation': ("controller.floatingAnnotation")
  },"hashTypes":{'id': "STRING",'templateName': "STRING",'pos': "ID",'inDoc': "BOOLEAN",'annotation': "ID"},"hashContexts":{'id': depth0,'templateName': depth0,'pos': depth0,'inDoc': depth0,'annotation': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("<div style=\"text-align:center;font-size:1.1em;margin:10px 0px 10px 0px\">\n");
  stack1 = helpers.view.call(depth0, "rename-text-field", {"name":"view","hash":{
    'value': ("name")
  },"hashTypes":{'value': "ID"},"hashContexts":{'value': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</div>\n\n<div class=\"accordion\">\n	<h3>Annotations</h3>\n	<div class=\"section\">\n");
  stack1 = helpers['if'].call(depth0, "annotations", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.program(6, data),"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n\n	<h3>Extracted item</h3>\n	<div class=\"section\" style=\"text-align:center;\">\n		<label class=\"small-label\">Extracted item type:</label> ");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "item-select", {"name":"view","hash":{
    'value': ("scrapes")
  },"hashTypes":{'value': "ID"},"hashContexts":{'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("select_item")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		<div style=\"margin-top:10px\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("primary"),
    'clicked': ("editItems")
  },"hashTypes":{'type': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'clicked': depth0},"fn":this.program(8, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n	</div>\n\n	<h3>Extractors</h3>\n	<div class=\"section\" style=\"text-align:center;\">\n		<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("tiny_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n");
  stack1 = helpers.each.call(depth0, "field", "in", "mappedFieldsData", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(10, data),"inverse":this.program(17, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n		<div style=\"margin-top:10px\"></div>\n		<h4>Drag extractors to the fields above</h4>\n		");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("extractors")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		<div class=\"scrolling-container ui-corner-all\" style=\"max-height:100px;\">\n");
  stack1 = helpers.each.call(depth0, "ext", "in", "extractors", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(19, data),"inverse":this.program(22, data),"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n		<div class=\"create-extractor-container\">\n			<div style=\"float:left;width:53%;\">\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "text-field", {"name":"view","hash":{
    'action': ("createExtractor"),
    'placeholder': ("Enter a RegEx"),
    'name': ("reExtractorField"),
    'width': ("160px"),
    'value': ("newReExtractor")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				<div class=\"small-label\" style=\"margin:5px 0px 5px 0px\">- or choose a type -</div>\n				<div class=\"typeBox\">");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "type-select", {"name":"view","hash":{
    'width': ("140px"),
    'name': ("typeExtractorCombo"),
    'value': ("newTypeExtractor")
  },"hashTypes":{'width': "STRING",'name': "STRING",'value': "ID"},"hashContexts":{'width': depth0,'name': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("</div>\n			</div>\n			<div style=\"float:left;width:40%;margin-top: 23px\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'type': ("primary"),
    'disabled': ("createExtractorDisabled"),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("createExtractor")
  },"hashTypes":{'type': "STRING",'disabled': "ID",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'type': depth0,'disabled': depth0,'icon': depth0,'clicked': depth0},"fn":this.program(24, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n		</div>\n\n	</div>\n	<h3>Extracted fields</h3>\n	<div class=\"section\">\n		<span style=\"float:right\">");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "inline-help", {"name":"view","hash":{
    'message': ("template_required")
  },"hashTypes":{'message': "STRING"},"hashContexts":{'message': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("</span>\n		<h4 style=\"width:92%\">Check the fields you want to make required for this template:</h4>\n		<div class=\"scrolling-container\" ");
  data.buffer.push(escapeExpression(helpers['bind-attr'].call(depth0, {"name":"bind-attr","hash":{
    'style': ("mid_box_style")
  },"hashTypes":{'style': "STRING"},"hashContexts":{'style': depth0},"types":[],"contexts":[],"data":data})));
  data.buffer.push(">\n			<div style=\"margin:15px auto;width: 100%;\">\n				<div class=\"row important-label\">\n					<div class=\"col-xs-5\">Name</div><div class=\"col-xs-3\">Required</div><div class=\"col-xs-3\">Extracted</div>\n				</div>\n");
  stack1 = helpers.each.call(depth0, "field", "in", "mappedFieldsData", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(26, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n		</div>\n	</div>\n</div>\n\n");
  stack1 = helpers['if'].call(depth0, "controller.showFloatingAnnotationWidgetAt", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(28, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"useData":true});

Ember.TEMPLATES["toolbox"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div style=\"position:absolute;height:100%;width:100%;z-index:10\">\n	<div class=\"container\" style=\"height:100%;width:400px;\">\n		<div class=\"bar\">\n			<div style=\"position:absolute;left:8px;top:45%\">\n				<img src=\"images/toolbox_show.png\">\n			</div>\n		</div>\n		<span style=\"float:left;margin:0px 5px 0px -35px\">\n			");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "pin-tool-box-button", {"name":"view","hash":{
    'class': ("textless-button pin-button"),
    'action': ("editAnnotation")
  },"hashTypes":{'class': "STRING",'action': "STRING"},"hashContexts":{'class': depth0,'action': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n		</span>\n		<div style=\"padding-top:10px;margin-left:40px;padding-right:2px\">\n			");
  stack1 = helpers._triageMustache.call(depth0, "yield", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n		</div>\n	</div>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["topbar-browse"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				");
  stack1 = helpers._triageMustache.call(depth0, "controller.currentUrl", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'small': (true),
    'clicked': ("addTemplate"),
    'type': ("danger")
  },"hashTypes":{'small': "BOOLEAN",'clicked': "STRING",'type': "STRING"},"hashContexts":{'small': depth0,'clicked': depth0,'type': depth0},"fn":this.program(4, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  data.buffer.push("				Annotate this page\n");
  },"6":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'small': (true),
    'type': ("black"),
    'clicked': ("toggleShowItems")
  },"hashTypes":{'small': "BOOLEAN",'type': "STRING",'clicked': "STRING"},"hashContexts":{'small': depth0,'type': depth0,'clicked': depth0},"fn":this.program(7, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				");
  stack1 = helpers._triageMustache.call(depth0, "itemsButtonLabel", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"9":function(depth0,helpers,partials,data) {
  data.buffer.push("			<span class=\"small-label\">\n				No items extracted\n			</span>\n");
  },"11":function(depth0,helpers,partials,data) {
  data.buffer.push("			<span class=\"small-label red-label\">\n				Saving spider...\n			</span>\n");
  },"13":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  stack1 = helpers['if'].call(depth0, "controller.extractedItems.length", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(14, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"14":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("				<div class=\"extracted-items-container\">\n					<span style=\"float:right\">\n						");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'icon': ("fa fa-icon fa-close"),
    'type': ("default"),
    'clicked': ("toggleShowItems")
  },"hashTypes":{'icon': "STRING",'type': "STRING",'clicked': "STRING"},"hashContexts":{'icon': depth0,'type': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n					</span>\n					<h3 style=\"text-align:center\" class=\"important-label\">Displaying ");
  stack1 = helpers._triageMustache.call(depth0, "controller.extractedItems.length", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(" extracted items</h3>\n					<div style=\"max-height:500px; padding:8px;\" class=\"scrolling-container\">\n");
  stack1 = helpers.each.call(depth0, "item", "in", "controller.extractedItems", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(15, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("					</div>\n				</div>\n");
  return buffer;
},"15":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("							<hr style=\"margin:0px;background-color:rgba(70,70,70,1)\"/>\n							<div style=\"padding:10px 0px 10px 0px; border-bottom: 1px groove rgba(255,255,255,0.2);\">\n");
  stack1 = helpers.view.call(depth0, "extracted-item", {"name":"view","hash":{
    'extractedItem': ("item")
  },"hashTypes":{'extractedItem': "ID"},"hashContexts":{'extractedItem': depth0},"fn":this.program(16, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("							</div>\n");
  return buffer;
},"16":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("									<div style=\"text-align:left;margin-bottom:5px;\">\n										<div style=\"margin-bottom:2px\">\n											<span class=\"small-label yellow-label\">URL:</span>\n											<span class=\"link\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "fetchPage", "view.url", {"name":"action","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","ID"],"contexts":[depth0,depth0],"data":data})));
  data.buffer.push(">\n												");
  data.buffer.push(escapeExpression(((helpers.trim || (depth0 && depth0.trim) || helperMissing).call(depth0, "view.url", 45, {"name":"trim","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID","NUMBER"],"contexts":[depth0,depth0],"data":data}))));
  data.buffer.push("\n											</span>\n										</div>\n										<div>\n											<span class=\"small-label yellow-label\">Matched template:</span>\n											<span class=\"link\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "editTemplate", "view.matchedTemplate", {"name":"action","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING","ID"],"contexts":[depth0,depth0],"data":data})));
  data.buffer.push(">\n												");
  stack1 = helpers._triageMustache.call(depth0, "view.matchedTemplate", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n											</span>\n										</div>\n									</div>\n");
  stack1 = helpers.each.call(depth0, "textField", "in", "view.textFields", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(17, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = helpers.each.call(depth0, "imageField", "in", "view.imageFields", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(20, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = helpers['if'].call(depth0, "view.variants", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(23, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"17":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("										<div style=\"margin-bottom:2px\">\n											<span class=\"small-label blue-label\">");
  stack1 = helpers._triageMustache.call(depth0, "textField.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(":</span>\n");
  stack1 = helpers.each.call(depth0, "value", "in", "textField.value", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(18, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("										</div>\n");
  return buffer;
},"18":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("												<span style=\"color:white;word-wrap:break-word;\">\n													");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "collapsible-text", {"name":"view","hash":{
    'fullText': ("value")
  },"hashTypes":{'fullText': "ID"},"hashContexts":{'fullText': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n												</span>\n");
  return buffer;
},"20":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("										<div style=\"margin-bottom:2px\">\n											<span class=\"small-label blue-label\">");
  stack1 = helpers._triageMustache.call(depth0, "imageField.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(":</span>\n");
  stack1 = helpers.each.call(depth0, "value", "in", "imageField.value", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(21, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("										</div>\n");
  return buffer;
},"21":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("												<span style=\"color:white;word-wrap:break-word;\">");
  stack1 = helpers._triageMustache.call(depth0, "value", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</span>\n												<div style=\"margin:10px;text-align:center\">");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "image", {"name":"view","hash":{
    'width': ("200px"),
    'src': ("value")
  },"hashTypes":{'width': "STRING",'src': "ID"},"hashContexts":{'width': depth0,'src': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("</div>\n");
  return buffer;
},"23":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("										<h3 class=\"important-label\" style=\"margin:3px 0px 2px 0px\">Variants</h3>\n");
  stack1 = helpers.each.call(depth0, "variant", "in", "view.variants", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(24, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"24":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("											<div style=\"margin-bottom:3px\">\n");
  stack1 = helpers.each.call(depth0, "field", "in", "variant.fields", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(25, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("											</div>\n");
  return buffer;
},"25":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("													<div style=\"margin-bottom:2px\">\n														<span class=\"small-label green-label\">");
  stack1 = helpers._triageMustache.call(depth0, "field.name", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push(":</span>\n");
  stack1 = helpers.each.call(depth0, "value", "in", "field.value", {"name":"each","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(26, data),"inverse":this.noop,"types":["ID","ID","ID"],"contexts":[depth0,depth0,depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("													</div>\n");
  return buffer;
},"26":function(depth0,helpers,partials,data) {
  var escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("															<span style=\"color:white;word-wrap:break-word;\">\n																");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "collapsible-text", {"name":"view","hash":{
    'fullText': ("value")
  },"hashTypes":{'fullText': "ID"},"hashContexts":{'fullText': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n															</span>\n");
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div id=\"topbar\" class=\"navbar navbar-default\">\n	<div class=\"nav-container\">\n		");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "navigation", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n	</div>\n\n	<div class=\"nav-container button-align\">\n		<span style=\"float:left\">\n			");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("browseBackDisabled"),
    'small': (true),
    'icon': ("fa fa-icon fa-arrow-left"),
    'clicked': ("browseBack")
  },"hashTypes":{'disabled': "ID",'small': "BOOLEAN",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'disabled': depth0,'small': depth0,'icon': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n		</span>\n		<span style=\"float:left\">\n			");
  data.buffer.push(escapeExpression(((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("reloadDisabled"),
    'small': (true),
    'icon': ("fa fa-icon fa-refresh"),
    'clicked': ("reload")
  },"hashTypes":{'disabled': "ID",'small': "BOOLEAN",'icon': "STRING",'clicked': "STRING"},"hashContexts":{'disabled': depth0,'small': depth0,'icon': depth0,'clicked': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n		</span>\n\n		<span class=\"url\">\n");
  stack1 = helpers.view.call(depth0, "label-with-tooltip", {"name":"view","hash":{
    'title': ("controller.currentUrl")
  },"hashTypes":{'title': "ID"},"hashContexts":{'title': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</span>\n	</div>\n\n	<div class=\"nav-container button-align white-text\">\n");
  stack1 = helpers.unless.call(depth0, "addTemplateDisabled", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  stack1 = helpers.unless.call(depth0, "showItemsDisabled", {"name":"unless","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(6, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  stack1 = helpers['if'].call(depth0, "showNoItemsExtracted", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(9, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  stack1 = helpers['if'].call(depth0, "saving", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(11, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n	<span class=\"pull-right\" style=\"margin-top: 6px;\">\n		 ");
  data.buffer.push(escapeExpression(((helpers['bs-label'] || (depth0 && depth0['bs-label']) || helperMissing).call(depth0, {"name":"bs-label","hash":{
    'type': ("danger"),
    'content': ("Beta")
  },"hashTypes":{'type': "STRING",'content': "STRING"},"hashContexts":{'type': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</span>\n\n");
  stack1 = helpers['if'].call(depth0, "showItems", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(13, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["topbar-conflicts"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  data.buffer.push("			Save File\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div id=\"topbar\" class=\"navbar navbar-default\">\n	<div class=\"nav-container\">\n		");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "navigation", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n	</div>\n	<div style=\"float:left;margin-top:2px\" class=\"nav-container\">\n		<span style=\"margin-right:10px\">Resolving <b>");
  stack1 = helpers._triageMustache.call(depth0, "controller.currentFileName", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("</b></span>\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("controller.saveDisabled"),
    'type': ("primary"),
    'icon': ("fa fa-icon fa-upload"),
    'clickedParam': ("controller.currentFileName"),
    'clicked': ("saveFile")
  },"hashTypes":{'disabled': "ID",'type': "STRING",'icon': "STRING",'clickedParam': "ID",'clicked': "STRING"},"hashContexts":{'disabled': depth0,'type': depth0,'icon': depth0,'clickedParam': depth0,'clicked': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("	</div>\n	<span class=\"pull-right\" style=\"margin-top: 6px;\">\n		");
  data.buffer.push(escapeExpression(((helpers['bs-label'] || (depth0 && depth0['bs-label']) || helperMissing).call(depth0, {"name":"bs-label","hash":{
    'type': ("danger"),
    'content': ("Beta")
  },"hashTypes":{'type': "STRING",'content': "STRING"},"hashContexts":{'type': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</span>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["topbar-empty"] = Ember.Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div id=\"topbar\" class=\"navbar navbar-default\">\n	<div class=\"nav-container\">\n		");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "navigation", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n	</div>\n	<span class=\"pull-right\" style=\"margin-top: 6px;\">\n		");
  data.buffer.push(escapeExpression(((helpers['bs-label'] || (depth0 && depth0['bs-label']) || helperMissing).call(depth0, {"name":"bs-label","hash":{
    'type': ("danger"),
    'content': ("Beta")
  },"hashTypes":{'type': "STRING",'content': "STRING"},"hashContexts":{'type': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</span>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["topbar-extraction"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = '';
  data.buffer.push("				");
  stack1 = helpers._triageMustache.call(depth0, "controller.url", {"name":"_triageMustache","hash":{},"hashTypes":{},"hashContexts":{},"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("\n");
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'clicked': ("continueBrowsing"),
    'small': (true),
    'type': ("primary")
  },"hashTypes":{'clicked': "STRING",'small': "BOOLEAN",'type': "STRING"},"hashContexts":{'clicked': depth0,'small': depth0,'type': depth0},"fn":this.program(4, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  data.buffer.push("					Continue Browsing\n");
  },"6":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = '';
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'class': ("fa fa-icon fa-file-code-o togglecss"),
    'clicked': ("toggleCSS"),
    'size': ("sm")
  },"hashTypes":{'class': "STRING",'clicked': "STRING",'size': "STRING"},"hashContexts":{'class': depth0,'clicked': depth0,'size': depth0},"fn":this.program(7, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  data.buffer.push("					CSS\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div id=\"topbar\" class=\"navbar navbar-default\">\n	<div class=\"nav-container\">\n		");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "navigation", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n	</div>\n	<div class=\"nav-container\">\n		<span class=\"url\">\n");
  stack1 = helpers.view.call(depth0, "label-with-tooltip", {"name":"view","hash":{
    'title': ("controller.url")
  },"hashTypes":{'title': "ID"},"hashContexts":{'title': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</span>\n	</div>\n	<div class=\"nav-container\">\n		<span>\n");
  stack1 = helpers['if'].call(depth0, "showContinueBrowsing", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(3, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  stack1 = helpers['if'].call(depth0, "showToggleCSS", {"name":"if","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(6, data),"inverse":this.noop,"types":["ID"],"contexts":[depth0],"data":data});
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</span>\n	</div>\n	<span class=\"pull-right\" style=\"margin-top: 6px;\">\n		");
  data.buffer.push(escapeExpression(((helpers['bs-label'] || (depth0 && depth0['bs-label']) || helperMissing).call(depth0, {"name":"bs-label","hash":{
    'type': ("danger"),
    'content': ("Beta")
  },"hashTypes":{'type': "STRING",'content': "STRING"},"hashContexts":{'type': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</span>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["topbar-project"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  data.buffer.push("					New Spider\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div id=\"topbar\" class=\"navbar navbar-default\">\n	<div class=\"nav-container\">\n		");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "navigation", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n	</div>\n	<div  class=\"nav-container\">\n		<div class=\"row\">\n			<div class=\"col-xs-8\">\n				");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "text-field", {"name":"view","hash":{
    'action': ("addSpider"),
    'placeholder': ("Enter page url"),
    'name': ("spiderPageTextField"),
    'value': ("spiderPage"),
    'width': ("105%")
  },"hashTypes":{'action': "STRING",'placeholder': "STRING",'name': "STRING",'value': "ID",'width': "STRING"},"hashContexts":{'action': depth0,'placeholder': depth0,'name': depth0,'value': depth0,'width': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n			</div>\n			<div class=\"col-xs-2\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("createSpiderDisabled"),
    'small': (true),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("addSpider"),
    'small': (true),
    'type': ("info")
  },"hashTypes":{'disabled': "ID",'small': "BOOLEAN",'icon': "STRING",'clicked': "STRING",'small': "BOOLEAN",'type': "STRING"},"hashContexts":{'disabled': depth0,'small': depth0,'icon': depth0,'clicked': depth0,'small': depth0,'type': depth0},"fn":this.program(1, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("			</div>\n		</div>\n	</div>\n	<span class=\"pull-right\" style=\"margin-top: 6px;\">\n		");
  data.buffer.push(escapeExpression(((helpers['bs-label'] || (depth0 && depth0['bs-label']) || helperMissing).call(depth0, {"name":"bs-label","hash":{
    'type': ("danger"),
    'content': ("Beta")
  },"hashTypes":{'type': "STRING",'content': "STRING"},"hashContexts":{'type': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</span>\n</div>\n");
  return buffer;
},"useData":true});

Ember.TEMPLATES["topbar-projects"] = Ember.Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = '';
  data.buffer.push("				<div class=\"col-xs-8\">\n					");
  data.buffer.push(escapeExpression(helpers.view.call(depth0, "text-field", {"name":"view","hash":{
    'id': ("projectSiteTextField"),
    'action': ("createProject"),
    'placeholder': ("Enter site url"),
    'name': ("projectSiteTextField"),
    'width': ("105%"),
    'value': ("projectSite")
  },"hashTypes":{'id': "STRING",'action': "STRING",'placeholder': "STRING",'name': "STRING",'width': "STRING",'value': "ID"},"hashContexts":{'id': depth0,'action': depth0,'placeholder': depth0,'name': depth0,'width': depth0,'value': depth0},"types":["STRING"],"contexts":[depth0],"data":data})));
  data.buffer.push("\n				</div>\n				<div class=\"col-xs-2\">\n");
  stack1 = ((helpers['bs-button'] || (depth0 && depth0['bs-button']) || helperMissing).call(depth0, {"name":"bs-button","hash":{
    'disabled': ("createProjectDisabled"),
    'small': (true),
    'icon': ("fa fa-icon fa-plus"),
    'clicked': ("createProject"),
    'small': (true),
    'type': ("info")
  },"hashTypes":{'disabled': "ID",'small': "BOOLEAN",'icon': "STRING",'clicked': "STRING",'small': "BOOLEAN",'type': "STRING"},"hashContexts":{'disabled': depth0,'small': depth0,'icon': depth0,'clicked': depth0,'small': depth0,'type': depth0},"fn":this.program(2, data),"inverse":this.noop,"types":[],"contexts":[],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("				</div>\n");
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  data.buffer.push("						Start\n");
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = '';
  data.buffer.push("<div id=\"topbar\" class=\"navbar navbar-default\">\n	<div class=\"nav-container\">\n		");
  data.buffer.push(escapeExpression(((helpers.render || (depth0 && depth0.render) || helperMissing).call(depth0, "navigation", {"name":"render","hash":{},"hashTypes":{},"hashContexts":{},"types":["STRING"],"contexts":[depth0],"data":data}))));
  data.buffer.push("\n	</div>\n	<div style=\"float:left;margin-top:2px\" class=\"nav-container\">\n		<div class=\"row\">\n");
  stack1 = ((helpers.ifHasCapability || (depth0 && depth0.ifHasCapability) || helperMissing).call(depth0, "create_projects", {"name":"ifHasCapability","hash":{},"hashTypes":{},"hashContexts":{},"fn":this.program(1, data),"inverse":this.noop,"types":["STRING"],"contexts":[depth0],"data":data}));
  if (stack1 != null) { data.buffer.push(stack1); }
  data.buffer.push("		</div>\n	</div>\n	<span class=\"pull-right\" style=\"margin-top: 6px;\">\n		");
  data.buffer.push(escapeExpression(((helpers['bs-label'] || (depth0 && depth0['bs-label']) || helperMissing).call(depth0, {"name":"bs-label","hash":{
    'type': ("danger"),
    'content': ("Beta")
  },"hashTypes":{'type': "STRING",'content': "STRING"},"hashContexts":{'type': depth0,'content': depth0},"types":[],"contexts":[],"data":data}))));
  data.buffer.push("\n	</span>\n</div>\n");
  return buffer;
},"useData":true});