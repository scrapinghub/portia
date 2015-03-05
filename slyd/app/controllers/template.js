import Ember from 'ember';
import BaseController from './base-controller';
import Extractor from '../models/extractor';
import MappedFieldData from '../models/mapped-field-data';
import SpriteStore from '../utils/sprite-store';

export default BaseController.extend({

    model: null,

    needs: ['application', 'projects', 'project', 'spider', 'spider/index'],

    breadCrumb: function() {
        return this.get('model.name');
    }.property('model.name'),

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
            return this.get('items').findBy('name', this.get('model.scrapes'));
        } else {
            return null;
        }
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
            this.showAlert('Required Fields Missing',
                'You are unable to save this template as the following required fields are missing: "' +
                missingFields.join('", "') + '".');
        } else {
            return this.get('slyd').saveTemplate(
                this.get('controllers.spider.name'), this.get('model'));
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
        this.get('slyd').saveExtractors(this.get('extractors'));
    },

    validateExtractors: function() {
        var extractors = this.get('extractors'),
            template_ext = this.get('model.extractors'),
            new_extractors = {},
            validated_extractors = {},
            extractor_ids = {},
            arr = [],
            addExtractorToSet = function(extractor_id) {
                if (extractor_ids[extractor_id]) {
                    new_extractors[field] = new_extractors[field] || new Set();
                    new_extractors[field].add(extractor_id);
                }
            },
            addExtractorToArray = function(extractor) {
                arr.push(extractor);
            };
        extractors.forEach(function(extractor) {
            extractor_ids[extractor.id] = true;
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
            new_extractors[key].forEach(addExtractorToArray);
            validated_extractors[key] = arr;
        }
        return validated_extractors;
    },

    getAppliedExtractors: function(fieldName) {
        var extractorIds = this.get('model.extractors.' + fieldName) || [];
        return extractorIds.map(function(extractorId) {
                var extractor = this.get('extractors').filterBy('name', extractorId)[0];
                if (extractor) {
                    extractor = extractor.copy();
                    extractor['fieldName'] = fieldName;
                    extractor['type'] = extractor.get('regular_expression') ? '<RegEx>' : '<Type>';
                    extractor['label'] = extractor.get('regular_expression') || extractor.get('type_extractor');
                    return extractor;
                } else {
                    return null;
                }
            }.bind(this)
        ).filter(function(extractor){ return !!extractor; });
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
                    var mappedFieldData = mappedFields[field.name] || MappedFieldData.create();
                    mappedFieldData.set('fieldName', field.name);
                    mappedFieldData.set('required', mappedFieldData.required ? true : field.required);
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
               'activeExtractionTool.pluginsState.extracted',
               'scrapedItem.fields.@each'),

    createExtractor: function(extractorType, extractorDefinition) {
        var extractor = Extractor.create({
            name: this.shortGuid(),
        });
        if (extractorType === 'regular_expression') {
            try {
                new RegExp(extractorDefinition);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    this.showAlert('Save Error','The text, "' + extractorDefinition + '", you provided is not a valid regex.');
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
            this.get('slyd').saveItems(this.get('items').toArray()).then(function() { },
                function(reason) {
                    this.showHTTPAlert('Save Error', reason);
                }.bind(this)
            );
        },

        rename: function(oldName, newName) {
            this.set('name', oldName);
            var saveFuture = this.saveTemplate();
            if (!saveFuture) {
                return;
            }
            saveFuture.then(function() {
                var templateNames = this.get('controllers.spider.model.template_names');
                newName = this.getUnusedName(newName, templateNames);
                var spiderName = this.get('controllers.spider.name');
                this.get('slyd').renameTemplate(spiderName, oldName, newName).then(
                    function() {
                        templateNames.removeObject(oldName);
                        templateNames.addObject(newName);
                        this.replaceRoute('template', newName);
                    }.bind(this),
                    function() {
                        this.showHTTPAlert('Save Error', 'The name ' + newName + ' is not a valid template name.');
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
            this.transitionToRoute('items');
        },

        continueBrowsing: function() {
            var saveFuture = this.saveTemplate();
            if (!saveFuture) {
                return;
            }
            var sprites = this.get('documentView.sprites');
            this.set('documentView.sprites', []);
            saveFuture.then(function() {
                this.transitionToRoute('spider', {
                    queryParams: {
                        url: this.get('model.url')
                    }
                });
            }.bind(this),
            function(reason) {
                this.set('documentView.sprites', sprites);
                this.showHTTPAlert('Save Error', reason);
            }.bind(this));
        },

        discardChanges: function() {
            this.set('documentView.sprites', []);
            this.transitionToRoute('spider', {
                queryParams: {
                    url: this.get('model.url')
                }
            });
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
        }
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
        if (!this.get('model') || !this.get('model.annotated_body') || this.toString().indexOf('template/index') < 0) {
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
        this.get('documentView').hideHoveredInfo();
        this.set('activeExtractionTool', {extracts: [],
                                          component: 'dummy-component',
                                          pluginState: {}});
    }
});
