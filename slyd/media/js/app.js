/*************************** Application **************************/ 
ASTool = Em.Application.create({
     LOG_TRANSITIONS: true, 

    ready: function() {  }
});


// Leave 'null' for using window.location. Define it to override.
var SLYD_URL = null;


(function getServerCapabilities(app) {
    app.deferReadiness();
    var hash = {};
    hash.type = 'GET';
    hash.url = (SLYD_URL || window.location.protocol + '//' +
        window.location.host) + '/server_capabilities';
    ic.ajax(hash).then(function(capabilities) {
        this.set('serverCapabilities', capabilities);
        this.advanceReadiness();
    }.bind(app));
})(ASTool);


Ember.Application.initializer({
 	name: 'slydApiInitializer',
  
	initialize: function(container, application) {
    	container.register('api:slyd', ASTool.SlydApi);
    	application.inject('route', 'slyd', 'api:slyd');
    	application.inject('adapter', 'slyd', 'api:slyd');
    	application.inject('controller', 'slyd', 'api:slyd');
  	}
});


Ember.Application.initializer({
 	name: 'documentViewInitializer',
  
	initialize: function(container, application) {
    	container.register('document:view', ASTool.DocumentView);
    	application.inject('controller', 'documentView', 'document:view');
  	}
});


Ember.Application.initializer({
 	name: 'annotationsStoreInitializer',
  
	initialize: function(container, application) {
    	container.register('annotations:store', ASTool.AnnotationsStore);
    	application.inject('route', 'annotationsStore', 'annotations:store');
    	application.inject('controller', 'annotationsStore', 'annotations:store');
  	}
});


function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
};


function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}


function shortGuid() {
	return s4() + '-' + s4() + '-' + s4();
}

function toType(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}


ASTool.guid = guid;
ASTool.shortGuid = shortGuid;
