/*************************** Application **************************/ 

ASTool = Em.Application.create({
	LOG_TRANSITIONS: true, 
	ready: function(){
		ASTool.api = ASTool.SlydApi.create();
	} 
});


ASTool.slydUrl = 'http://localhost:9001/api/';
