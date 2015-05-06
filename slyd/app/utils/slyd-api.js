import Ember from 'ember';
import ajax from 'ic-ajax';
import ApplicationUtils from '../mixins/application-utils';
import Spider from '../models/spider';
import Template from '../models/template';
import Item from '../models/item';
import ItemField from '../models/item-field';
import Extractor from '../models/extractor';
import config from '../config/environment';

/**
    A Proxy to the slyd backend API.
*/
export var SlydApi = Ember.Object.extend(ApplicationUtils, {
    getApiUrl: function() {
        return (config.SLYD_URL || window.location.protocol + '//' + window.location.host) + '/projects';
    },
    /**
    @public

    The name of the current project.
    */
    project: null,

    /**
    @public

    The name of the current spider.
    */
    spider: null,

    projectSpecUrl: function() {
        return this.getApiUrl() + '/' + this.project + '/spec/';
    }.property('project'),

    botUrl: function() {
        return this.getApiUrl() + '/' + this.project + '/bot/';
    }.property('project'),


    /**
    @public

    Fetches project names.

    @method getProjectNames
    @for this
    @return {Promise} a promise that fulfills with an {Array} of project names.
    */
    getProjectNames: function() {
        var hash = {};
        hash.type = 'GET';
        hash.url = this.getApiUrl();
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to load project names';
            throw err;
        });
    },

    /**
    @public

    Creates a new project. A project with the same name must not exist or
    this operation will fail.
    Project names must only contain alphanum, '.'s and '_'s.

    @method createProject
    @for this
    @param {String} [projectName] The name of the new project.
    @return {Promise} a promise that fulfills when the server responds.
    */
    createProject: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify({ cmd: 'create', args: [projectName] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to create project';
            throw err;
        });
    },

    /**
    @public

    Deletes an existing project.

    @method deleteProject
    @for this
    @param {String} [projectName] The name of the project to delete.
    @return {Promise} a promise that fulfills when the server responds.
    */
    deleteProject: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify({ cmd: 'rm', args: [projectName] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to delete project';
            throw err;
        });
    },

    /**
    @public

    Renames an existing project. This operation will not overwrite
    existing projects.
    Project names must only contain alphanum, '.'s and '_'s.

    @method renameProject
    @for this
    @param {String} [oldProjectName] The name of the project to rename.
    @param {String} [newProjectName] The new name for the project.
    @return {Promise} a promise that fulfills when the server responds.
    */
    renameProject: function(oldProjectName, newProjectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify({ cmd: 'mv', args: [oldProjectName, newProjectName] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to rename project';
            throw err;
        });
    },

    /**
    @public

    Returns a list with the spider names for the current project.

    @method getSpiderNames
    @for this
    @return {Promise} a promise that fulfills with an {Array} of spider names.
    */
    getSpiderNames: function() {
        var hash = {};
        hash.type = 'GET';
        hash.url = this.get('projectSpecUrl') + 'spiders';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to load spider names';
            throw err;
        });
    },

    /**
    @public

    Fetches a spider.

    @method loadSpider
    @for this
    @param {String} [spiderName] The name of the spider.
    @return {Promise} a promise that fulfills with a JSON {Object}
        containing the spider spec.
    */
    loadSpider: function(spiderName) {
        var hash = {};
        hash.type = 'GET';
        hash.url = this.get('projectSpecUrl') + 'spiders/' + (spiderName || this.get('spider'));
        return this.makeAjaxCall(hash).then(function(spiderData) {
            spiderData['name'] = (spiderName || this.get('spider'));
            spiderData['templates'] = spiderData['templates'].map(function(template) {
                // Assign a name to templates. This is needed as Autoscraping templates
                // are not named.
                if (Ember.isEmpty(template['name'])) {
                    template['name'] = this.shortGuid();
                }
                return Template.create(template);
            });
            return Spider.create(spiderData);
        }, function(err) {
            err.title = 'Failed to load spider';
            throw err;
        });
    },

    /**
    @public

    Fetches a template.

    @method loadTemplate
    @for this
    @param {String} [spiderName] The name of the spider.
    @param {String} [templateName] The name of the template.
    @return {Promise} a promise that fulfills with a JSON {Object}
        containing the template spec.
    */
    loadTemplate: function(spiderName, templateName) {
        var hash = {};
        hash.type = 'GET';
        hash.url = this.get('projectSpecUrl') + 'spiders/' + (spiderName || this.get('spider')) + '/' + templateName;
        return this.makeAjaxCall(hash).then(function(templateData) {
            return Template.create(templateData);
        }, function(err) {
            err.title = 'Failed to load template';
            throw err;
        });
    },

    /**
    @public

    Renames an existing spider. This operation will overwrite
    existing spiders.
    Spider names must only contain alphanum, '.'s and '_'s.

    @method renameSpider
    @for this
    @param {String} [oldSpiderName] The name of the spider to rename.
    @param {String} [newSpiderName] The new name for the spider.
    @return {Promise} a promise that fulfills when the server responds.
    */
    renameSpider: function(oldSpiderName, newSpiderName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.get('projectSpecUrl') + 'spiders';
        hash.data = JSON.stringify({ cmd: 'mv', args: [oldSpiderName || this.get('spider'), newSpiderName] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to rename spider';
            throw err;
        });
    },

    /**
    @public

    Renames an existing template. This operation will overwrite
    existing templates.
    Template names must only contain alphanum, '.'s and '_'s.

    @method renameTemplate
    @for this
    @param {String} [spiderName] The name of the spider owning the template.
    @param {String} [oldTemplateName] The name of the template to rename.
    @param {String} [newTemplateName] The new name for the template.
    @return {Promise} a promise that fulfills when the server responds.
    */
    renameTemplate: function(spiderName, oldTemplateName, newTemplateName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.get('projectSpecUrl') + 'spiders';
        hash.data = JSON.stringify({ cmd: 'mvt', args: [spiderName || this.get('spiderName'), oldTemplateName, newTemplateName] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to rename template';
            throw err;
        });
    },

    /**
    @public

    Saves a spider for the current project.

    @method saveSpider
    @for this
    @param {String} [spiderName] the name of the spider.
    @param {Object} [spiderData] a JSON object containing the spider spec.
    @param {Bool} [excludeTemplates] if true, don't save spider templates.
    @return {Promise} promise that fulfills when the server responds.
    */
    saveSpider: function(spider, excludeTemplates) {
        var hash = {};
        hash.type = 'POST';
        var spiderName = spider.get('name'),
            serialized = spider.serialize();
        if (excludeTemplates) {
            delete serialized['templates'];
        }
        hash.data = JSON.stringify(serialized);
        hash.dataType = 'text';
        hash.url = this.get('projectSpecUrl') + 'spiders/' + spiderName;
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to save spider';
            throw err;
        });
    },

    /**
    @public

    Saves a spider template for the current project.

    @method saveTemplate
    @for this
    @param {String} [spiderName] the name of the spider.
    @param {String} [templateName] the name of the template.
    @param {Object} [templateData] a JSON object containing the template spec.
    @return {Promise} promise that fulfills when the server responds.
    */
    saveTemplate: function(spiderName, template) {
        var hash = {};
        hash.type = 'POST';
        var templateName = template.get('name'),
            serialized = template.serialize();
        if (template.get('_new')) {
            serialized['original_body'] = template.get('original_body');
            template.set('_new', false);
        }
        hash.data = JSON.stringify(serialized);
        hash.dataType = 'text';
        hash.url = this.get('projectSpecUrl') + 'spiders/' + (spiderName || this.get('spider')) + '/' + templateName;
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to save template';
            throw err;
        });
    },

    /**
    @public

    Deletes an existing spider.

    @method deleteSpider
    @for this
    @param {String} [spiderName] The name of the spider to delete.
    @return {Promise} a promise that fulfills when the server responds.
    */
    deleteSpider: function(spiderName) {
        var hash = {};
        hash.type = 'POST';
        hash.dataType = 'text';
        hash.url = this.get('projectSpecUrl') + 'spiders';
        hash.data = JSON.stringify({ cmd: 'rm', args: [spiderName || this.get('spider')] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to delete spider';
            throw err;
        });
    },

    /**
    @public

    Deletes an existing template.

    @method deleteTemplate
    @for this
    @param {String} [spiderName] The name of the spider that owns the template.
    @param {String} [spiderName] The name of the template to delete.
    @return {Promise} a promise that fulfills when the server responds.
    */
    deleteTemplate: function(spiderName, templateName) {
        var hash = {};
        hash.type = 'POST';
        hash.dataType = 'text';
        hash.url = this.get('projectSpecUrl') + 'spiders';
        hash.data = JSON.stringify({ cmd: 'rmt', args: [spiderName || this.get('spider'), templateName] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to delete template';
            throw err;
        });
    },

    /**
    @public

    Fetches the current project items.

    @method loadItems
    @for this
    @return {Promise} a promise that fulfills with an {Array} of JSON {Object}
        containing the items spec.
    }
    */
    loadItems: function() {
        var hash = {};
        hash.type = 'GET';
        hash.url = this.get('projectSpecUrl') + 'items';
        return this.makeAjaxCall(hash).then(function(items) {
            items = this.dictToList(items, Item);
            items.forEach(function(item) {
                if (item.fields) {
                    item.fields = this.dictToList(item.fields, ItemField);
                }
            }.bind(this));
            return items;
        }.bind(this), function(err) {
            err.title = 'Failed to load items';
            throw err;
        });
    },

    /**
    @public

    Saves the current project items.

    @method saveItems
    @for this
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
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to save items';
            throw err;
        });
    },

    /**
    @public

    Fetches the current project extractors.

    @method loadExtractors
    @for this
    @return {Promise} a promise that fulfills with an {Array} of JSON {Object}
        containing the extractors spec.
    */
    loadExtractors: function() {
        var hash = {};
        hash.type = 'GET';
        hash.url = this.get('projectSpecUrl') + 'extractors';
        return this.makeAjaxCall(hash).then(function(extractors) {
            return this.dictToList(extractors, Extractor);
        }.bind(this), function(err) {
            err.title = 'Failed to load extractors';
            throw err;
        });
    },

    /**
    @public

    Saves the current project extractors.

    @method saveExtractors
    @for this
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
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to save extractors';
            throw err;
        });
    },

    editProject: function(project_name, revision) {
        if (!this.get('serverCapabilities.version_control')) {
            // if the server does not support version control, do
            // nothing.
            return new Ember.RSVP.Promise(function(resolve) {
                resolve();
            });
        } else {
            revision = revision ? revision : 'master';
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = JSON.stringify(
                { cmd: 'edit', args: [project_name, revision] });
            hash.dataType = 'text';
            return this.makeAjaxCall(hash).catch(function(err) {
                err.title = 'Failed to load project';
                throw err;
            });
        }
    },

    projectRevisions: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'revisions', args: [projectName] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to load project revisions';
            throw err;
        });
    },

    conflictedFiles: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'conflicts', args: [projectName] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to load conflicted files';
            throw err;
        });
    },

    changedFiles: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'changes', args: [projectName] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to load changed files';
            throw err;
        });
    },

    publishProject: function(projectName, force) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'publish', args: [projectName, !!force] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to publish project';
            throw err;
        });
    },

    deployProject: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'deploy', args: [projectName] });
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to deploy project';
            throw err;
        });
    },

    discardChanges: function(projectName) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'discard', args: [projectName] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to discard changes';
            throw err;
        });
    },

    saveFile: function(projectName, fileName, contents) {
        var hash = {};
        hash.type = 'POST';
        hash.url = this.getApiUrl();
        hash.data = JSON.stringify(
            { cmd: 'save', args: [projectName, fileName, contents] });
        hash.dataType = 'text';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to save file';
            throw err;
        });
    },

    /**
    @public

    Fetches a page using the given spider.

    @method fetchDocument
    @for this
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
        var data = { spider: spiderName || this.get('spider'),
                 request: { url: pageUrl } };
        if (parentFp) {
            data['parent_fp'] = parentFp;
        }
        hash.data = JSON.stringify(data);
        hash.url = this.get('botUrl') + 'fetch';
        return this.makeAjaxCall(hash).catch(function(err) {
            err.title = 'Failed to fetch page';
            throw err;
        });
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
    @for this
    @param {Array} [list] the array to trasnform.
    @return {Object} the result object.
    */
    listToDict: function(list) {
        var dict = {};
        list.forEach(function(element) {
            // Don't modify the original object.
            element = Ember.copy(element);
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
    @for this
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

    makeAjaxCall: function(hash) {
        return ajax(hash).catch(function(reason) {
            var msg = 'Error processing ' + hash.type + ' to ' + hash.url;
            if (hash.data) {
                msg += '\nwith data ' + hash.data;
            }
            msg += '\n\nThe server returned ' + reason.textStatus +
                   '(' + reason.errorThrown + ')' + '\n\n' +
                   reason.jqXHR.responseText;
            var err = new Error(msg);
            err.name = 'HTTPError';
            err.status = reason.jqXHR.status;
            err.reason = reason;
            if (reason.jqXHR.getResponseHeader('Content-Type') === 'application/json') {
                err.data = Ember.$.parseJSON(reason.jqXHR.responseText);
            }
            throw err;
        });
    },
});

export default SlydApi;
