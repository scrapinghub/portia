ASTool.SlydApi = Em.Object.extend({

	// Leave empty to use window.location.
	slydUrl: 'http://localhost:9001/api/',

	baseUrl: function() {
		return this.get('slydUrl') || window.location.protocol + '//' + window.location.host + '/api/';
	}.property('slydUrl'),

	// FIXME: hardcoded 'test' project.
	project: 'test',

	getSpiderNames: function() {
		hash = {};
		hash.type = 'GET';
		hash.url = this.get('baseUrl') + this.project + '/spec/spiders';
		return ic.ajax(hash);
	},

	loadSpiders: function(onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.url = this.get('baseUrl') + this.project + '/spec';
		ic.ajax(hash).then(function(projectData){
			return projectData['spiders'];
		});
	},

	loadSpider: function(spiderName) {
		hash = {};
		hash.type = 'GET';
		hash.url = this.get('baseUrl') + this.project + '/spec/spiders/' + spiderName;
		return ic.ajax(hash).then(function(spiderData) {
			spiderData['id'] = spiderName;		
			spiderData['templates'] = spiderData['templates'].map(function(template) {
				template['id'] = guid();
				return template;
			});
			return spiderData;
		});
	},

	loadItems: function(onSuccess, onError) {
		hash = {};
		hash.type = 'GET';
		hash.url = this.get('baseUrl') + this.project + '/spec/items';
		return ic.ajax(hash).then(function(items) {
			items = this.dictToList(items, ASTool.Item);
			items.forEach(function(item) {
				item.fields = this.dictToList(item.fields, ASTool.ItemField);
			}.bind(this));
			return items;
		}.bind(this));
	},

	saveItems: function(items) {
		items.forEach(function(item) {
			item.set('fields', this.listToDict(item.get('fields')));
		}.bind(this));
		items = this.listToDict(items);
		hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(items);
		hash.url = this.get('baseUrl') + this.project + '/spec/items';
		return ic.ajax(hash);
	},

	saveSpider: function(spiderName, spiderData) {
		hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(spiderData);
		hash.url = this.get('baseUrl') + this.project + '/spec/spiders/' + spiderName;
		return ic.ajax(hash);
	},

	fetchDocument: function(pageUrl, spiderName) {
		hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify({spider: spiderName,
									request: {url: pageUrl}});
		hash.url = this.get('baseUrl') + this.project + '/bot/fetch';
		return ic.ajax(hash);
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