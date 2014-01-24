ASTool.SlydApi = Em.Object.extend({

	project: null,

	apiUrl: function() {
		return SLYD_URL || window.location.protocol + '//' + window.location.host + '/projects';
	}.property(),

	projectSpecUrl: function() {
		return this.get('apiUrl') + '/' + this.project + '/spec/';
	}.property('project'),

	botUrl: function() {
		return this.get('apiUrl') + '/' + this.project + '/bot/';
	}.property('project'),

	getProjectNames: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('apiUrl');
		return ic.ajax(hash);
	},

	createProject: function(projectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = this.get('apiUrl');
		hash.data = JSON.stringify({ cmd: 'create', args: [projectName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	deleteProject: function(projectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = this.get('apiUrl');
		hash.data = JSON.stringify({ cmd: 'rm', args: [projectName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	renameProject: function(oldProjectName, newProjectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = this.get('apiUrl');
		hash.data = JSON.stringify({ cmd: 'mv', args: [oldProjectName, newProjectName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	getSpiderNames: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'spiders';
		return ic.ajax(hash);
	},

	loadSpiders: function(onSuccess, onError) {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl');
		ic.ajax(hash).then(function(projectData){
			return projectData['spiders'];
		});
	},

	loadSpider: function(spiderName) {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'spiders/' + spiderName;
		return ic.ajax(hash).then(function(spiderData) {
			spiderData['id'] = spiderName;		
			spiderData['templates'] = spiderData['templates'].map(function(template) {
				template['id'] = ASTool.guid();
				return template;
			});
			return spiderData;
		});
	},

	renameSpider: function(oldSpiderName, newSpiderName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = this.get('projectSpecUrl') + 'spiders';
		hash.data = JSON.stringify({ cmd: 'mv', args: [oldSpiderName, newSpiderName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	deleteSpider: function(spiderName) {
		var hash = {};
		hash.type = 'POST';
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'spiders';
		hash.data = JSON.stringify({ cmd: 'rm', args: [spiderName] });
		return ic.ajax(hash);
	},

	loadItems: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'items';
		return ic.ajax(hash).then(function(items) {
			items = this.dictToList(items, ASTool.Item);
			items.forEach(function(item) {
				if (item.fields) {
					item.fields = this.dictToList(item.fields, ASTool.ItemField);	
				}
			}.bind(this));
			return items;
		}.bind(this));
	},

	saveItems: function(items) {
		items.forEach(function(item) {
			if (item.get('fields')) {
				item.set('fields', this.listToDict(item.get('fields')));	
			}
		}.bind(this));
		items = this.listToDict(items);
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(items);
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'items';
		return ic.ajax(hash);
	},

	loadExtractors: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'extractors';
		return ic.ajax(hash).then(function(extractors) {
				return this.dictToList(extractors, ASTool.Extractor);
			}.bind(this)
		);	
	},

	saveExtractors: function(extractors) {
		extractors = this.listToDict(extractors);
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(extractors);
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'extractors';
		return ic.ajax(hash);
	},

	saveSpider: function(spiderName, spiderData) {
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(spiderData);
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'spiders/' + spiderName;
		return ic.ajax(hash);
	},

	fetchDocument: function(pageUrl, spiderName) {
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify({spider: spiderName,
									request: {url: pageUrl}});
		hash.url = this.get('botUrl') + 'fetch';
		return ic.ajax(hash);
	},

	listToDict: function(list) {
		var dict = {};
		list.forEach(function(element) {
			element = Em.copy(element);
			var name = element['name'];
			delete element['name'];
			dict[name] = element;
		});
		return dict;
	},

	dictToList: function(dict, wrappingType) {
		var entries = [];
		var keys = Object.keys(dict);
		keys.forEach(function(key) {
			var entry = dict[key];
			entry['name'] = key;
			if (wrappingType) {
				entry = wrappingType.create(entry);
			}
			entries.pushObject(entry);
		});
		return entries;
	},

});
