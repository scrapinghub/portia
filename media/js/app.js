/*************************** Application **************************/ 
ASTool = Em.Application.create({
	LOG_TRANSITIONS: true, 
	ready: function(){

	} 
});


var SLYD_URL = 'http://localhost:9001/api/';


Ember.Application.initializer({
 	name: 'slydApiInitializer',
  
	initialize: function(container, application) {
    	container.register('api:slyd', ASTool.SlydApi);
    	application.inject('route', 'slyd', 'api:slyd');
    	application.inject('adapter', 'slyd', 'api:slyd');
    	application.inject('controller', 'slyd', 'api:slyd');
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

ASTool.guid = guid;