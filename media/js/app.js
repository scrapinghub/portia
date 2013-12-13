/*************************** Application **************************/ 

ASTool = Em.Application.create({
	LOG_TRANSITIONS: true, 
	ready: function(){
		ASTool.api = ASTool.SlydApi.create();
	} 
});


ASTool.slydUrl = 'http://localhost:9001/api/';


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