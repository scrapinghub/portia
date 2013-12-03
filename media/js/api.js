ASTool.SlydApi = Em.Object.extend({

	baseUrl: 'http://localhost:9001/api/',

	// FIXME: hardcoded 'test' project.
	project: 'test',

	getSpiderNames: function(onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.success = function(spiderNames) {
			onSuccess(spiderNames);
		};
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec/spiders';
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

	loadItems: function(onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.success = function(items) {
			items = this.dictToList(items, ASTool.Item);
			items.forEach(function(item) {
				item.fields = this.dictToList(item.fields, ASTool.ItemField);
			}.bind(this));
			onSuccess(items);
		}.bind(this);
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec/items';
		$.ajax(hash);
	},

	saveItems: function(items, onSuccess, onError) {
		items.forEach(function(item) {
			item.set('fields', this.listToDict(item.get('fields')));
		}.bind(this));
		items = this.listToDict(items);
		hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(items);
		hash.success = onSuccess;
		hash.error = onError;
		hash.url = this.baseUrl + this.project + '/spec/items';
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

	listToDict: function(list) {
		var dict = {};
		list.forEach(function(element) {
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