import Ember from 'ember';
import BaseController from './base-controller';
import Extractor from '../models/extractor';
import MappedFieldData from '../models/mapped-field-data';
import Item from '../models/item';
import ItemField from '../models/item-field';
import SpriteStore from '../utils/sprite-store';
import utils from '../utils/utils';

export default BaseController.extend({

    model: null,

    needs: ['application', 'projects', 'project', 'spider', 'spider/index'],

    _breadCrumb: function() {
        this.set('breadCrumb', this.get('model.name'));
    }.observes('model.name'),

    annotations: [],

    plugins: {},

    showContinueBrowsing: true,

    showDiscardButton: true,

    showToggleCSS: true,

    showFloatingAnnotationWidgetAt: null,

    floatingAnnotation: null,

    extractionTools: {},

    activeExtractionTool: {
        data: {extracts: []},
        pluginState: {extracted: []},
        sprites: new SpriteStore()
    },

    enableExtractionTool: function(tool) {
        // Convert old format to new
        var tool_parts = tool.split('.'),
            tool_name = tool_parts[tool_parts.length - 1];
        if (tool_name === 'annotations-plugin' &&
                !this.get('model.plugins.annotations-plugin')) {
            this.set('model.plugins.annotations-plugin', {
                'extracts': this.get('annotationsStore').findAll()
            });
        } else if (!this.get('model.plugins.' + tool_name)){
            this.set('model.plugins.' + tool_name, {
                'extracts': []
            });
        }
        if (!this.get('extractionTools.' + tool_name)) {
            this.set('extractionTools.' + tool_name, Ember.Object.create({
                data: this.get('model.plugins.' + tool_name),
                pluginState: {},
                sprites: new SpriteStore({}),
                component: tool_name,
                options: this.getWithDefault('plugins.' + tool.replace(/\./g, '_'), {})
            }));
        }

        this.set('activeExtractionTool', this.get('extractionTools.' + tool_name));
        this.get('documentView').config({
            mode: 'select',
            listener: this,
            dataSource: this,
            partialSelects: true,
        });
        this.set('documentView.sprites', this.get('activeExtractionTool.sprites'));
    },

    items: Ember.computed.alias('project_models.items'),
    extractors: Ember.computed.alias('project_models.extractors'),

    scrapedItem: function() {
        if (!Ember.isEmpty(this.get('items'))) {
            var item = this.get('items').findBy('name', this.get('model.scrapes'));
            if(item) {
                if (!item.fields) {
                    item.fields = [];
                }
                return item;
            }
        }
        return null;
    }.property('model.scrapes', 'items.@each'),

    displayExtractors: function() {
        return this.get('extractors').map(function(ext) {
            return {
                type: ext.get('regular_expression') ? '<RegEx>' : '<Type>',
                label: ext.get('regular_expression') || ext.get('type_extractor'),
                extractor: ext
            };
        });
    }.property('extractors.@each', 'model.extractors.@each'),

    currentlySelectedElement: null,

    sprites: function() {
        return this.get('activeExtractionTool.sprites');
    }.property('activeExtractionTool', 'activeExtractionTool.sprites'),

    saveTemplate: function() {
        if (this.get('model')) {
            this.set('model.extractors', this.validateExtractors());
            this.set('model.plugins', this.getWithDefault('model.plugins', {}));
            for (var key in this.get('extractionTools')) {
                this.set('model.plugins.' + key,
                    this.getWithDefault('extractionTools.' + key + '.data', {extracts: []}));
            }
        }
        var missingFields = this.getMissingFields();
        if (missingFields.length > 0) {
            this.showWarningNotification('Required Fields Missing',
                'You are unable to save this template as the following required fields are missing: "' +
                missingFields.join('", "') + '".');
        } else {
            return this.get('ws').save('template', this.get('model'));
        }
    },

    getMissingFields: function() {
        var itemRequiredFields = [],
            scrapedFields = new Set(),
            scraped_item = this.get('scrapedItem');
        if (scraped_item) {
            scraped_item.fields.forEach(function(field) {
                if (field.required) {
                    itemRequiredFields.push(field.name);
                }
            });
        }
        for (var plugin in this.get('extractionTools')) {
            var extracted = this.getWithDefault('extractionTools.' + plugin + '.pluginState.extracted', []);
            for (var i = 0; i < extracted.length; i++) {
                scrapedFields.add(extracted[i].name);
            }
        }
        return itemRequiredFields.filter(function(field) {
            if (!scrapedFields.has(field)) {
                return true;
            }
        });
    },

    saveExtractors: function() {
        // Cleanup extractor objects.
        this.get('extractors').forEach(function(extractor) {
            delete extractor['dragging'];
        });
        this.get('ws').save('extractors', this.get('extractors').map(function(extractor) {
            return extractor.serialize();
        }));
    },

    validateExtractors: function() {
        var extractors = this.get('extractors'),
            template_ext = this.get('model.extractors'),
            new_extractors = {},
            validated_extractors = {},
            extractor_ids = new Set(),
            addExtractorToSet = function(extractor_id) {
                if (extractor_ids.has(extractor_id)) {
                    new_extractors[field] = new_extractors[field] || new Set();
                    new_extractors[field].add(extractor_id);
                }
            },
            addExtractorToArray = function(extractor) {
                arr.push(extractor);
            };
        extractors.forEach(function(extractor) {
            extractor_ids.add(extractor.id);
        });

        for (var plugin in this.get('extractionTools')) {
            var extracted = this.getWithDefault('extractionTools.' + plugin + '.pluginState.extracted', []);
            for (var i = 0; i < extracted.length; i++) {
                var field = extracted[i].name,
                    item_extractors = template_ext[field];
                if (item_extractors instanceof Array) {
                    item_extractors.forEach(addExtractorToSet);
                }
            }
        }

        for (var key in new_extractors) {
            var arr = [];
            new_extractors[key].forEach(addExtractorToArray);
            validated_extractors[key] = arr;
        }
        return validated_extractors;
    },

    getAppliedExtractors: function(fieldName) {
        var extractorIds = this.get('model.extractors.' + fieldName) || [],
            extractors = [], seen = new Set();
        for (var i=0; i < extractorIds.length; i++) {
            var extractor = this.get('extractors').filterBy('name', extractorIds[i])[0];
            if (extractor) {
                extractor = extractor.copy();
                extractor['fieldName'] = fieldName;
                extractor['type'] = extractor.get('regular_expression') ? '<RegEx>' : '<Type>';
                extractor['label'] = extractor.get('regular_expression') || extractor.get('type_extractor');
                if (!seen.has(extractor['type']+extractor['label'])) {
                    extractors.push(extractor);
                    seen.add(extractor['type']+extractor['label']);
                }
            }
        }
        return extractors;
    },

    mappedFieldsData: function() {
        var mappedFieldsData = [],
            seenFields = new Set(),
            scrapedItemFields = new Set(),
            item_required_fields = new Set(),
            extractedFields = this.get('activeExtractionTool.pluginState.extracted'),
            scraped_item = this.get('scrapedItem');
        if (scraped_item) {
            scraped_item.fields.forEach(function(field) {
                if (field.required) {
                    item_required_fields.add(field.name);
                }
                scrapedItemFields.add(field.name);
            });
        }
        if (extractedFields) {
            var mappedFields = {};
            for (var i = 0; i < extractedFields.length; i++) {
                var field = extractedFields[i];
                if (scrapedItemFields.has(field.name)) {
                    var mappedFieldData = mappedFields[field.name] || MappedFieldData.create(),
                        required = mappedFieldData.required ? true : field.required || item_required_fields.has(field.name);
                    mappedFieldData.set('fieldName', field.name);
                    mappedFieldData.set('required', required);
                    mappedFieldData.set('disabled', true);
                    mappedFieldData.set('extracted', true);
                    mappedFieldData.set('extractors', this.getAppliedExtractors(field.name));
                    mappedFields[field.name] = mappedFieldData;
                }
            }
            for (var key in mappedFields) {
                mappedFieldsData.pushObject(mappedFields[key]);
                seenFields.add(key);
            }
        }
        if (scraped_item) {
            this.get('scrapedItem').fields.forEach(function(field) {
                if (!seenFields.has(field.name)) {
                    var mappedFieldData = MappedFieldData.create();
                    mappedFieldData.set('fieldName', field.name);
                    mappedFieldData.set('required', field.required);
                    mappedFieldData.set('disabled', true);
                    mappedFieldData.set('extractors', this.getAppliedExtractors(field.name));
                    mappedFieldsData.pushObject(mappedFieldData);
                }
            }.bind(this));
        }
        return mappedFieldsData;
    }.property('model.extractors.@each',
               'extractors.@each',
               'activeExtractionTool.pluginState.extracted',
               'scrapedItem.fields.@each'),

    createExtractor: function(extractorType, extractorDefinition) {
        var extractor = Extractor.create({
            name: utils.shortGuid(),
        });
        if (extractorType === 'regular_expression') {
            try {
                new RegExp(extractorDefinition);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    this.showErrorNotification('The text, "' + extractorDefinition + '", you provided is not a valid regex.');
                }
                return;
            }
        }
        extractor.set(extractorType, extractorDefinition);
        this.get('extractors').pushObject(extractor);
    },

    showFloatingAnnotationWidget: function(_, element, x, y) {
        this.set('showFloatingAnnotationWidgetAt', { x: x, y: y });
        this.set('floatingElement', Ember.$(element));
    },

    hideFloatingAnnotationWidget: function() {
        this.set('showFloatingAnnotationWidgetAt', null);
    },

    actions: {

        createField: function(item, fieldName, fieldType) {
            item.addField(fieldName, fieldType);
            var items = this.get('items').toArray(),
                slyd = this.get('slyd');
            items = items.map(function(item) {
                item = item.serialize();
                if (item.fields) {
                    item.fields = slyd.listToDict(item.fields);
                }
                return item;
            });
            items = slyd.listToDict(items);
            this.get('ws').save('items', items).then(function(data) {

                items = slyd.dictToList(data.saved.items, Item);
                items.forEach(function(item) {
                    if (item.fields) {
                        item.fields = slyd.dictToList(item.fields, ItemField);
                    }
                });
                this.set('project_models.items', items);
            }.bind(this));
        },

        rename: function(newName) {
            var oldName = this.get('model.name');
            var saveFuture = this.saveTemplate();
            if (!saveFuture) {
                Ember.run.next(this, function() {
                    this.set('model.name', oldName);
                });
                return;
            }
            this.set('templateName', oldName);
            this.set('model.name', newName);
            saveFuture.then(function() {
                var templateNames = this.get('controllers.spider.model.template_names');
                newName = this.getUnusedName(newName, templateNames);
                this.get('ws').rename('template', oldName, newName).then(
                    function() {
                        templateNames.removeObject(oldName);
                        templateNames.addObject(newName);
                        this.replaceRoute('template', newName);
                    }.bind(this),
                    function(err) {
                        this.set('model.name', this.get('templateName'));
                        throw err;
                    }.bind(this)
                );
            }.bind(this));
        },

        createExtractor: function(text, option) {
            if (text && text.length > 0) {
                this.createExtractor('regular_expression', text);
                this.saveExtractors();
            } else if (option && option.length > 0) {
                this.createExtractor('type_extractor', option);
                this.saveExtractors();
            }
        },

        deleteExtractor: function(extractor) {
            // Remove all references to this extractor.
            var extractors = this.get('model.extractors');
            Object.keys(extractors).forEach(function(fieldName) {
                extractors[fieldName].removeObject(extractor.extractor.id);
            }.bind(this));
            this.get('extractors').removeObject(extractor.extractor);
            this.saveExtractors();
        },

        applyExtractor: function(fieldName, extractorId) {
            var currentExtractors = this.get('model.extractors')[fieldName];
            if (!currentExtractors) {
                currentExtractors = [];
                this.set('model.extractors.' + fieldName, currentExtractors);
            }
            if (currentExtractors.indexOf(extractorId) === -1) {
                currentExtractors.pushObject(extractorId);
                this.notifyPropertyChange('model.extractors');
            }
            this.notifyPropertyChange('mappedFieldsData');
        },

        removeAppliedExtractor: function(appliedExtractor) {
            // TODO: we need to automatically remove extractors when the field they
            // extract is no longer mapped from any annotation.
            var fieldName = appliedExtractor['fieldName'];
            this.get('model.extractors')[fieldName].removeObject(appliedExtractor['name']);
            this.notifyPropertyChange('model.extractors');
            this.notifyPropertyChange('mappedFieldsData');
        },

        editItems: function() {
            this.transitionToRoute('template-items');
        },

        continueBrowsing: function() {
            var saveFuture = this.saveTemplate();
            if (!saveFuture) {
                return;
            }
            var sprites = this.get('documentView.sprites');
            this.set('documentView.sprites', new SpriteStore());
            saveFuture.then(function() {
                this.transitionToRoute('spider', {
                    queryParams: {
                        url: this.get('model.url')
                    }
                });
            }.bind(this),
            function(err) {
                this.set('documentView.sprites', sprites);
                throw err;
            }.bind(this));
        },

        discardChanges: function() {
            var hasData = false, tools = this.get('extractionTools'),
                finishDiscard = function() {
                    var params = {
                        url: this.get('model.url')
                    };
                    if (!hasData) {
                        params.rmt = this.get('model.name');
                    }
                    this.transitionToRoute('spider', {
                        queryParams: params
                    });
                }.bind(this);
            this.set('documentView.sprites', new SpriteStore());
            for (var key in tools) {
                if (((tools[key]['pluginState']||{})['extracted']||[]).length > 0) {
                    hasData = true;
                    break;
                }
            }

            if (hasData) {
                finishDiscard();
            } else {
                this.get('slyd').deleteTemplate(this.get('slyd.spider'),
                                                this.get('model.name')).then(finishDiscard);
            }
        },

        hideFloatingAnnotationWidget: function() {
            this.hideFloatingAnnotationWidget();
        },

        toggleCSS: function() {
            this.documentView.toggleCSS();
        },

        updatePluginField: function(field, value) {
            this.set(['extractionTools', this.get('activeExtractionTool.component'), field].join('.'),
                     value);
            this.notifyPropertyChange(['activeExtractionTool', field].join('.'));
        },

        updateScraped: function(name) {
            this.set('model.scrapes', name);
        },
    },

    documentActions: {

        elementSelected: function(element, mouseX, mouseY) {
            if (element) {
                this.showFloatingAnnotationWidget(null, element, mouseX, mouseY);
            }
        },

        partialSelection: function(selection, mouseX, mouseY) {
            var element = Ember.$('<ins/>').get(0);
            selection.getRangeAt(0).surroundContents(element);
            this.showFloatingAnnotationWidget(null, element, mouseX, mouseY);
        },

        elementHovered: function() {
            this.get('documentView').redrawNow();
        },
    },

    setDocument: function() {
        if (!this.get('model') || !this.get('model.annotated_body') || !this.get('loadDocument')) {
            return;
        }
        this.get('documentView').displayDocument(this.get('model.annotated_body'),
        function() {
            if (!this.get('model.plugins')) {
                this.set('model.plugins', Ember.Object.create({
                }));
            }
            this.set('activeExtractionTool', {
                data: {extracts: []},
                pluginState: {},
                sprites: new SpriteStore(),
                component: 'dummy-component'
            });
            this.set('extractionTools', {});
            this.enableExtractionTool(this.get('capabilities.plugins').get(0)['component'] || 'annotations-plugin');
        }.bind(this));
    }.observes('model', 'model.annotated_body'),

    /**
     * This will make sure the template scrapes a valid item and if not it will create one.
     */
    ensureItem: function() {
        if (this.get('model') &&  !this.get('items').findBy('name', this.get('model.scrapes'))) {
            // Template has an item that doesn't exist, create a new one
            var fields = new Set();
            Object.values(this.get('model.plugins')).forEach((plugin) => {
                plugin.extracts.forEach((extract) => {
                    Object.values(extract.annotations).forEach((fieldName) => {
                        fields.add(fieldName);
                    });
                });
            });
            var item = Item.create({
                name: this.get('model.scrapes'),
                display_name: this.get('model.name'),
                fields: []
            });
            fields.forEach((fieldName) => item.addField(fieldName));
            this.get('items').pushObject(item);
            this.showWarningNotification('Missing item',
                "This template didn't have a valid item assigned so a new one was created.");
            this.get('slyd').saveItems(this.get('items').toArray());
        }
    }.observes('model.scrapes', 'items.@each'),

    willEnter: function() {
        var plugins = {};
        this.get('capabilities.plugins').forEach(function(plugin) {
            plugins[plugin['component'].replace(/\./g, '_')] = plugin['options'];
        });
        this.set('extractedFields', []);
        this.set('plugins', plugins);
        this.setDocument();
    },

    willLeave: function() {
        this.hideFloatingAnnotationWidget();
        this.get('documentView').reset();
        this.set('activeExtractionTool', {extracts: [],
                                          component: 'dummy-component',
                                          pluginState: {}});
    }
});
