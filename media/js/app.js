/*************************** Application **************************/ 

ASTool = Em.Application.create({
	ready: function(){
	} 
});

ASTool.ApplicationAdapter = DS.RESTAdapter.extend({
	host: 'http://localhost:9001',
});
