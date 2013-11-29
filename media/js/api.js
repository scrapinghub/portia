ASTool.SlydApi = Em.Object.extend({

	baseUrl: 'http://localhost:9001/api/',

	// FIXME: hardcoded 'test' project.
	project: 'test',

	getSpiderNames: function(onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.success = function(projectData) {
			var spiders = projectData['spiders'];
			onSuccess(Object.keys(spiders));
		};
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec';
		$.ajax(hash);
	},

	loadSpiders: function(onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.success = function(projectData) {
			onSuccess(projectData['spiders']);
		};
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec';
		$.ajax(hash);
	},

	loadSpider: function(spiderName, onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.success = function(spiderData) {
			spiderData['id'] = spiderName;		
			spiderData['templates'] = spiderData['templates'].map(function(template) {
				template['id'] = guid();
				return template;
			});
			onSuccess(spiderData);
		};
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec/spiders/' + spiderName;
		$.ajax(hash);
	},

	saveSpider: function(spiderName, spiderData, onSuccess, onError) {
		hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(spiderData);
		hash.success = onSuccess;
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec/spiders/' + spiderName;
		$.ajax(hash);
	},

	fetchDocument: function(pageUrl, spiderName, onSuccess, onError) {
		hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify({spider: spiderName,
									request: {url: pageUrl}});
		hash.success = function(data) {
			onSuccess(data);	
		}
		hash.error = function(req, status, error) {
			onError(error);
		};
		// FIXME: hardcode dummy 'test' project
		hash.url = this.baseUrl + this.project + '/bot/fetch';
		$.ajax(hash);
	},

});