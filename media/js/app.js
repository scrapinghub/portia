/*************************** Application **************************/ 

ASTool = Em.Application.create({
	LOG_TRANSITIONS: true, 
	ready: function(){
		ASTool.api = ASTool.SlydApi.create();
	} 
});


ASTool.ApplicationAdapter = DS.RESTAdapter.extend({
	host: 'http://localhost:9001',
});
