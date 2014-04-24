/**
	A Proxy to the slyd backend API.
*/
ASTool.SlydApi = Em.Object.extend({

	init: function() {
		this.getServerCapabilities();
	},

	/**
	@public

	The name of the current project.
	*/
	project: null,

	/**
	@public

	The capabilities of the slyd server.
	*/
	server_capabilities: null,

	projectSpecUrl: function() {
		return ASTool.SlydApi.getApiUrl() + '/' + this.project + '/spec/';
	}.property('project'),

	botUrl: function() {
		return ASTool.SlydApi.getApiUrl() + '/' + this.project + '/bot/';
	}.property('project'),

	/**
  	@public

  	Fetches server capabilities.

  	@method getServerCapabilities
  	@for ASTool.SlydApi
	*/
	getServerCapabilities: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = ASTool.SlydApi.getCapabilitiesUrl();
		ic.ajax(hash).then(function(capabilities) {
			this.set('server_capabilities', capabilities);
		}.bind(this));
	},

	/**
  	@public

  	Fetches project names.

  	@method getProjectNames
  	@for ASTool.SlydApi
  	@return {Promise} a promise that fulfills with an {Array} of project names.
	*/
	getProjectNames: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = ASTool.SlydApi.getApiUrl();
		return ic.ajax(hash);
	},

	/**
  	@public

  	Creates a new project. A project with the same name must not exist or
  	this operation will fail.
  	Project names must only contain alphanum, '.'s and '_'s.

  	@method createProject
  	@for ASTool.SlydApi
  	@param {String} [projectName] The name of the new project.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	createProject: function(projectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify({ cmd: 'create', args: [projectName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Deletes an existing project.

  	@method deleteProject
  	@for ASTool.SlydApi
  	@param {String} [projectName] The name of the project to delete.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	deleteProject: function(projectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify({ cmd: 'rm', args: [projectName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Renames an existing project. This operation will not overwrite
  	existing projects.
  	Project names must only contain alphanum, '.'s and '_'s.

  	@method renameProject
  	@for ASTool.SlydApi
  	@param {String} [oldProjectName] The name of the project to rename.
  	@param {String} [newProjectName] The new name for the project.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	renameProject: function(oldProjectName, newProjectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify({ cmd: 'mv', args: [oldProjectName, newProjectName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Returns a list with the spider names for the current project.

  	@method getSpiderNames
  	@for ASTool.SlydApi
  	@return {Promise} a promise that fulfills with an {Array} of spider names.
	*/
	getSpiderNames: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'spiders';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Fetches a spider.

  	@method loadSpider
  	@for ASTool.SlydApi
  	@param {String} [oldProjectName] The name of the spider.
  	@return {Promise} a promise that fulfills with a JSON {Object}
  		containing the spider spec.
	*/
	loadSpider: function(spiderName) {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'spiders/' + spiderName;
		return ic.ajax(hash).then(function(spiderData) {
			spiderData['name'] = spiderName;		
			spiderData['templates'] = spiderData['templates'].map(function(template) {
				// Assign a name to templates. This is needed as Autoscraping templates
				// are not named.
				if (Em.isEmpty(template['name'])) {
					template['name'] = ASTool.shortGuid();
				}
				return ASTool.Template.create(template);
			});
			return ASTool.Spider.create(spiderData);
		});
	},

	/**
  	@public

  	Renames an existing spider. This operation will overwrite
  	existing spiders.
  	Spider names must only contain alphanum, '.'s and '_'s.

  	@method renameSpider
  	@for ASTool.SlydApi
  	@param {String} [oldSpiderName] The name of the spider to rename.
  	@param {String} [newSpiderName] The new name for the spider.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	renameSpider: function(oldSpiderName, newSpiderName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = this.get('projectSpecUrl') + 'spiders';
		hash.data = JSON.stringify({ cmd: 'mv', args: [oldSpiderName, newSpiderName] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Saves the a spider for the current project.

  	@method saveSpider
  	@for ASTool.SlydApi
  	@param {String} [spiderName] the name of the spider.
  	@param {Object} [spiderData] a JSON object containing the spider spec.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	saveSpider: function(spider) {
		var hash = {};
		hash.type = 'POST';
		var spiderName = spider.get('name');
		hash.data = JSON.stringify(spider.serialize());
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'spiders/' + spiderName;
		return ic.ajax(hash);
	},

	/**
  	@public

  	Deletes an existing project.

  	@method deleteProject
  	@for ASTool.SlydApi
  	@param {String} [projectName] The name of the project to delete.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	deleteSpider: function(spiderName) {
		var hash = {};
		hash.type = 'POST';
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'spiders';
		hash.data = JSON.stringify({ cmd: 'rm', args: [spiderName] });
		return ic.ajax(hash);
	},

	/**
  	@public

  	Fetches the current project items.

  	@method loadItems
  	@for ASTool.SlydApi
  	@return {Promise} a promise that fulfills with an {Array} of JSON {Object}
  		containing the items spec.
  	}
	*/
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

	/**
  	@public

  	Saves the current project items.

  	@method saveItems
  	@for ASTool.SlydApi
  	@param {Array} [items] an array of JSON {Object} containing the items
  		spec.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	saveItems: function(items) {
		items = items.map(function(item) {
			item = item.serialize();
			if (item.fields) {
				item.fields = this.listToDict(item.fields);	
			}
			return item;
		}.bind(this));
		items = this.listToDict(items);
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(items);
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'items';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Fetches the current project extractors.

  	@method loadExtractors
  	@for ASTool.SlydApi
  	@return {Promise} a promise that fulfills with an {Array} of JSON {Object}
  		containing the extractors spec.
	*/
	loadExtractors: function() {
		var hash = {};
		hash.type = 'GET';
		hash.url = this.get('projectSpecUrl') + 'extractors';
		return ic.ajax(hash).then(function(extractors) {
				return this.dictToList(extractors, ASTool.Extractor);
			}.bind(this)
		);	
	},

	/**
  	@public

  	Saves the current project extractors.

  	@method saveExtractors
  	@for ASTool.SlydApi
  	@param {Array} [extractors] an array of JSON {Object} containing the
  		extractors spec.
  	@return {Promise} a promise that fulfills when the server responds.
	*/
	saveExtractors: function(extractors) {
		extractors = extractors.map(function(extractor) {
			return extractor.serialize();
		});
		extractors = this.listToDict(extractors);
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify(extractors);
		hash.dataType = 'text';
		hash.url = this.get('projectSpecUrl') + 'extractors';
		return ic.ajax(hash);
	},

	editProject: function(project_name, revision) {
		if (!this.get('server_capabilities.version_control')) {
			// if the server does not support version control, do 
			// nothing.
			return new Em.RSVP.Promise(function(resolve, reject) {
  				resolve();
			});
		}
		revision = revision ? revision : 'master';
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify(
			{ cmd: 'edit', args: [project_name, revision] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	projectRevisions: function(projectName) {
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify(
			{ cmd: 'revisions', args: [projectName] });
		return ic.ajax(hash);	
	},

	publishProject: function(project_name) {
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify(
			{ cmd: 'publish', args: [project_name] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	discardChanges: function(project_name) {
		var hash = {};
		hash.type = 'POST';
		hash.url = ASTool.SlydApi.getApiUrl();
		hash.data = JSON.stringify(
			{ cmd: 'discard', args: [project_name] });
		hash.dataType = 'text';
		return ic.ajax(hash);
	},

	/**
  	@public

  	Fetches a page using the given spider.

  	@method fetchDocument
  	@for ASTool.SlydApi
  	@param {String} [pageUrl] the URL of the page to fetch.
  	@param {String} [spiderName] the name of the spider to use.
  	@param {String} [parentFp] the fingerprint of the parent page.
  	@return {Promise} a promise that fulfills with an {Object} containing
  		the document contents (page), the response data (response), the
  		extracted items (items), the request fingerprint (fp), an error
  		message (error) and the links that will be followed (links).
	*/
	fetchDocument: function(pageUrl, spiderName, parentFp) {
		var hash = {};
		hash.type = 'POST';
		hash.data = JSON.stringify({ spider: spiderName,
									 request: { url: pageUrl } });
		if (parentFp) {
			hash.data['parent_fp'] = parentFp;
		}
		hash.url = this.get('botUrl') + 'fetch';
		return ic.ajax(hash);
	},

	/**
	@private

	Transforms a list of the form:
		[ { name: 'obj1', x: 'a' }, { name: 'obj2', x: 'b' }]

	into an object of the form:
		{ 
			obj1:
				{ x: 'a' },
			obj2:
				{ x: 'b' }
		}

	@method listToDict
	@for ASTool.SlydApi
	@param {Array} [list] the array to trasnform.
	@return {Object} the result object.
	*/
	listToDict: function(list) {
		var dict = {};
		list.forEach(function(element) {
			// Don't modify the original object.
			element = Em.copy(element);
			var name = element['name'];
			delete element['name'];
			dict[name] = element;
		});
		return dict;
	},

	/**
	@private

	Transforms an object of the form:
		{ 
			obj1:
				{ x: 'a' },
			obj2:
				{ x: 'b' }
		}

	into a list of the form:
		[ { name: 'obj1', x: 'a' }, { name: 'obj2', x: 'b' }]

	@method listToDict
	@for ASTool.SlydApi
	@param {Array} [list] the array to trasnform.
	@return {Object} the result object.
	*/
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


ASTool.SlydApi.reopenClass ({

	getApiUrl: function() {
		return (SLYD_URL || window.location.protocol + '//' + window.location.host) + '/projects';
	},

	getCapabilitiesUrl: function() {
		return (SLYD_URL || window.location.protocol + '//' + window.location.host) + '/server_capabilities';
	},
});
