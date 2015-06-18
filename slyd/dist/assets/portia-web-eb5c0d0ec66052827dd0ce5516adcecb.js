/* jshint ignore:start */

/* jshint ignore:end */

define('portia-web/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'portia-web/mixins/application-utils', 'portia-web/config/environment'], function (exports, Ember, Resolver, loadInitializers, ApplicationUtils, config) {

  'use strict';

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  var App = Ember['default'].Application.extend(ApplicationUtils['default'], {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default'],
    customEvents: {
      paste: 'paste'
    }
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('portia-web/components/accordion-item', ['exports', 'ember', 'ember-idx-accordion/accordion-item'], function (exports, Ember, AccordionItemComponent) {

    'use strict';

    exports['default'] = AccordionItemComponent['default'].extend({

        select: (function (e) {
            if (!(e || this.getWithDefault('reTrigger', true))) {
                return;
            }
            if (e) {
                var target = Ember['default'].$(e.target);
                if (!(target.data('header') || target.parents('*[data-header]').length > 0)) {
                    return;
                }
            }
            this.set('reTrigger', false);
            return this.get('accordion').select(this);
        }).on('click')
    });

});
define('portia-web/components/annotations-plugin/component', ['exports', 'ember', 'portia-web/mixins/guess-types'], function (exports, Ember, GuessTypes) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(GuessTypes['default'], {
        tagName: 'div',
        classNameBindings: ['inDoc:in-doc', 'showAnnotation:annotation-widget'],
        fieldName: null,
        fieldType: null,
        showingBasic: true,
        showingAdvanced: false,
        creatingField: false,
        inDoc: false,
        pos: null,
        variantValue: 0,
        ignoredAttributes: [],

        actions: {

            showCreateField: function showCreateField() {
                this.setState(true, false, false);
            },

            showAdvanced: function showAdvanced() {
                this.setState(false, true, false);
            },

            showBasic: function showBasic() {
                this.setState(false, false, true);
            },

            dismiss: function dismiss() {
                this.closeWidget();
            },

            edit: function edit() {
                this.sendAction('edit', this.get('data'));
            },
            'delete': function _delete() {
                this.get('alldata').removeObject(this.get('data'));
                this.get('sprites').removeSprite(this.get('mappedDOMElement'));
                if (this.get('mappedDOMElement').tagName === 'INS') {
                    this.get('mappedElement').removePartialAnnotation();
                }
                var id = this.get('data.id'),
                    extracted = this.getWithDefault('pluginState.extracted', []),
                    deleted = extracted.filter(function (ann) {
                    if (ann.id && id === ann.id) {
                        return true;
                    }
                });
                deleted.forEach(function (ann) {
                    extracted.removeObject(ann);
                });
                this.set('pluginState.extracted', extracted);
                this.updateData('pluginState.extracted');
                this.closeWidget();
            },

            updateVariant: function updateVariant(value) {
                if (value > this.getWithDefault('pluginState.maxVariant', 0)) {
                    this.set('pluginState.maxVariant', value);
                    this.updateData('pluginState');
                }
                this.set('data.variant', parseInt(value));
            },

            updateField: function updateField(value, index) {
                if (value === '#create') {
                    value = null;
                    this.set('createNewIndex', index);
                    var annotation = this.get('mappings').get(index),
                        extractedData = annotation.content,
                        attribute = annotation.attribute,
                        element = this.get('mappedDOMElement'),
                        guess = this.get('guessedAttribute') !== attribute;
                    this.set('guessedType', this.guessFieldType(extractedData, element, guess));
                    var name = this.guessFieldName(element);
                    if (this.get('itemFields').mapBy('value').contains(name)) {
                        name = null;
                    }
                    this.set('guessedName', name ? name : 'Enter name');
                    this.set('defaultName', name);
                    this.setState(true, false, false);
                } else if (value === '#sticky') {
                    this.setAttr(index, '#sticky', 'field', true);
                } else {
                    this.setAttr(index, value, 'field');
                }
            },

            updateAttribute: function updateAttribute(value, index) {
                this.setAttr(index, value, 'attribute');
            },

            updateRequired: function updateRequired(value, checked, index) {
                this.setAttr(index, null, null, checked);
            },

            addNewMapping: function addNewMapping() {
                this.addNewMapping();
            },

            removeMapping: function removeMapping(index) {
                this.removeAnno(index);
            },

            createField: function createField() {
                var fieldName = this.get('newFieldName'),
                    fieldType = this.get('newFieldType');
                if (!fieldName || fieldName.length < 1) {
                    var defaultName = this.get('defaultName');
                    if (defaultName && defaultName.length > 0) {
                        this.set('newFieldName', defaultName);
                    } else {
                        return;
                    }
                }
                if (!fieldType || fieldType.length < 1) {
                    this.set('newFieldType', 'text');
                }
                this.createNewField();
            },

            backToMain: function backToMain() {
                this.setState(false, false, true);
                this.set('newFieldName', null);
                this.set('newFieldType', null);
                this.notifyPropertyChange('refreshMapped');
            },

            updateNewFieldName: function updateNewFieldName(value) {
                if (typeof value === 'string') {
                    this.set('newFieldName', value);
                }
            },

            updateNewFieldType: function updateNewFieldType(value) {
                if (value) {
                    this.set('newFieldType', value);
                }
            },

            ignoreElement: function ignoreElement() {
                this.set('ignoring', true);
                this.set('previousListener', this.get('document.view.listener'));
                this.get('document.view').config({
                    listener: this,
                    partialSelects: false
                });
                this.set('document.view.restrictToDescendants', this.get('mappedElement'));
                this.get('document.view').setInteractionsBlocked(false);
                this.hide();
            },

            deleteIgnore: function deleteIgnore(index) {
                var ignore = this.get('pluginState.ignores').get(index),
                    ignoreData = this.get('alldata').findBy('tagid', ignore.tagid);
                this.get('alldata').removeObject(ignoreData);
                this.get('pluginState.ignores').removeObject(ignore);
                this.updateData('pluginState');
            },

            ignoreBeneath: function ignoreBeneath(_, value, index) {
                var ignore = this.get('pluginState.ignores').objectAt(index),
                    ignoreData = this.get('alldata').findBy('tagid', ignore.tagid);
                ignore.set('ignoreBeneath', value);
                ignoreData['ignore_beneath'] = value;
                this.updateData('pluginState');
            },

            elementHovered: function elementHovered(data, _, hovered) {
                if (hovered) {
                    this.get('document.view').setElementHovered(data.data.element);
                } else {
                    this.get('document.view').mouseOutHandler();
                }
            },

            elementClicked: function elementClicked(data) {
                if (Object.keys(this.get('data.annotations')).length > 0) {
                    if (confirm('You have mapped attributes for this Annotation that will be lost if you change this element.\n' + 'Do you wish to continue?')) {
                        this.mapToNewElement(data.data.element);
                    }
                } else {
                    this.mapToNewElement(data.data.element);
                }
            }
        },

        //*******************************************************************\\
        //
        //                      Document Interaction
        //
        //*******************************************************************\\

        documentActions: {
            elementSelected: function elementSelected(element) {
                if (this.get('ignoring')) {
                    var ignored,
                        jqElem = Ember['default'].$(element),
                        tagid = jqElem.data('tagid'),
                        ignoreData = this.get('alldata').findBy('tagid', tagid);
                    if (ignoreData) {
                        ignored = ignoreData;
                    } else {
                        ignored = {
                            id: this.s4() + '-' + this.s4() + '-' + this.s4(),
                            tagid: tagid,
                            ignore: true,
                            ignore_beneath: false
                        };
                        this.get('alldata').pushObject(ignored);
                    }
                    this.get('pluginState.ignores').pushObject({
                        id: ignored.id,
                        tagid: tagid,
                        element: jqElem,
                        ignoreBeneath: ignored.ignore_beneath
                    });
                    this.updateData('pluginState');

                    this.get('document.view').config({
                        listener: this.get('previousListener'),
                        partialSelects: true
                    });
                    this.set('document.view.restrictToDescendants', null);
                    this.get('document.view').setInteractionsBlocked(this.get('inDoc'));
                    this.set('ignoring', false);
                    this.show();
                }
            },

            elementHovered: function elementHovered() {
                this.get('document.view').redrawNow();
            }
        },

        //*******************************************************************\\
        //
        //                        Update Annotation
        //
        //*******************************************************************\\

        s4: function s4() {
            return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
        },

        createAnnotationData: function createAnnotationData(generatedData) {
            var element = this.get('mappedElement'),
                data = {
                annotations: {},
                required: [],
                variant: 0,
                id: this.s4() + '-' + this.s4() + '-' + this.s4(),
                tagid: element.data('tagid')
            };
            if (element.prop('tagName') === 'INS') {
                data.generated = true;
                data.tagid = generatedData.tagid;
                data.slice = generatedData.slice;
                data.insert_after = generatedData.insert_after;
                data.annotations = { content: null };
            }
            return data;
        },

        setAttr: function setAttr(index, value, field, required) {
            var annotation = this.getAnnotation(index),
                update = false;
            if (!annotation) {
                return;
            }
            if (field === 'field' && value === '#sticky' && annotation[field] !== '#sticky') {
                var maxSticky = this.getWithDefault('pluginState.maxSticky', 0) + 1,
                    sticky = '_sticky' + maxSticky;
                this.set('pluginState.maxSticky', maxSticky);
                this.updateData('pluginState');
                value = sticky;
            }
            if (field && annotation[field] !== value) {
                try {
                    annotation.set(field, value);
                } catch (e) {
                    annotation[field] = value;
                }
                update = true;
            }
            if ((required || required === false) && annotation['required'] !== required) {
                try {
                    annotation.set('required', required);
                } catch (e) {
                    annotation['required'] = required;
                }
                update = true;
            }
            if (annotation.field && annotation.field === '#create') {
                annotation.field = null;
                update = false;
            }
            if (update) {
                this.updateAnnotations();
            }
        },

        removeAnno: function removeAnno(index) {
            var annotation = this.getAnnotation(index);
            if (annotation) {
                this.get('mappings').removeObject(annotation);
                this.updateAnnotations();
            }
        },

        getAttr: function getAttr(index, attr) {
            var annotation = this.getAnnotation(index);
            return annotation[attr];
        },

        getAnnotation: function getAnnotation(index) {
            return this.get('mappings').objectAt(index);
        },

        updateAnnotations: function updateAnnotations() {
            var annotations = {},
                required = [],
                idMap = this.get('fieldNameIdMap');
            this.get('mappings').forEach(function (annotation) {
                var attribute = annotation['attribute'],
                    field = annotation['field'];
                if (field in idMap) {
                    field = idMap[field];
                }
                try {
                    annotations[attribute] = field;
                } catch (e) {
                    annotations.set(attribute, field);
                }
                if (annotation['required']) {
                    required.push(field);
                }
            });
            this.set('data.annotations', annotations);
            this.set('data.required', required);
            if (this.get('mappedElement').attr('content')) {
                this.set('data.text-content', 'text content');
            }
            this.updateExtractedFields();
            this.notifyPropertyChange('sprite');
        },

        updateExtractedFields: function updateExtractedFields() {
            var id = this.get('data.id'),
                annotations = this.get('data.annotations'),
                required = this.get('data.required'),
                extracted = this.getWithDefault('pluginState.extracted', []).filter(function (f) {
                if (f.id && f.id !== id) {
                    return true;
                }
            });
            for (var key in annotations) {
                var fieldName = annotations[key];
                if (fieldName && fieldName[0] !== '#') {
                    extracted.pushObject({
                        id: id,
                        name: fieldName,
                        required: required.indexOf(annotations[key]) > -1
                    });
                }
            }
            this.set('pluginState.extracted', extracted);
            this.updateData('pluginState.extracted');
        },

        //*******************************************************************\\
        //
        //                    Manage selectboxes fields
        //
        //*******************************************************************\\

        itemFields: (function () {
            var fields = this.get('item.fields') || [];
            var options = fields.map(function (field) {
                var name = field.get('name');
                return { value: name, label: name };
            });
            options.pushObject({ value: '#sticky', label: '-just required-' });
            options.pushObject({ value: '#create', label: '-create new-' });
            return options;
        }).property('item.fields.@each'),

        variantList: (function () {
            var variants = [{ value: 0, label: 'Base' }],
                i = 1,
                maxVariant = this.getWithDefault('pluginState.maxVariant', 0);
            while (i <= maxVariant) {
                variants.push({ value: i, label: '#' + i });
                i += 1;
            }
            variants.push({ value: i, label: 'Add new: #' + i });
            return variants;
        }).property('pluginState.maxVariant'),

        attributes: (function () {
            var mapped = this.get('data.annotations') || {};
            var attrs = (this.get('mappedElement').getAttributeList() || []).mapBy('name');
            return attrs.filter(function (name) {
                if (name in mapped) {
                    return false;
                }
                return true;
            });
        }).property('data.annotations'),

        attributeValues: (function () {
            var values = {};
            (this.get('mappedElement').getAttributeList() || []).forEach(function (attr) {
                var name = attr.get('name'),
                    value = attr.get('value');
                if (('' + attr).length > 0) {
                    values[name] = value;
                } else {
                    values[name] = '< Empty attribute >';
                }
            });
            return values;
        }).property('data.tagid'),

        parents: (function () {
            return this.createHierarchy(this.get('mappedElement').parents(), false);
        }).property('mappedElement'),

        children: (function () {
            return this.createHierarchy(this.get('mappedElement').children(), true);
        }).property('mappedElement'),

        //*******************************************************************\\
        //
        //          Highlight and Scroll to elements in document
        //
        //*******************************************************************\\

        mouseEnter: function mouseEnter(event) {
            if (!this.getWithDefault('inDoc', false)) {
                var element = this.get('mappedDOMElement');
                this.get('document.view').scrollToElement(element);
                this.get('sprites').highlight(element);
            }
            event.stopPropagation();
        },

        mouseLeave: function mouseLeave(event) {
            if (!this.getWithDefault('inDoc', false)) {
                this.get('sprites').removeHighlight(this.get('mappedDOMElement'));
            }
            event.stopPropagation();
        },

        //*******************************************************************\\
        //
        //                             Visibility
        //
        //*******************************************************************\\

        hideWidget: (function () {
            if (this.get('data') === null) {
                this.closeWidget();
            }
        }).observes('data'),

        closeWidget: function closeWidget() {
            this.sendAction('close');
            this.reset();
            this.get('document.view').setInteractionsBlocked(false);
            this.destroy();
        },

        hide: function hide() {
            this.$(this.element).css('display', 'none');
        },

        show: function show() {
            this.$(this.element).css('display', 'block');
        },

        showAnnotation: (function () {
            var data = this.get('data');
            if (data && (data.annotations || data.ignore && this.get('inDoc'))) {
                return true;
            }
            return false;
        }).property('data.ignore', 'data.annotations'),

        updateSprite: (function () {
            var text = [],
                data = this.get('data'),
                annotations = this.get('data.annotations');
            if (!data || data.ignore && !data.annotations) {
                return;
            }
            for (var key in annotations) {
                if (annotations[key]) {
                    text.push(key + ' > ' + annotations[key]);
                }
            }
            if (text.length < 1) {
                text = 'No Mappings';
            } else {
                text = text.join(', ');
            }
            this.get('sprites').addSprite(this.get('mappedDOMElement'), text);
        }).observes('sprite'),

        updateIgnore: (function () {
            var data = this.get('data');
            if (!data || !data.ignore) {
                return;
            }
            this.get('sprites').addIgnore(this.get('mappedDOMElement'), data.ignore_beneath);
        }).observes('sprite'),

        positionWidget: function positionWidget() {
            if (this.get('inDoc')) {
                var x = this.get('pos.x'),
                    y = this.get('pos.y');
                if (x > window.innerWidth - 350) {
                    x = window.innerWidth - 350;
                }
                if (y > window.innerHeight - 230) {
                    y = window.innerHeight - 230;
                }
                Ember['default'].$(this.get('element')).css({ 'top': Math.max(y, 50),
                    'left': Math.max(x - 100, 50) });
                this.get('document.view').setInteractionsBlocked(true);
            }
        },

        //*******************************************************************\\
        //
        //                             Data State
        //
        //*******************************************************************\\

        mappings: (function () {
            var mappings = [],
                annotations = this.get('data.annotations'),
                required = this.get('data.required'),
                attributes = this.get('attributeValues'),
                nameMap = this.get('fieldIdNameMap');
            for (var key in annotations) {
                var value = annotations[key],
                    annotation = Ember['default'].Object.create({
                    field: value,
                    attribute: key,
                    required: required.indexOf(value) >= 0
                });
                if (value in nameMap) {
                    annotation.field = nameMap[value];
                }
                if (/_sticky+/.test('' + annotation.field)) {
                    annotation.field = '#sticky';
                }
                if (key in attributes) {
                    annotation.content = attributes[key].substring(0, 400);
                }
                mappings.push(annotation);
            }
            return mappings;
        }).property('data.annotations', 'data.required', 'mappedElement', 'refreshMapped'),

        subElementIgnores: (function () {
            var mappedElement = this.get('mappedElement');
            var ignores = this.get('pluginState.ignores').filter(function (ignore) {
                return mappedElement.find('[data-tagid=' + ignore.tagid + ']').length;
            });
            return ignores;
        }).property('mappedElement', 'pluginState.ignores.@each'),

        fieldIdNameMap: (function () {
            return this._makeFieldMap('id', 'name');
        }).property('item.fields.@each'),

        fieldNameIdMap: (function () {
            return this._makeFieldMap('name', 'id');
        }).property('item.fields.@each'),

        _makeFieldMap: function _makeFieldMap(from, to) {
            var fields = this.get('item.fields') || [],
                map = {};
            fields.forEach(function (field) {
                map[field.get(from)] = field.get(to);
            });
            return map;
        },

        setData: function setData() {
            var tagid,
                annotation,
                generatedData = {};
            if (this.get('data')) {
                return;
            }
            var element = this.get('mappedElement');
            this.set('mappedDOMElement', element.get(0));
            if (element.prop('tagName') === 'INS') {
                generatedData = this.findGeneratedAnnotation();
                tagid = generatedData.tagid;
                annotation = this.get('alldata').findBy('tagid', tagid);
            } else {
                tagid = element.data('tagid');
                annotation = this.get('alldata').findBy('tagid', tagid);
            }
            if (annotation) {
                var annotations = annotation.annotations || {},
                    required = annotation.required || [];
                this.set('data', annotation);
                this.set('data.annotations', annotations);
                this.set('data.required', required);
                this.set('data.variant', this.getWithDefault('data.variant', 0));
            } else {
                this.set('data', this.createAnnotationData(generatedData));
                this.get('alldata').unshiftObject(this.get('data'));
            }
            if (this.get('data.generated')) {
                this.get('mappedElement').attr('data-genid', this.get('data').id);
            }
        },

        setIgnores: function setIgnores() {
            var ignoreData, elem, ignores;
            if (!this.get('pluginState').ignores) {
                ignores = [];
                ignoreData = this.get('alldata').filter(function (item) {
                    return item['ignore'];
                });
                ignoreData.forEach(function (data) {
                    elem = this.get('document.iframe').find('[data-tagid=' + data.tagid + ']');
                    ignores.addObject(Ember['default'].Object.create({
                        id: data.id,
                        tagid: data.tagid,
                        element: elem,
                        ignoreBeneath: data.ignore_beneath
                    }));
                }, this);
                this.set('pluginState.ignores', ignores);
                this.updateData('pluginState');
            }
        },

        mapToElement: function mapToElement() {
            if (!this.get('mappedElement') && this.get('data')) {
                var data = this.get('data'),
                    id = data.id,
                    generated = data.generated,
                    insertAfter = data.insert_after,
                    tagid = data.tagid;
                if (generated) {
                    var elem = this.get('document.iframe').find('[data-genid=' + id + ']');
                    if (elem.length < 1) {
                        if (insertAfter) {
                            elem = this.get('document.iframe').find('[data-tagid=' + tagid + ']').parent().find('ins');
                        } else {
                            elem = this.get('document.iframe').find('[data-tagid=' + tagid + ']').siblings('ins');
                        }
                    }
                    this.set('mappedElement', elem);
                } else {
                    this.set('mappedElement', this.get('document.iframe').find('[data-tagid=' + tagid + ']'));
                }
                this.set('mappedDOMElement', this.get('mappedElement').get(0));
            }
            this.notifyPropertyChange('sprite');
        },

        mapToNewElement: function mapToNewElement(elem) {
            var jqElem = Ember['default'].$(elem),
                boundingBox = jqElem.boundingBox();
            this.get('sprites').removeSprite(this.get('mappedDOMElement'));
            this.get('sprites').removeIgnore(this.get('mappedDOMElement'));
            if (this.get('mappedDOMElement').tagName === 'INS') {
                this.get('mappedElement').removePartialAnnotation();
            }
            this.set('mappedElement', jqElem);
            var newData = this.createAnnotationData(),
                existingData = this.get('alldata').findBy('tagid', newData.tagid);
            if (existingData && existingData.length > 0) {
                this.get('alldata').removeObject(this.get('data'));
                this.set('data', existingData.get(0));
                this.notifyPropertyChange('data.annotations');
                this.notifyPropertyChange('data.required');
                this.notifyPropertyChange('data.tagid');
            } else {
                this.set('data.variant', newData.variant);
                this.set('data.tagid', newData.tagid);
                this.set('data.required', newData.required);
                this.set('data.annotations', newData.annotations);
            }
            this.setData();
            this.setIgnores();
            this.mapToElement();
            this.get('document.view').scrollToElement(elem);
            this.set('pos', { x: boundingBox.top, y: boundingBox.left });
            this.updateExtractedFields();
            this.positionWidget();
            this.setState(false, false, true);
        },

        //*******************************************************************\\
        //
        //                               Utils
        //
        //*******************************************************************\\

        findGeneratedAnnotation: function findGeneratedAnnotation() {
            var element = this.get('mappedElement'),
                elem = element.get(0),
                previous_tag = element.prev(),
                insert_after = true,
                nodes,
                node;
            // Next nearest tag is the parent of this element
            if (previous_tag.length === 0) {
                previous_tag = element.parent();
                nodes = previous_tag[0].childNodes;
                insert_after = false;
            } else {
                // Find the next nearest non generated tag
                while (previous_tag.prop('tagName') === 'INS') {
                    previous_tag = previous_tag.prev();
                }
                // If there is only another ins tag before the parent
                if (previous_tag.length === 0) {
                    previous_tag = element.parent();
                    insert_after = false;
                    node = previous_tag[0].childNodes[0];
                } else {
                    node = previous_tag[0].nextSibling;
                }
                // Loop over all text nodes and generated tags until the
                // next tag is found
                nodes = [];
                while (node) {
                    nodes.push(node);
                    node = node.nextSibling;
                    if (node === null || node.nodeType === node.ELEMENT_NODE && node.tagName !== 'INS') {
                        break;
                    }
                }
            }
            var a = { tagid: previous_tag.data('tagid'),
                generated: true,
                insert_after: insert_after },
                last_node_ins = false,
                start = 0;
            // Calculate the length and start position of the slice
            // ignoring the ins tag and with leading whitespace removed
            for (var idx = 0; idx < nodes.length; idx++) {
                node = nodes[idx];
                if (node.nodeType === node.ELEMENT_NODE && node.tagName === 'INS') {
                    last_node_ins = true;
                    if (node === elem) {
                        a['slice'] = [start, start + node.innerHTML.length];
                        break;
                    } else {
                        // No need to strip ins elements
                        start += node.innerHTML.length;
                    }
                } else {
                    // Need to remove external whitespace so that there
                    // is no ambiguity in the start position of the
                    // slice
                    if (last_node_ins) {
                        start += node.textContent.length;
                    } else {
                        start += node.textContent.lstrip().length;
                    }
                    last_node_ins = false;
                }
            }
            return a;
        },

        createHierarchy: function createHierarchy(elements, forward) {
            var elementsArr = [],
                resultArr = [];
            for (var i = 0; i < elements.length; i++) {
                if (forward) {
                    elementsArr.push(elements.get(i));
                } else {
                    elementsArr.unshift(elements.get(i));
                }
            }
            var previousElem;
            if (elements.length > 1) {
                previousElem = elements[1];
            }
            elementsArr.forEach(function (elem) {
                var jqElem = Ember['default'].$(elem),
                    attributes = jqElem.getAttributeList();
                if (attributes.length < 1) {
                    return;
                }
                resultArr.push({
                    label: jqElem.prop('tagName').toLowerCase(),
                    hovered: false,
                    separator: Ember['default'].$.inArray(previousElem, jqElem.siblings()) !== -1 ? '' : 'chevron-right',
                    data: {
                        element: elem
                    }
                });
                previousElem = elem;
            });
            return resultArr;
        },

        topLeftIcon: (function () {
            var base = 'fa fa-icon fa-',
                icon = this.get('showingBasic') ? 'cogs' : 'arrow-left';
            return base + icon;
        }).property('showingBasic'),

        topLeftAction: (function () {
            return this.get('showingBasic') ? 'showAdvanced' : 'backToMain';
        }).property('showingBasic'),

        createFieldDisabled: (function () {
            return (this.get('newFieldName') + '').trim().length < 1;
        }).property('newFieldName'),

        setState: function setState(field, advanced, basic) {
            this.set('creatingField', field);
            this.set('showingAdvanced', advanced);
            this.set('showingBasic', basic);
        },

        createNewField: function createNewField() {
            var fieldName = this.get('newFieldName'),
                fieldType = this.get('newFieldType'),
                attrIndex = this.get('createNewIndex');
            if (fieldName && fieldName.length > 0 && fieldType) {
                this.set('newFieldType', null);
                this.set('newFieldName', null);
                this.set('createNewIndex', null);
                this.set('guessedName', null);
                this.set('guessedType', null);
                this.set('defaultName', null);
                this.sendAction('createField', this.get('item'), fieldName, fieldType);
                this.setAttr(attrIndex, fieldName, 'field');
                this.setState(false, false, true);
            }
        },

        addNewMapping: function addNewMapping() {
            var annotations = this.get('data.annotations'),
                attributes = this.get('attributes');
            if (!annotations || attributes.length < 1) {
                return;
            }
            var attribute = this.guessFieldExtraction(this.get('mappedDOMElement'), attributes);
            this.set('guessedAttribute', attribute);
            if (!attribute) {
                attribute = attributes.get(0);
            }
            annotations[attribute] = null;
            this.set('data.annotations', annotations);
            this.notifyPropertyChange('data.annotations');
        },

        setPluginStateVariables: function setPluginStateVariables() {
            if (!this.get('pluginState').maxVariant) {
                var maxVariant = 0;
                this.get('alldata').forEach(function (d) {
                    var variant = d.variant || 0;
                    variant = parseInt(variant);
                    maxVariant = variant > maxVariant ? variant : maxVariant;
                });
                this.set('pluginState.maxVariant', maxVariant);
            }
            if (!this.get('pluginState').maxSticky) {
                var maxSticky = 0;
                this.get('alldata').forEach(function (d) {
                    for (var key in d.annotations) {
                        var value = d.annotations[key];
                        if (/^_sticky/.test(value)) {
                            var sticky = parseInt(value.substring(7));
                            sticky = sticky < 0 ? 0 : sticky;
                            maxSticky = sticky > maxSticky ? sticky : maxSticky;
                        }
                    }
                });
                this.set('pluginState.maxSticky', maxSticky);
            }
            this.updateData('pluginState');
        },

        updateData: function updateData(property) {
            if (!this.get(property)) {
                return;
            }
            this.sendAction('updatePluginData', property, this.get(property));
        },

        //*******************************************************************\\
        //
        //                          Initialization
        //
        //*******************************************************************\\

        setup: (function () {
            this.setData();
            this.setIgnores();
            this.mapToElement();
            this.updateExtractedFields();
            this.setPluginStateVariables();
            if (this.get('inDoc') && Object.keys(this.get('data.annotations')).length < 1) {
                this.addNewMapping();
            }
            this.notifyPropertyChange('sprite');
        }).on('init'),

        reset: function reset() {
            this.set('data', null);
            this.set('mappedElement', null);
            this.set('mappedDOMElement', null);
            this.set('fieldName', null);
            this.set('fieldType', null);
            this.set('showingBasic', true);
            this.set('showingAdvanced', false);
            this.set('creatingField', false);
        },

        didInsertElement: function didInsertElement() {
            this.positionWidget();
            this._super();
            Ember['default'].run.scheduleOnce('afterRender', this, this.afterRenderEvent);
        },

        afterRenderEvent: function afterRenderEvent() {
            this.notifyPropertyChange('sprite');
        }

    });

});
define('portia-web/components/annotations-plugin/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","col-md-3");
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element4 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(element4,1,1);
            var morph1 = dom.createMorphAt(element4,3,3);
            inline(env, morph0, context, "bs-button", [], {"clicked": "delete", "icon": "fa fa-icon fa-trash", "title": "Delete Annotation", "type": "danger", "size": "xs"});
            inline(env, morph1, context, "bs-button", [], {"clicked": "dismiss", "icon": "fa fa-icon fa-close", "title": "Finish Editing", "size": "xs"});
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","col-md-1");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","col-md-1");
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [3]),1,1);
            inline(env, morph0, context, "bs-button", [], {"clicked": "delete", "icon": "fa fa-icon fa-trash", "title": "Delete Annotation", "type": "danger", "size": "xs"});
            return fragment;
          }
        };
      }());
      var child2 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                    Add\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"style","margin-top:10px");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","row");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-1");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-4 small-label");
            var el3 = dom.createTextNode("Field Name");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-4 small-label");
            var el3 = dom.createTextNode("Field Type");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-3 small-label");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","row");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-1");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-4");
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-4");
            dom.setAttribute(el2,"style","margin-top:3px;");
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-md-3");
            dom.setAttribute(el2,"style","margin-top:4px;");
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element3 = dom.childAt(fragment, [5]);
            var morph0 = dom.createMorphAt(dom.childAt(element3, [3]),1,1);
            var morph1 = dom.createMorphAt(dom.childAt(element3, [5]),1,1);
            var morph2 = dom.createMorphAt(dom.childAt(element3, [7]),1,1);
            inline(env, morph0, context, "text-field", [], {"action": "createField", "update": "updateNewFieldName", "width": "110px", "placeholder": get(env, context, "guessedName"), "default": get(env, context, "defaultName")});
            inline(env, morph1, context, "item-select", [], {"options": get(env, context, "extractionFieldTypes"), "value": get(env, context, "guessedType"), "changed": "updateNewFieldType", "submit": "createField", "width": "100px"});
            block(env, morph2, context, "bs-button", [], {"clicked": "createField", "icon": "fa fa-icon fa-plus", "size": "xs", "type": "primary", "disabled": get(env, context, "createFieldDisabled")}, child0, null);
            return fragment;
          }
        };
      }());
      var child3 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("span");
                dom.setAttribute(el2,"class","small-label");
                var el3 = dom.createTextNode("Parents:");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n            ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),3,3);
                inline(env, morph0, context, "j-breadcrumbs", [], {"breadcrumbs": get(env, context, "parents"), "clicked": "elementClicked", "elementHovered": "elementHovered"});
                return fragment;
              }
            };
          }());
          var child1 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("span");
                dom.setAttribute(el2,"class","small-label");
                var el3 = dom.createTextNode("Children:");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n            ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),3,3);
                inline(env, morph0, context, "j-breadcrumbs", [], {"breadcrumbs": get(env, context, "children"), "clicked": "elementClicked", "elementHovered": "elementHovered"});
                return fragment;
              }
            };
          }());
          var child2 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 2,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","col-xs-10");
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("span");
                dom.setAttribute(el2,"class","btn btn-light btn-sm pattern");
                var el3 = dom.createTextNode("\n                        Ignore Elements Beneath\n                        ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                    ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","col-xs-1 button-align-med");
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement, blockArguments) {
                var dom = env.dom;
                var hooks = env.hooks, set = hooks.set, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [1, 1]),1,1);
                var morph1 = dom.createMorphAt(dom.childAt(fragment, [3]),1,1);
                set(env, context, "ignore", blockArguments[0]);
                set(env, context, "index", blockArguments[1]);
                inline(env, morph0, context, "check-box", [], {"checked": get(env, context, "ignore.ignoreBeneath"), "action": "ignoreBeneath", "name": get(env, context, "index")});
                inline(env, morph1, context, "bs-button", [], {"clicked": "deleteIgnore", "clickedParam": get(env, context, "index"), "icon": "fa fa-icon fa-trash", "type": "danger", "size": "xs"});
                return fragment;
              }
            };
          }());
          var child3 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                Select Ignores\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","row");
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-md-2 small-label");
              dom.setAttribute(el2,"style","margin-top:4px;");
              var el3 = dom.createTextNode("Variant:");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-md-10");
              var el3 = dom.createTextNode("\n                ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n            ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n        ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","scrolling-container");
              dom.setAttribute(el1,"style","max-height:60px;");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("        ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px;margin-left:114px;");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("        ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
              var morph1 = dom.createMorphAt(fragment,1,1,contextualElement);
              var morph2 = dom.createMorphAt(dom.childAt(fragment, [3, 3]),1,1);
              var morph3 = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
              var morph4 = dom.createMorphAt(dom.childAt(fragment, [7]),1,1);
              dom.insertBoundary(fragment, 0);
              block(env, morph0, context, "if", [get(env, context, "parents")], {}, child0, null);
              block(env, morph1, context, "if", [get(env, context, "children")], {}, child1, null);
              inline(env, morph2, context, "item-select", [], {"options": get(env, context, "variantList"), "value": get(env, context, "data.variant"), "changed": "updateVariant", "width": "82px"});
              block(env, morph3, context, "each", [get(env, context, "subElementIgnores")], {}, child2, null);
              block(env, morph4, context, "bs-button", [], {"clicked": "ignoreElement", "size": "xs", "type": "info", "title": "Select sub elements to ignore"}, child3, null);
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 2,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","row");
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"class","col-md-3");
                var el3 = dom.createTextNode("\n                        ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                    ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"class","col-md-4");
                dom.setAttribute(el2,"style","width:115px;max-height:80px;overflow:hidden;text-overflow:ellipsis;");
                var el3 = dom.createTextNode("\n                        ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                    ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"class","col-md-3");
                var el3 = dom.createTextNode("\n                        ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                    ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"class","col-md-1");
                var el3 = dom.createTextNode("\n                        ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                        ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                    ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"style","margin:5px;border:1px solid #ccc;");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement, blockArguments) {
                var dom = env.dom;
                var hooks = env.hooks, set = hooks.set, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var element0 = dom.childAt(fragment, [1]);
                var element1 = dom.childAt(element0, [7]);
                var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
                var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
                var morph2 = dom.createMorphAt(dom.childAt(element0, [5]),1,1);
                var morph3 = dom.createMorphAt(element1,1,1);
                var morph4 = dom.createMorphAt(element1,3,3);
                set(env, context, "annotation", blockArguments[0]);
                set(env, context, "index", blockArguments[1]);
                inline(env, morph0, context, "item-select", [], {"options": get(env, context, "attributes"), "value": get(env, context, "annotation.attribute"), "changed": "updateAttribute", "width": "82px", "name": get(env, context, "index"), "addSelected": true});
                inline(env, morph1, context, "collapsible-text", [], {"fullText": get(env, context, "annotation.content"), "trimTo": 100, "title": get(env, context, "annotation.content")});
                inline(env, morph2, context, "item-select", [], {"options": get(env, context, "itemFields"), "value": get(env, context, "annotation.field"), "changed": "updateField", "width": "82px", "name": get(env, context, "index")});
                inline(env, morph3, context, "check-box", [], {"checked": get(env, context, "annotation.required"), "action": "updateRequired", "name": get(env, context, "index"), "value": get(env, context, "annotation.required"), "style": "margin:3px;"});
                inline(env, morph4, context, "bs-button", [], {"clicked": "removeMapping", "clickedParam": get(env, context, "index"), "icon": "fa fa-icon fa-times", "size": "xs", "type": "danger", "title": "Remove Mapping"});
                return fragment;
              }
            };
          }());
          var child1 = (function() {
            var child0 = (function() {
              return {
                isHTMLBars: true,
                revision: "Ember@1.11.3",
                blockParams: 0,
                cachedFragment: null,
                hasRendered: false,
                build: function build(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("                            Field\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                render: function render(context, env, contextualElement) {
                  var dom = env.dom;
                  dom.detectNamespace(contextualElement);
                  var fragment;
                  if (env.useFragmentCache && dom.canClone) {
                    if (this.cachedFragment === null) {
                      fragment = this.build(dom);
                      if (this.hasRendered) {
                        this.cachedFragment = fragment;
                      } else {
                        this.hasRendered = true;
                      }
                    }
                    if (this.cachedFragment) {
                      fragment = dom.cloneNode(this.cachedFragment, true);
                    }
                  } else {
                    fragment = this.build(dom);
                  }
                  return fragment;
                }
              };
            }());
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"style","margin-top:10px");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n                ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","row");
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"class","col-md-4");
                var el3 = dom.createTextNode("\n");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("                    ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, block = hooks.block;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [3, 1]),1,1);
                block(env, morph0, context, "bs-button", [], {"clicked": "addNewMapping", "icon": "fa fa-icon fa-plus", "title": "Extract unmapped attributes", "size": "xs", "type": "primary"}, child0, null);
                return fragment;
              }
            };
          }());
          var child2 = (function() {
            var child0 = (function() {
              return {
                isHTMLBars: true,
                revision: "Ember@1.11.3",
                blockParams: 0,
                cachedFragment: null,
                hasRendered: false,
                build: function build(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("                    Done\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                render: function render(context, env, contextualElement) {
                  var dom = env.dom;
                  dom.detectNamespace(contextualElement);
                  var fragment;
                  if (env.useFragmentCache && dom.canClone) {
                    if (this.cachedFragment === null) {
                      fragment = this.build(dom);
                      if (this.hasRendered) {
                        this.cachedFragment = fragment;
                      } else {
                        this.hasRendered = true;
                      }
                    }
                    if (this.cachedFragment) {
                      fragment = dom.cloneNode(this.cachedFragment, true);
                    }
                  } else {
                    fragment = this.build(dom);
                  }
                  return fragment;
                }
              };
            }());
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"style","margin-left:142px;");
                var el2 = dom.createTextNode("\n");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("            ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, block = hooks.block;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
                block(env, morph0, context, "bs-button", [], {"clicked": "dismiss", "icon": "fa fa-icon fa-check", "size": "xs", "type": "success"}, child0, null);
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","row");
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-md-3 small-label");
              var el3 = dom.createTextNode("Attribute");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-md-4 small-label");
              var el3 = dom.createTextNode("Value");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-md-2 small-label");
              var el3 = dom.createTextNode("Field");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-md-3 small-label");
              var el3 = dom.createTextNode("Required");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n        ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","scrolling-container");
              dom.setAttribute(el1,"style","max-height: 100px;");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("        ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("    ");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element2 = dom.childAt(fragment, [7]);
              var morph0 = dom.createMorphAt(element2,1,1);
              var morph1 = dom.createMorphAt(element2,2,2);
              var morph2 = dom.createMorphAt(fragment,9,9,contextualElement);
              block(env, morph0, context, "each", [get(env, context, "mappings")], {}, child0, null);
              block(env, morph1, context, "if", [get(env, context, "attributes")], {}, child1, null);
              block(env, morph2, context, "if", [get(env, context, "inDoc")], {}, child2, null);
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "showingAdvanced")], {}, child0, child1);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-md-1");
          var el3 = dom.createTextNode("\n            ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-md-8");
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element5 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element5, [1]),1,1);
          var morph1 = dom.createMorphAt(element5,5,5);
          var morph2 = dom.createMorphAt(fragment,3,3,contextualElement);
          dom.insertBoundary(fragment, null);
          inline(env, morph0, context, "bs-button", [], {"clicked": get(env, context, "topLeftAction"), "icon": get(env, context, "topLeftIcon"), "size": "xs"});
          block(env, morph1, context, "if", [get(env, context, "inDoc")], {}, child0, child1);
          block(env, morph2, context, "if", [get(env, context, "creatingField")], {}, child2, child3);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "showAnnotation")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/bread-crumbs', ['exports', 'ember', 'ember-breadcrumbs/components/bread-crumbs'], function (exports, Ember, BreadCrumbs) {

	'use strict';

	exports['default'] = BreadCrumbs['default'];

});
define('portia-web/components/bs-badge', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    tagName: 'span',
    classNameBindings: ['class'],
    classNames: ['badge']
  });

});
define('portia-web/components/bs-button', ['exports', 'ember', 'portia-web/mixins/popover'], function (exports, Ember, Popover) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend(Popover['default'], {
    clickedParam: null,
    size: null,
    active: false,

    tagName: 'button',
    classNameBindings: ['class'],
    activeType: null,
    inactiveType: null,
    processing: false,

    attributeBindings: ['disabled', 'title', 'width'],

    activeIcon: (function () {
      return this.get('processing') ? 'fa fa-icon fa-circle-o-notch spinner' : this.get('icon');
    }).property('processing'),

    'class': (function () {
      var classes = ['btn', 'btn-' + this.getWithDefault('type', 'default')],
          size = this.get('size');
      if (size) {
        classes.push('btn-' + size);
      }
      return classes.join(' ');
    }).property('type', 'size'),

    typeChanges: (function () {
      this.set('type', this.get('activeType'));
    }).observes('activeType'),

    click: function click() {
      if (this.get('activeType')) {
        if (!this.get('inactiveType')) {
          this.set('inactiveType', this.get('activeType'));
          this.set('activeType', this.getWithDefault('type', 'default'));
        }
        var tmp = this.get('activeType');
        this.set('activeType', this.get('inactiveType'));
        this.set('inactiveType', tmp);
      }
      return this.sendAction('clicked', this.get('clickedParam'));
    }
  });

});
define('portia-web/components/bs-dropdown', ['exports', 'ember', 'portia-web/mixins/modal-handler'], function (exports, Ember, ModalHandler) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(ModalHandler['default'], {
        tagName: 'div',
        classNames: 'btn-group',
        classNameBindings: ['isOpen:open'],
        iconClasses: 'fa fa-icon fa-sliders',

        setUp: (function () {
            this.close();
            this.set('actions', this.getWithDefault('actions', []));
        }).on('init'),

        toggle: (function () {
            return this.get('isOpen') ? 'open' : '';
        }).property('isOpen'),

        close: function close() {
            this.set('isOpen', false);
        },

        mouseDown: function mouseDown() {
            this.maintainFocus = true;
            Ember['default'].run.next(this, function () {
                delete this.maintainFocus;
            });
        },

        focusOut: function focusOut() {
            if (!this.maintainFocus) {
                this.close();
            }
        },

        actions: {
            clicked: function clicked() {
                this.set('isOpen', !this.get('isOpen'));
            },

            close: function close() {
                this.close();
            },

            openModal: function openModal(action) {
                this.close();
                this.set('_modalName', 'name');
                this.showComponentModal(action.title, action.modal, action, action.okCallback, action.cancelCallback, action.button_class, action.button_text);
            },

            closeModal: function closeModal() {
                return this.ModalManager.get('name').destroy();
            }
        }
    });

});
define('portia-web/components/bs-label', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        attributeBindings: ['content'],
        tagName: 'span',
        classNames: 'label',
        classNameBindings: ['labelType'],

        labelType: (function () {
            return 'label-' + this.getWithDefault('type', 'default');
        }).property('type')
    });

});
define('portia-web/components/bs-modal', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(Ember['default'].Evented, {
        layoutName: 'components/bs-modal',
        classNames: ['modal'],
        classNameBindings: ['fade', 'isVis:in'],
        attributeBindings: ['role', 'aria-labelledby', 'isAriaHidden:aria-hidden', 'ariaLabelledBy:aria-labelledby'],

        isAriaHidden: (function () {
            return '' + this.get('isVisible');
        }).property('isVisible'),

        modalBackdrop: '<div class="modal-backdrop fade in"></div>',
        role: 'dialog',
        footerViews: [],
        backdrop: true,
        title: null,
        isVisible: false,
        manual: false,
        isVis: false,
        fullSizeButtons: false,
        fade: true,

        didInsertElement: function didInsertElement() {
            var name;
            this._super();
            this.setupBinders();
            name = this.get('name');
            Ember['default'].assert('Modal name is required for modal view ' + this.get('elementId'), this.get('name'));
            if (name == null) {
                name = this.get('elementId');
            }
            this.ModalManager.add(name, this);
            if (this.manual) {
                return this.show();
            }
        },

        becameVisible: function becameVisible() {
            Ember['default'].$('body').addClass('modal-open');
            if (this.get('backdrop')) {
                return this.appendBackdrop();
            }
        },

        becameHidden: function becameHidden() {
            Ember['default'].$('body').removeClass('modal-open');
            if (this._backdrop) {
                return this._backdrop.remove();
            }
        },

        appendBackdrop: function appendBackdrop() {
            var parentElement;
            parentElement = this.$().parent();
            return this._backdrop = Ember['default'].$(this.modalBackdrop).appendTo(parentElement);
        },

        show: function show() {
            var current;
            this.set('isVisible', true);
            current = this;
            Ember['default'].run.later(function () {
                current.set('isVis', true);
            }, 15);
        },

        hide: function hide() {
            var current;
            this.set('isVis', false);
            current = this;
            this.$().one('webkitTransitionEnd', function () {
                current.set('isVisible', false);
            });
            return false;
        },

        toggle: function toggle() {
            return this.toggleProperty('isVisible');
        },

        click: function click(event) {
            var target, targetDismiss;
            target = event.target;
            targetDismiss = target.getAttribute('data-dismiss');
            if (targetDismiss === 'modal') {
                return this.close();
            }
        },

        keyPressed: function keyPressed(event) {
            if (event.keyCode === 27) {
                return this.close(event);
            }
        },

        close: function close() {
            var current;
            this.set('isVis', false);
            current = this;
            this.$().one('webkitTransitionEnd', function () {
                if (current.get('manual')) {
                    current.destroy();
                } else {
                    current.hide();
                }
            });
            return this.trigger('closed');
        },

        willDestroyElement: function willDestroyElement() {
            var name;
            Ember['default'].$('body').removeClass('modal-open');
            this.removeHandlers();
            name = this.get('name');
            if (name == null) {
                name = this.get('elementId');
            }
            this.ModalManager.remove(name, this);
            if (this._backdrop) {
                return this._backdrop.remove();
            }
        },

        removeHandlers: function removeHandlers() {
            return Ember['default'].$(window.document).unbind('keyup', this._keyUpHandler);
        },

        setupBinders: function setupBinders() {
            var handler;
            handler = (function (_this) {
                return function (event) {
                    return _this.keyPressed(event);
                };
            })(this);
            Ember['default'].$(window.document).bind('keyup', handler);
            return this._keyUpHandler = handler;
        }
    });

});
define('portia-web/components/bs-notifications', ['exports', 'ember', 'portia-web/utils/notification-manager'], function (exports, Ember, NotificationManager) {

    'use strict';

    var NotificationsView = Ember['default'].CollectionView.extend({
        classNames: ['notifications'],
        content: NotificationManager['default'].content,

        itemViewClass: Ember['default'].View.extend({
            classNames: ['alert', 'notification'],
            classNameBindings: ['alertType'],
            templateName: 'components/bs-notification',
            isVisible: false,
            showTime: 5000,
            fadeInTime: 400,
            fadeOutTime: 400,
            timeoutId: null,

            alertType: (function () {
                return 'alert-' + (this.get('content.type') || 'info');
            }).property('content.type'),

            didInsertElement: function didInsertElement() {
                var _this = this;
                return this.$().fadeIn(this.get('fadeInTime'), function () {
                    _this.set('timeoutId', setTimeout(function () {
                        _this.fadeOut();
                    }, _this.get('showTime')));
                });
            },

            fadeOut: function fadeOut() {
                var _this = this;
                clearTimeout(this.get('timeoutId'));
                return this.$().animate({ opacity: 0 }, this.get('fadeOutTime'), function () {
                    _this.$().slideUp(_this.get('fadeOutTime'), function () {
                        _this.get('parentView.content').removeObject(_this.get('content'));
                    });
                });
            },

            click: function click() {
                this.fadeOut();
            },

            actions: {
                close: function close() {
                    return this.fadeOut();
                }
            }
        })
    });

    exports['default'] = NotificationsView;

});
define('portia-web/components/check-box', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        attributeBindings: ['type', 'value', 'style'],
        classNames: ['offset-checkbox'],
        tagName: 'input',
        type: 'checkbox',
        checked: false,
        disabled: false,

        initState: (function () {
            this.$().prop('checked', this.get('checked'));
            this.$().prop('disabled', this.get('disabled'));
        }).on('didInsertElement'),

        _updateElementValue: function _updateElementValue() {
            this.set('checked', this.$().prop('checked'));
        },

        change: function change() {
            this._updateElementValue();
            this.sendAction('action', this.get('value'), this.get('checked'), this.get('name'));
        }
    });

});
define('portia-web/components/closable-accordion', ['exports', 'ember-idx-accordion/accordion'], function (exports, AccordionComponent) {

    'use strict';

    exports['default'] = AccordionComponent['default'].extend({
        select: function select(item) {
            if (!item) {
                return;
            }
            if (item === this.get('selected')) {
                this.set('selected', null);
                return this.set('selected-idx', -1);
            } else {
                this.set('selected', item);
                return this.set('selected-idx', item.get('index'));
            }
        }
    });

});
define('portia-web/components/collapsible-text', ['exports', 'ember', 'portia-web/mixins/popover'], function (exports, Ember, Popover) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(Popover['default'], {
        fullText: null,
        tagName: 'span',
        collapsed: true,
        trimTo: 400,

        collapsible: (function () {
            return this.get('fullText') && this.get('fullText').trim().length > this.get('trimTo');
        }).property('fullText', 'trimTo'),

        displayedText: (function () {
            var text = this.get('fullText') || '';
            if (!this.get('collapsed')) {
                return text.trim();
            } else {
                return text.trim().substring(0, this.get('trimTo'));
            }
        }).property('collapsed', 'fullText', 'trimTo'),

        click: function click() {
            this.set('collapsed', !this.get('collapsed'));
        }
    });

});
define('portia-web/components/copy-clipboard', ['exports', 'ember-cli-zero-clipboard/components/zero-clipboard'], function (exports, ZeroClipboard) {

    'use strict';

    exports['default'] = ZeroClipboard['default'].extend({
        layoutName: 'components/bs-button',
        tagName: 'button',
        classNameBindings: 'class',
        'class': 'btn btn-default btn-xs btn-xs-size fa fa-icon fa-clipboard',
        icon: 'fa fa-icon fa-clipboard',

        actions: {
            afterCopy: function afterCopy() {}
        }
    });

});
define('portia-web/components/copy-spider/component', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        watchDestinationProject: (function () {
            this.get('data').params.destinationProject = this.get('destinationProject');
        }).observes('destinationProject'),

        willInsertElement: function willInsertElement() {
            this.get('data').params = {
                spiders: [],
                items: []
            };

            this.get('slyd').getProjectNames().then((function (projects) {
                this.set('projects', projects);
                this.set('destinationProject', projects[0].id);
            }).bind(this));

            this.get('slyd').getSpiderNames().then((function (spiders) {
                this.set('spiders', spiders);
            }).bind(this));

            this.get('slyd').loadItems().then((function (items) {
                this.set('items', items.map(function (item) {
                    return item.name;
                }));
            }).bind(this));
        },

        actions: {
            selectSpider: function selectSpider(spider, isSelected) {
                var params = this.get('data').params;
                if (!isSelected) {
                    params.spiders = params.spiders.without(spider);
                } else if (!params.spiders.contains(spider)) {
                    params.spiders.push(spider);
                }
            },

            selectItem: function selectItem(item, isSelected) {
                var params = this.get('data').params;
                if (!isSelected) {
                    params.items = params.items.without(item);
                } else if (!params.items.contains(item)) {
                    params.items.push(item);
                }
            }
        }
    });

});
define('portia-web/components/copy-spider/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","checkbox");
          var el2 = dom.createTextNode("\n                ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createTextNode("\n                    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n                    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n                ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1, 1]);
          var morph0 = dom.createMorphAt(element1,1,1);
          var morph1 = dom.createMorphAt(element1,3,3);
          inline(env, morph0, context, "check-box", [], {"action": "selectSpider", "value": get(env, context, "this")});
          content(env, morph1, context, "this");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","checkbox");
          var el2 = dom.createTextNode("\n                ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("label");
          var el3 = dom.createTextNode("\n                    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n                    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n                ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n            ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1, 1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var morph1 = dom.createMorphAt(element0,3,3);
          inline(env, morph0, context, "check-box", [], {"action": "selectItem", "value": get(env, context, "this")});
          content(env, morph1, context, "this");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","form-group");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("label");
        dom.setAttribute(el2,"for","targetProject");
        var el3 = dom.createTextNode("Destination Project");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","form-group col-md-6");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3,"for","targetProject");
        var el4 = dom.createTextNode("Spiders");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","form-group col-md-6");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("label");
        dom.setAttribute(el3,"for","targetProject");
        var el4 = dom.createTextNode("Items");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element2 = dom.childAt(fragment, [2]);
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),3,3);
        var morph1 = dom.createMorphAt(dom.childAt(element2, [1]),3,3);
        var morph2 = dom.createMorphAt(dom.childAt(element2, [3]),3,3);
        inline(env, morph0, context, "view", ["select"], {"content": get(env, context, "projects"), "optionValuePath": "content.id", "optionLabelPath": "content.name", "value": get(env, context, "destinationProject"), "id": "targetProject", "class": "form-control"});
        block(env, morph1, context, "each", [get(env, context, "spiders")], {}, child0, null);
        block(env, morph2, context, "each", [get(env, context, "items")], {}, child1, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/display-button-edit-delete', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'div',
        classNames: ['row'],
        text: '',
        name: null,

        actions: {
            saveText: function saveText(text, name) {
                if (arguments.length > 0) {
                    this.set('text', text);
                }
                this.sendAction('save', this.get('text'), name);
            },

            deleteText: function deleteText() {
                this.sendAction('delete', this.get('text'));
            }
        }
    });

});
define('portia-web/components/draggable-button', ['exports', 'portia-web/components/bs-button', 'portia-web/mixins/draggable'], function (exports, BsButton, Draggable) {

    'use strict';

    exports['default'] = BsButton['default'].extend(Draggable['default'], {
        tagName: 'span'
    });

});
define('portia-web/components/dummy-component', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Component.extend({});

});
define('portia-web/components/edit-item', ['exports', 'ember', 'portia-web/mixins/notification-handler'], function (exports, Ember, NotificationHandler) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(NotificationHandler['default'], {
        item: null,
        itemFields: null,
        extractionTypes: [],

        updateFields: (function () {
            this.set('itemFields', (this.getWithDefault('item.fields', []) || []).copy());
        }).on('init'),

        actions: {
            addField: function addField() {
                this.sendAction('addField', this.get('item'));
                this.updateFields();
            },

            deleteField: function deleteField(field) {
                this.sendAction('deleteField', this.get('item'), field);
                this.updateFields();
            },

            'delete': function _delete() {
                this.sendAction('delete', this.get('item'));
            },

            editField: function editField(text, index) {
                if (text == 'url') {
                    var field = this.get('item.fields').get(index);
                    if (field) {
                        field.set('name', this.get('itemFields').get(index).name);
                        this.get('item.fields').replace(index, 1, [field]);
                    }
                    this.showErrorNotification('Naming a field "url" is not allowed as there is already a field with this name');
                    return;
                }
                this.updateFields();
            }
        }
    });

});
define('portia-web/components/edit-items/component', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'a',

        click: function click() {
            this.get('actionData.controller').transitionToRoute('items');
            this.sendAction('clicked');
        }
    });

});
define('portia-web/components/edit-items/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("Edit Items");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/em-accordion-item', ['exports', 'ember-idx-accordion/accordion-item'], function (exports, AccordionItemComponent) {

	'use strict';

	exports['default'] = AccordionItemComponent['default'];

});
define('portia-web/components/em-accordion', ['exports', 'ember-idx-accordion/accordion'], function (exports, AccordionComponent) {

	'use strict';

	exports['default'] = AccordionComponent['default'];

});
define('portia-web/components/extracted-item', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        extractedItem: null,

        fields: (function () {
            return this.get('extractedItem.fields');
        }).property('extractedItem'),

        textFields: (function () {
            return this.get('fields').filter(function (field) {
                return field.get('type') !== 'image';
            });
        }).property('fields'),

        imageFields: (function () {
            return this.get('fields').filter(function (field) {
                return field.get('type') === 'image';
            });
        }).property('fields'),

        variants: (function () {
            return this.get('extractedItem.variants');
        }).property('extractedItem'),

        matchedTemplate: (function () {
            return this.get('extractedItem.matchedTemplate');
        }).property('extractedItem'),

        url: (function () {
            return this.get('extractedItem.url');
        }).property('extractedItem'),

        actions: {
            fetchPage: function fetchPage() {
                this.sendAction('fetchPage', this.get('url'));
            },

            editTemplate: function editTemplate(templateName) {
                this.sendAction('editTemplate', templateName);
            }
        }
    });

});
define('portia-web/components/extractor-dropzone', ['exports', 'ember', 'portia-web/mixins/droppable'], function (exports, Ember, Droppable) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(Droppable['default'], {
        tagName: 'span'
    });

});
define('portia-web/components/file-download/component', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'a',

        click: function click() {
            this.sendAction('clicked');
            if (!this.element.href) {
                this.get('slyd').makeAjaxCall({
                    type: 'POST',
                    url: '/projects',
                    data: { 'cmd': 'download',
                        'args': [this.get('slyd.project'), '*', [0, 10]] },
                    dataType: 'binary'
                }).then((function (blob) {
                    this.element.setAttribute('href', window.URL.createObjectURL(blob));
                    Ember['default'].run.next(this, function () {
                        this.element.click();
                        this.element.removeAttribute('href');
                    });
                }).bind(this));
            }
        }
    });

});
define('portia-web/components/file-download/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("Download");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/inline-editable-text-field', ['exports', 'ember', 'portia-web/mixins/notification-handler'], function (exports, Ember, NotificationHandler) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(NotificationHandler['default'], {
        tagName: 'div',
        classNames: 'class',
        editing: false,
        validation: '.*',
        text: '',
        name: null,

        click: function click() {
            if (!this.get('editing')) {
                this.set('editing', true);
                Ember['default'].run.later((function () {
                    var input = Ember['default'].$(this.get('element')).find('input');
                    input.focus();
                    var value = input.val();
                    input.val('').val(value);
                }).bind(this), 300);
            }
        },

        actions: {
            update: function update(text) {
                this.set('editing', false);
                if (Ember['default'].$.trim(text).length < 1) {
                    return;
                }
                if (text !== this.get('text')) {
                    var re = new RegExp(this.get('validation'), 'g');
                    if (re.test(text)) {
                        this.set('text', text);
                        this.sendAction('action', this.get('text'), this.get('name'));
                    } else {
                        this.showWarningNotification('Validation Error', '"' + text + '" is not a valid name. Names must match "' + this.get('validation') + '".');
                        this.set('editing', true);
                    }
                }
            }
        }
    });

});
define('portia-web/components/inline-help', ['exports', 'ember', 'portia-web/mixins/popover'], function (exports, Ember, Popover) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend(Popover['default'], {
        tagName: 'span',
        message: null,
        html: true,
        attributeBindings: ['name', 'title'],
        classNames: ['fa', 'fa-icon', 'fa-icon', 'fa-info-circle', 'inline-help'],

        title: (function () {
            if (this.get('message')) {
                return this.messages.get(this.get('message'));
            }
        }).property('message')
    });

});
define('portia-web/components/item-select', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        value: null,
        name: null,
        attributeBindings: ['value', 'style'],
        tagName: 'select',
        classNames: ['selectbox'],

        options: [],
        style: (function () {
            var width = this.get('width');
            if (width) {
                return 'width:' + width + ';';
            }
            return '';
        }).property('width'),

        keyUp: function keyUp(e) {
            if (e.which === 13) {
                this.sendAction('submit', this.get('value'), this.get('name'));
            }
        },

        buildOptions: function buildOptions() {
            var selectedValue = this.get('value'),
                defaultValue = [];
            if (!selectedValue) {
                defaultValue = [{ value: '', label: '', selected: true }];
            } else {
                this.sendAction('changed', selectedValue, this.get('name'));
            }
            var seenSelected = false,
                arr = defaultValue.concat(this.get('options').map(function (opt) {
                if (typeof opt === 'string') {
                    opt = { value: opt };
                } else if (opt instanceof Ember['default'].Object) {
                    opt = { value: opt.get('name') };
                }
                if (opt.value === selectedValue) {
                    seenSelected = true;
                }
                return {
                    value: opt.value,
                    label: opt.label || opt.value,
                    selected: opt.value === selectedValue
                };
            }));
            if (!seenSelected && selectedValue && this.get('addSelected')) {
                arr.push({
                    value: selectedValue,
                    label: selectedValue,
                    selected: true
                });
            }
            return arr;
        },

        optionsList: (function () {
            return this.buildOptions();
        }).property('value', 'options'),

        change: function change(e) {
            if (e.type !== 'change') {
                return;
            }
            var originalEvent = e.originalEvent,
                target = originalEvent.explicitOriginalTarget || originalEvent.target,
                changedTo = target.value;
            this.set('value', changedTo);
            this.sendAction('changed', changedTo, this.get('name'));
        }
    });

});
define('portia-web/components/j-breadcrumb', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'li',
        classNames: 'breadcrumbs',
        attributeBindings: 'title',
        html: true,

        label: (function () {
            return this.get('info.label');
        }).property('info.label', 'info'),

        click: function click() {
            this.sendAction('clicked', this.get('info'));
        },

        mouseEnter: function mouseEnter() {
            this.set('info.showFull', true);
            this.sendAction('hovered', this.get('info'), this.get('index'), true);
        },

        mouseLeave: function mouseLeave() {
            this.set('info.showFull', false);
            this.sendAction('hovered', this.get('info'), this.get('index'), false);
        }
    });

});
define('portia-web/components/j-breadcrumbs', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        openOnLeft: true,
        tagName: 'ul',
        classNames: 'breadcrumbs',

        actions: {
            clicked: function clicked(breadcrumb) {
                this.sendAction('clicked', breadcrumb);
            },

            hovered: function hovered(breadcrumb, index, _hovered) {
                this.sendAction('elementHovered', breadcrumb, index, _hovered);
            }
        }
    });

});
define('portia-web/components/json-file-compare', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'span',
        json: null,
        path: '',

        selectedOption: (function () {
            return this.get('conflictedKeyPaths.' + this.get('path'));
        }).property('conflictedKeyPaths'),

        v: function v(json) {
            if (json) {
                return JSON.stringify(json).trim().substring(0, 500);
            } else {
                return '';
            }
        },

        toType: function toType(obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        },

        isObject: (function () {
            return this.toType(this.get('json')) === 'object';
        }).property('json'),

        isConflict: (function () {
            return this.get('isObject') && '__CONFLICT' in this.get('json');
        }).property('json'),

        conflictValues: (function () {
            return [{ key: 'base_val', value: this.v(this.get('json.__CONFLICT.base_val')), label: 'Original' }, { key: 'my_val', value: this.v(this.get('json.__CONFLICT.my_val')), label: 'Your change' }, { key: 'other_val', value: this.v(this.get('json.__CONFLICT.other_val')), label: 'Other change' }];
        }).property('json'),

        resolved: (function () {
            return !!this.get('selectedOption');
        }).property('selectedOption'),

        resolvedValue: (function () {
            return this.v(this.get('json.__CONFLICT.' + this.get('selectedOption')));
        }).property('selectedOption'),

        value: (function () {
            return this.v(this.get('json'));
        }).property('json'),

        entries: (function () {
            if (this.get('json')) {
                return Object.keys(this.get('json')).sort().map((function (key) {
                    return {
                        path: this.get('path') ? this.get('path') + '.' + key : key,
                        key: key,
                        json: this.get('json')[key]
                    };
                }).bind(this));
            } else {
                return null;
            }
        }).property('json'),

        actions: {
            conflictOptionSelected: function conflictOptionSelected(path, option) {
                this.set('conflictedKeyPaths.' + path, option);
                this.sendAction('conflictOptionSelected', path, option);
                this.notifyPropertyChange('conflictedKeyPaths');
            }
        }
    });

});
define('portia-web/components/label-with-tooltip', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'div',
        attributeBindings: ['title']
    });

});
define('portia-web/components/pin-toolbox-button', ['exports', 'ember', 'portia-web/components/bs-button'], function (exports, Ember, BsButton) {

    'use strict';

    exports['default'] = BsButton['default'].extend({
        toolbox: Ember['default'].Object.create(),

        classNameBindings: ['pinned'],

        disabled: (function () {
            return this.get('toolbox.fixed');
        }).property('toolbox.fixed'),

        pinned: (function () {
            return this.get('disabled') || this.get('toolbox.pinned');
        }).property('toolbox.fixed', 'toolbox.pinned'),

        click: function click() {
            this.set('toolbox.pinned', !this.get('toolbox.pinned'));
            if (window.localStorage) {
                localStorage.portia_toolbox_pinned = this.get('toolbox.pinned') ? 'true' : '';
            }
        }
    });

});
define('portia-web/components/regex-text-field-with-button/component', ['exports', 'ember', 'portia-web/components/text-field-with-button', 'portia-web/mixins/notification-handler'], function (exports, Ember, TextFieldWithButton, NotificationHandler) {

    'use strict';

    exports['default'] = TextFieldWithButton['default'].extend(NotificationHandler['default'], {
        actions: {
            sendText: function sendText(text) {
                if (arguments.length > 0 && typeof text === 'string') {
                    this.set('text', text);
                }
                try {
                    new RegExp(this.get('text'));
                    this.sendAction('action', this.get('text'));
                } catch (e) {
                    this.showWarningNotification('Validation Error', '"' + this.get('text') + '" ' + 'is not a valid regular expression');
                    return;
                }
                if (this.get('reset')) {
                    this.$().find('textarea').val('');
                    this.$().find('input[type="text"]').val('');
                }
            }
        }
    });

});
define('portia-web/components/regex-text-field-with-button/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-10");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-2 button-align-sm");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        inline(env, morph0, context, "text-field", [], {"clear": get(env, context, "clear"), "width": "110%", "placeholder": get(env, context, "placeholder"), "action": "sendText", "update": "updateText"});
        inline(env, morph1, context, "bs-button", [], {"clicked": "sendText", "icon": "fa fa-icon fa-plus", "disabled": get(env, context, "disabled"), "type": "primary", "size": "xs"});
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/scrapinghub-branding/component', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        data: {},
        project: null,

        url: (function () {
            if (this.get('project')) {
                return [this.get('data.url'), 'p', this.get('project')].join('/');
            }
            return this.get('data.url');
        }).property('data.url', 'project')
    });

});
define('portia-web/components/scrapinghub-branding/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"style","position:absolute;top:4px;right:4px;");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("img");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [1]);
        var attrMorph0 = dom.createAttrMorph(element0, 'href');
        var attrMorph1 = dom.createAttrMorph(element1, 'src');
        attribute(env, attrMorph0, element0, "href", concat(env, [get(env, context, "url")]));
        attribute(env, attrMorph1, element1, "src", concat(env, [get(env, context, "data.logo_url")]));
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/scrapinghub-help/component', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        init: function init() {
            var username = this.get('slyd.username'),
                appId = this.get('data.app_id');
            if (!username || !appId) {
                return;
            }
            window.intercomSettings = {
                app_id: appId,
                user_id: username
            };
            var w = window;
            var d = document;
            var i = function i() {
                i.c(arguments);
            };
            i.q = [];
            i.c = function (args) {
                i.q.push(args);
            };
            w.Intercom = i;
            var s = d.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = 'https://widget.intercom.io/widget/' + appId;
            var x = d.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
        }
    });

});
define('portia-web/components/scrapinghub-help/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/components/text-area-with-button', ['exports', 'portia-web/components/text-field-with-button'], function (exports, TextFieldWithButton) {

    'use strict';

    exports['default'] = TextFieldWithButton['default'].extend({
        outerClasses: ['box-spacer'],
        classNameBindings: ['outerClasses']
    });

});
define('portia-web/components/text-area', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'textarea',
        attributeBindings: ['placeholder', 'style', 'name', 'value'],
        classNames: 'textarea',
        width: null,
        placeholder: null,
        resize: false,
        max_height: null,
        name: null,
        splitlines: false,
        clear: null,
        value: null,
        submitOnEnter: true,

        style: (function () {
            var attrs = [],
                width = this.get('width'),
                resize = this.get('resize'),
                max_height = this.get('max_height');
            if (width) {
                attrs.push('width:' + width);
            }
            if (resize) {
                attrs.push('resize:' + resize);
            }
            if (max_height) {
                attrs.push('max-height:' + max_height);
            }
            if (attrs.length === 0) {
                return;
            }
            attrs.push('');
            return attrs.join(';');
        }).property('width', 'resize', 'max_height'),

        keyUp: function keyUp(e) {
            if (e.which === 13 && this.getWithDefault('submitOnEnter', true)) {
                var text = this.get('element').value,
                    split = [];
                if (this.get('splitlines')) {
                    text = text.split(/\r?\n/);
                    for (var i = 0; i < text.length; i++) {
                        if (text[i].length > 0) {
                            split.push(text[i]);
                        }
                    }
                    this.sendAction('action', split, this.get('name'));
                } else {
                    this.sendAction('action', text, this.get('name'));
                }
            }
            this.change();
        },

        change: function change() {
            this.sendAction('update', this.get('element').value, this.get('name'));
        },

        paste: function paste() {
            this.change();
        }
    });

});
define('portia-web/components/text-field-dropdown-button', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'div',
        bindAttributes: ['class'],
        options: [],
        placeholder: '',

        actions: {
            save: function save(text) {
                if (arguments.length > 0 && typeof text === 'string') {
                    this.set('text', text);
                }
                this.sendAction('action', this.get('text'), this.get('option'));
                if (this.get('reset')) {
                    this.$().find('textarea').val('');
                    this.$().find('input[type="text"]').val('');
                }
            },

            updateText: function updateText(text) {
                this.set('text', text);
            },

            updateOption: function updateOption(option) {
                this.set('option', option);
            }
        }
    });

});
define('portia-web/components/text-field-with-button', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        outerClasses: ['row'],
        tagName: 'div',
        classNameBindings: ['outerClasses'],
        text: null,
        placeholder: '',

        disabled: (function () {
            return Ember['default'].$.trim(this.get('text')).length < 1;
        }).property('text'),

        setValue: (function () {
            this.$().find('textarea').val(this.get('data'));
            this.set('text', this.get('data'));
        }).observes('data'),

        actions: {
            sendText: function sendText(text) {
                if (arguments.length > 0 && typeof text === 'string') {
                    this.set('text', text);
                }
                this.sendAction('action', this.get('text'));
                if (this.get('reset')) {
                    this.$().find('textarea').val('');
                    this.$().find('input[type="text"]').val('');
                }
            },

            updateText: function updateText(text) {
                this.set('text', text);
            }
        }
    });

});
define('portia-web/components/text-field', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        tagName: 'input',
        type: 'text',
        value: '',
        name: null,
        width: null,
        placeholder: null,
        clear: false,
        attributeBindings: ['type', 'disabled', 'placeholder', 'style', 'value'],
        classNames: ['form-control', 'input-sm'],

        setValue: (function () {
            if (this.get('value')) {
                this.get('element').value = this.get('value');
            }
        }).on('didInsertElement'),

        style: (function () {
            var width = this.get('width');
            if (width) {
                return 'width:' + width + ';';
            }
            return '';
        }).property('width'),

        keyUp: function keyUp(e) {
            if (e.which === 13) {
                if (this.get('saveOnExit')) {
                    // XXX: Focusout will trigger to avoid double save
                    Ember['default'].$(this.get('element')).trigger('focusout');
                } else {
                    this.sendAction('action', this.get('element').value, this.get('name'));
                }
                if (this.get('clear')) {
                    this.get('element').value = '';
                    this.set('clear', false);
                }
            }
            this.change();
        },

        focusOut: function focusOut() {
            if (this.get('saveOnExit') && this.get('element')) {
                this.sendAction('action', this.get('element').value, this.get('name'));
            }
            if (this.get('clear')) {
                this.get('element').value = '';
                this.set('clear', false);
            }
            this.change();
        },

        change: function change() {
            if (this.get('element')) {
                this.sendAction('update', this.get('element').value, this.get('name'));
            }
        },

        didInsertElement: function didInsertElement() {
            this._super();
            this.$().focus();
        }
    });

});
define('portia-web/components/tool-box', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        classNameBindings: ['fixed:toolbox-fixed'],

        documentView: (function () {
            this.set('documentView', this.get('document.view'));
        }).property('document.view'),

        handlerInfos: (function () {
            return this.get('router').router.currentHandlerInfos;
        }).property('applicationController.currentPath'),

        pathNames: Ember['default'].computed.mapBy('handlerInfos', 'name'),
        controllers: Ember['default'].computed.mapBy('handlerInfos', 'handler.controller'),

        fixed: (function () {
            var activeController = this.get('controllers').get('lastObject');
            return activeController.getWithDefault('fixedToolbox', false) || this.get('control.fixed');
        }).property('controllers.@each.fixedToolbox', 'control.fixed'),

        setBlocked: (function () {
            if (this.get('documentView')) {
                this.get('documentView').setInteractionsBlocked(this.get('fixed'));
            }
        }).observes('fixed'),

        setToolboxNow: function setToolboxNow(show) {
            if (!show && this.get('control.fixed')) {
                return;
            }
            Ember['default'].$('#toolbox').css('margin-right', show ? 0 : -365);
            Ember['default'].$('#scraped-doc').css('margin-right', show ? 400 : 35);

            Ember['default'].run.later(this, function () {
                var docView = this.get('documentView');
                if (docView && docView.redrawNow) {
                    docView.redrawNow();
                }
            }, show ? 320 : 820);
        },

        setToolbox: function setToolbox(show) {
            Ember['default'].run.debounce(this, this.setToolboxNow, show, show ? 300 : 800);
        },

        showToolbox: function showToolbox() {
            return this.setToolbox(true);
        },
        hideToolbox: function hideToolbox() {
            return this.setToolbox(false);
        },

        mouseEnter: function mouseEnter() {
            this.showToolbox();
        },

        mouseLeave: function mouseLeave(e) {
            if (!this.get('fixed') && !this.get('control.pinned')) {
                if (e.target.tagName.toLowerCase() !== 'select') {
                    this.hideToolbox();
                }
            }
        },

        changeState: (function () {
            if (this.get('control.expand') || this.get('control.pinned') || this.get('fixed')) {
                this.showToolbox();
                this.get('control').set('expand', false);
            } else {
                this.hideToolbox();
            }
        }).observes('fixed', 'control.fixed'),

        didInsertElement: function didInsertElement() {
            this._super();
        }
    });

});
define('portia-web/components/top-bar', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Component.extend({});

});
define('portia-web/components/web-document', ['exports', 'ember', 'portia-web/utils/canvas', 'portia-web/utils/annotation-store'], function (exports, Ember, utils__canvas, AnnotationStore) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        _register: (function () {
            this.set('document.view', this); // documentView is a new property
        }).on('init'),

        didInsertElement: function didInsertElement() {
            Ember['default'].run.scheduleOnce('afterRender', this, this.initData());
        },

        iframeId: 'scraped-doc-iframe',

        dataSource: null,

        sprites: [],

        listener: null,

        canvas: null,

        ignoredElementTags: ['html', 'body'],

        mouseDown: false,

        loader: null,

        loadingDoc: false,

        cssEnabled: true,

        annotationStore: null,

        spiderPage: '<!DOCTYPE html>' + '<html>' + '<head>' + '<meta http-equiv="Content-type" content="text/html;charset=UTF-8">' + '<style>' + 'html {' + 'width:100%;' + 'height:100%;' + 'background:url(/static/portia-e34bb3dedb663765a8a50c116b0e0107.png) center center no-repeat;' + '}' + '</style>' + '</head>' + '<body></body>' + '</html>',

        redrawSprites: (function () {
            this.redrawNow();
        }).observes('sprites.sprites.@each', 'sprites'),

        /**
            Attaches this documentview to a datasource and event listener
            configuring it according to the options dictionary.
            The options dictionary may contain:
             datasource: the datasource that will be attached.
            listener: the event listener will be attached.
            mode: a string. Possible values are 'select' and 'browse'.
            partialSelects: boolean. Whether to allow partial selections. It only
                has effect for the 'select' mode.
        */
        config: function config(options) {
            this.set('dataSource', options.dataSource);
            this.set('listener', options.listener);
            if (options.mode === 'select') {
                this.set('elementSelectionEnabled', true);
                this.set('partialSelectionEnabled', options.partialSelects);
            } else if (options.mode === 'browse') {
                this.set('elementSelectionEnabled', false);
                this.hideHoveredInfo();
                this.installEventHandlersForBrowsing();
            }
        },

        /**
            Detaches the datasource and event listener. Internally,
            it also unbinds all event handlers.
        */
        reset: function reset() {
            this.uninstallEventHandlers();
            this.set('elementSelectionEnabled', false);
            this.set('partialSelectionEnabled', false);
            this.set('dataSource', null);
            this.set('listener', null);
        },

        /**
            Set this property to a DOM element if you want to restrict element
            selection to the children of the given element.
        */
        restrictToDescendants: null,

        /**
            Returns the document iFrame contents.
        */
        getIframe: function getIframe() {
            return Ember['default'].$('#' + this.get('iframeId')).contents();
        },

        /**
            Redraws all datasource sprites and the hovered element (if in select
            mode). This method can be called manually but it gets called
            automatically:
                 - Once 10 seconds.
                - After a window resize or iframe scroll.
                - The sprites exposed by the datasource change.
        */
        redrawNow: function redrawNow() {
            var canvas = this.get('canvas');
            if (!canvas || this.loadingDoc) {
                return;
            }
            canvas = this.get('canvas');
            if (this.get('sprites.sprites')) {
                var sprites = this.get('sprites.sprites').copy();
                if (this.get('hoveredSprite')) {
                    sprites = sprites.concat([this.get('hoveredSprite')]);
                }
                canvas.draw(sprites, this.getIframe().scrollLeft(), this.getIframe().scrollTop());
            } else {
                canvas.clear();
            }
        },

        clearNow: function clearNow() {
            this.get('canvas').clear();
        },

        /**
            Blocks/unblocks interactions with the document.
        */
        setInteractionsBlocked: function setInteractionsBlocked(blocked) {
            if (this.get('canvas.interactionsBlocked') !== blocked) {
                this.set('canvas.interactionsBlocked', blocked);
            }
        },

        /**
            Displays a document by setting it as the content of the iframe.
            readyCallback will be called when the document finishes rendering.
        */
        displayDocument: function displayDocument(documentContents, readyCallback) {
            Ember['default'].run.schedule('afterRender', this, function () {
                this.set('loadingDoc', true);
                this.setIframeContent(documentContents);
                // We need to disable all interactions with the document we are loading
                // until we trigger the callback.
                this.setInteractionsBlocked(true);
                Ember['default'].run.later(this, function () {
                    var doc = document.getElementById(this.get('iframeId')).contentWindow.document;
                    doc.onscroll = this.redrawNow.bind(this);
                    this.setInteractionsBlocked(false);
                    if (readyCallback) {
                        readyCallback(this.getIframe());
                    }
                    this.set('loadingDoc', false);
                }, 1000);
            });
        },

        /**
            Returns the content of the document currently displayed by the
            iframe.
        */
        getAnnotatedDocument: function getAnnotatedDocument() {
            return this.getIframe().find('html').get(0).outerHTML;
        },

        /**
            Displays a loading widget on top of the iframe. It should be removed
            by calling hideLoading.
        */
        showLoading: function showLoading() {
            this.setInteractionsBlocked(true);
            var loader = this.get('loader');
            if (!loader) {
                loader = new CanvasLoader('loader-container');
                loader.setColor('#2398b2');
                loader.setShape('spiral');
                loader.setDiameter(90);
                loader.setRange(0.9);
                loader.setSpeed(1);
                loader.setFPS(60);
                var loaderObj = document.getElementById('canvasLoader');
                loaderObj.style.position = 'absolute';
                loaderObj.style['margin-left'] = -loader.getDiameter() / 2 + 'px';
                loaderObj.style['margin-top'] = '180px';
                loaderObj.style['width'] = loader.getDiameter() + 'px';
                loaderObj.style['left'] = '50%';
                this.set('loader', loader);
            }
            loader.show();
        },

        /**
            Hides the loading widget displayed by a previous call to showLoading.
        */
        hideLoading: function hideLoading() {
            if (this.get('loader')) {
                this.get('loader').hide();
            }
            this.setInteractionsBlocked(false);
        },

        /**
            Displays the spider image place holder as the content of the
            iframe.
        */
        showSpider: function showSpider() {
            Ember['default'].run.schedule('afterRender', this, function () {
                if (!Ember['default'].testing) {
                    this.setIframeContent(this.spiderPage, true);
                }
            });
        },

        toggleCSS: function toggleCSS() {
            var iframe = this.getIframe();
            if (this.cssEnabled) {
                iframe.find('link[rel="stylesheet"]').each(function () {
                    Ember['default'].$(this).renameAttr('href', '_href');
                });
                iframe.find('style').each(function () {
                    var that = Ember['default'].$(this);
                    that.renameAttr('type', '_type');
                    that.attr('type', 'text/disabled');
                });
                iframe.find('[style]').each(function () {
                    Ember['default'].$(this).renameAttr('style', '_style');
                });
            } else {
                iframe.find('link[rel="stylesheet"]').each(function () {
                    Ember['default'].$(this).renameAttr('_href', 'href');
                });
                iframe.find('style').each(function () {
                    Ember['default'].$(this).renameAttr('_type', 'type');
                });
                iframe.find('*[_style]').each(function () {
                    Ember['default'].$(this).renameAttr('_style', 'style');
                });
            }
            this.redrawNow();
            this.cssEnabled = !this.cssEnabled;
        },

        /**
            Scrolls the iframe so the given element appears in the current
            viewport.
        */
        scrollToElement: function scrollToElement(element) {
            var rect = Ember['default'].$(element).boundingBox();
            this.updateHoveredInfo(element);
            Ember['default'].$('#' + this.get('iframeId')).get(0).contentWindow.scrollTo(Math.max(0, parseInt(rect.left - 100)), Math.max(0, parseInt(rect.top - 100)));
        },

        _elementSelectionEnabled: null,

        elementSelectionEnabled: (function (key, selectionEnabled) {
            if (arguments.length > 1) {
                if (selectionEnabled) {
                    if (!this.get('_elementSelectionEnabled')) {
                        this.set('_elementSelectionEnabled', true);
                        this.showHoveredInfo();
                        this.installEventHandlersForSelecting();
                    }
                } else {
                    this.set('_elementSelectionEnabled', false);
                    this.uninstallEventHandlers();
                    this.hideHoveredInfo();
                }
            } else {
                return this.get('_elementSelectionEnabled');
            }
        }).property('_elementSelectionEnabled'),

        partialSelectionEnabled: false,

        installEventHandlersForBrowsing: function installEventHandlersForBrowsing() {
            this.uninstallEventHandlers();
            this.getIframe().bind('click', this.clickHandlerBrowse.bind(this));
        },

        installEventHandlersForSelecting: function installEventHandlersForSelecting() {
            this.uninstallEventHandlers();
            this.getIframe().bind('click', this.clickHandler.bind(this));
            this.getIframe().bind('mouseover', this.mouseOverHandler.bind(this));
            this.getIframe().bind('mouseout', this.mouseOutHandler.bind(this));
            this.getIframe().bind('mousedown', this.mouseDownHandler.bind(this));
            this.getIframe().bind('mouseup', this.mouseUpHandler.bind(this));
            this.getIframe().bind('hover', function (event) {
                event.preventDefault();
            });
            this.redrawNow();
        },

        uninstallEventHandlers: function uninstallEventHandlers() {
            this.getIframe().unbind('click');
            this.getIframe().unbind('mouseover');
            this.getIframe().unbind('mouseout');
            this.getIframe().unbind('mousedown');
            this.getIframe().unbind('mouseup');
            this.getIframe().unbind('hover');
            this.set('hoveredSprite', null);
        },

        setIframeContent: function setIframeContent(contents) {
            var iframe = this.getIframe();
            iframe.find('html').html(contents);
            this.set('document.iframe', iframe);
        },

        showHoveredInfo: function showHoveredInfo() {
            Ember['default'].$('#hovered-element-info').css('display', 'inline');
        },

        hideHoveredInfo: function hideHoveredInfo() {
            Ember['default'].$('#hovered-element-info').css('display', 'none');
        },

        initHoveredInfo: function initHoveredInfo() {
            var contents = '<div>' + '<span class="path"/>' + '<button class="btn btn-light fa fa-icon fa-arrow-right"/>' + '</div>' + '<div class="attributes"/>';
            Ember['default'].$('#hovered-element-info').html(contents);
            Ember['default'].$('#hovered-element-info button').click(function () {
                var element = Ember['default'].$('#hovered-element-info');
                var button = element.find('button');
                button.removeClass('fa-arrow-right');
                button.removeClass('fa-arrow-left');
                var floatPos = element.css('float');
                if (floatPos === 'left') {
                    floatPos = 'right';
                    button.addClass('fa-arrow-left');
                } else {
                    floatPos = 'left';
                    button.addClass('fa-arrow-right');
                }
                element.css('float', floatPos);
            });
        },

        updateHoveredInfo: function updateHoveredInfo(element) {
            var jqElem = Ember['default'].$(element),
                path = jqElem.getPath(),
                attributes = jqElem.getAttributeList();
            if (jqElem.prop('class')) {
                attributes.unshift({ name: 'class', value: jqElem.prop('class') });
            }
            if (jqElem.prop('id')) {
                attributes.unshift({ name: 'id', value: jqElem.prop('id') });
            }
            var attributesHtml = '';
            attributes.forEach(function (attribute) {
                var value = attribute.value.trim().substring(0, 50);
                attributesHtml += '<div class="attribute" style="margin:2px 0px 2px 0px">' + '<span>' + attribute.name + ': </span>' + '<span style="color:#AAA">' + value + '</span>' + '</div>';
            });
            Ember['default'].$('#hovered-element-info .attributes').html(attributesHtml);
            Ember['default'].$('#hovered-element-info .path').html(path);
        },

        sendElementHoveredEvent: function sendElementHoveredEvent(element, delay, mouseX, mouseY) {
            var handle = this.get('elementHoveredHandle');
            if (handle) {
                Ember['default'].run.cancel(handle);
                this.set('elementHoveredHandle', null);
            }
            if (delay) {
                handle = Ember['default'].run.later(this, function () {
                    this.sendDocumentEvent('elementHovered', element, mouseX, mouseY);
                }, delay);
                this.set('elementHoveredHandle', handle);
            } else {
                this.sendDocumentEvent('elementHovered', element, mouseX, mouseY);
            }
        },

        mouseOverHandler: function mouseOverHandler(event) {
            event.preventDefault();
            var target = event.target;
            var tagName = Ember['default'].$(target).prop('tagName').toLowerCase();
            if (Ember['default'].$.inArray(tagName, this.get('ignoredElementTags')) === -1 && !this.mouseDown) {
                if (!this.get('restrictToDescendants') || Ember['default'].$(target).isDescendant(this.get('restrictToDescendants'))) {
                    this.setElementHovered(target);
                    this.sendElementHoveredEvent(target, 0, event.clientX, event.clientY);
                }
            }
        },

        mouseOutHandler: function mouseOutHandler() {
            this.set('hoveredSprite', null);
            this.redrawNow();
        },

        clickHandler: function clickHandler(event) {
            event.preventDefault();
        },

        clickHandlerBrowse: function clickHandlerBrowse(event) {
            event.preventDefault();
            var linkingElement = Ember['default'].$(event.target).closest('[href]');
            if (linkingElement.length) {
                var href = Ember['default'].$(linkingElement).get(0).href;
                this.sendDocumentEvent('linkClicked', href);
            }
        },

        mouseDownHandler: function mouseDownHandler(event) {
            if (event.target.draggable) {
                // Disable dragging of images, links, etc...
                // This interferes with partial selection of links,
                // but it's a lesser evil than dragging.
                event.preventDefault();
            }
            this.set('hoveredSprite', null);
            this.set('mouseDown', true);
            this.redrawNow();
        },

        mouseUpHandler: function mouseUpHandler(event) {
            this.set('mouseDown', false);
            var selectedText = this.getIframeSelectedText();
            if (selectedText) {
                if (this.get('partialSelectionEnabled')) {
                    if (selectedText.anchorNode === selectedText.focusNode) {
                        this.sendDocumentEvent('partialSelection', selectedText, event.clientX, event.clientY);
                    } else {
                        alert('The selected text must belong to a single HTML element');
                        selectedText.collapse(this.getIframe().find('html').get(0), 0);
                    }
                } else {
                    selectedText.collapse(this.getIframe().find('html').get(0), 0);
                }
            } else if (event && event.target) {
                var target = event.target;
                var tagName = Ember['default'].$(target).prop('tagName').toLowerCase();
                if (Ember['default'].$.inArray(tagName, this.get('ignoredElementTags')) === -1) {
                    if (!this.get('restrictToDescendants') || Ember['default'].$(target).isDescendant(this.get('restrictToDescendants'))) {
                        this.sendDocumentEvent('elementSelected', target, event.clientX, event.clientY);
                    } else {
                        this.sendDocumentEvent('elementSelected', null);
                    }
                }
            }
        },

        sendDocumentEvent: function sendDocumentEvent(name) {
            var actions = this.get('listener.documentActions');
            var args = Array.prototype.slice.call(arguments, 1);
            if (actions && actions[name]) {
                Ember['default'].run((function () {
                    actions[name].apply(this.get('listener'), args);
                }).bind(this));
            }
        },

        getIframeSelectedText: function getIframeSelectedText() {
            var range = this.getIframe().get(0).getSelection();
            if (range && !range.isCollapsed) {
                return range;
            } else {
                return null;
            }
        },

        setElementHovered: function setElementHovered(element) {
            this.updateHoveredInfo(element);
            this.set('hoveredSprite', utils__canvas.ElementSprite.create({ 'element': element }));
            this.redrawNow();
        },

        initCanvas: function initCanvas() {
            if (!this.get('canvas')) {
                this.set('canvas', utils__canvas.Canvas.create({ canvasId: 'infocanvas' }));
                this.initHoveredInfo();
                if (!Ember['default'].testing) {
                    window.resize = (function () {
                        this.redrawNow();
                    }).bind(this);
                }
            }
        },

        initData: function initData() {
            this.initCanvas();
            var store = new AnnotationStore['default'](),
                iframe = this.getIframe();
            store.set('document', this.get('document'));
            this.set('document.store', store);
            this.set('document.iframe', iframe);
        },

        call: function call() {}
    });

});
define('portia-web/components/wizard-box', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Component.extend({
        text: '',
        defaultValue: '',

        noText: (function () {
            return this.get('text').length < 1;
        }).property('text'),

        actions: {
            add: function add() {
                if (!this.get('noText')) {
                    this.sendAction('action', this.get('text'));
                }
            },

            update: function update(text) {
                if (text) {
                    this.set('text', text.trim());
                }
            }
        }
    });

});
define('portia-web/components/zero-clipboard', ['exports', 'ember', 'ember-cli-zero-clipboard/components/zero-clipboard'], function (exports, Ember, ZeroClipboard) {

	'use strict';

	exports['default'] = ZeroClipboard['default'];

});
define('portia-web/controllers/application', ['exports', 'portia-web/controllers/base-controller'], function (exports, BaseController) {

	'use strict';

	exports['default'] = BaseController['default'].extend({});

});
define('portia-web/controllers/base-controller', ['exports', 'ember', 'portia-web/mixins/application-utils', 'portia-web/mixins/controller-utils', 'portia-web/mixins/modal-handler', 'portia-web/mixins/notification-handler', 'portia-web/mixins/size-listener', 'portia-web/mixins/toolbox-state-mixin', 'portia-web/mixins/app-visibility'], function (exports, Ember, ApplicationUtils, ControllerUtils, ModalHandler, NotificationHandler, SizeListener, ToolboxStateMixin, AppVisibility) {

    'use strict';

    exports['default'] = Ember['default'].Controller.extend(ApplicationUtils['default'], SizeListener['default'], ModalHandler['default'], NotificationHandler['default'], ControllerUtils['default'], ToolboxStateMixin['default'], AppVisibility['default'], {
        documentView: null,
        breadCrumb: null,
        breadCrumbs: null,

        setBreadCrumbs: (function () {
            this.set('breadCrumb', null);
            this.set('breadCrumbs', null);
        }).on('init'),

        extractionTypes: ['text', 'number', 'image', 'price', 'raw html', 'safe html', 'geopoint', 'url', 'date'],

        setDocumentView: (function () {
            this.set('documentView', this.get('document.view'));
        }).on('init'),

        annotationsStore: (function () {
            return this.get('document.store');
        }).property('document.store'),

        actions: {
            updateField: function updateField(value, field) {
                if (field) {
                    this.set(field, value);
                }
            }
        }
    });

});
define('portia-web/controllers/conflicts', ['exports', 'ember', 'portia-web/controllers/base-controller'], function (exports, Ember, BaseController) {

    'use strict';

    exports['default'] = BaseController['default'].extend({
        needs: ['application'],

        currentFileName: null,

        conflictedKeyPaths: {},

        conflictedFileNames: (function () {
            return Object.keys(this.get('model')).sort();
        }).property('model'),

        currentFileContents: (function () {
            return this.get('model')[this.get('currentFileName')];
        }).property('currentFileName'),

        toType: function toType(obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        },

        getConflictedKeyPaths: function getConflictedKeyPaths(content, parentPath) {
            if (this.toType(content) === 'object') {
                if ('__CONFLICT' in content) {
                    return [parentPath];
                } else {
                    var conflicted = [];
                    Object.keys(content).forEach((function (key) {
                        var path = parentPath ? parentPath + '.' + key : key;
                        conflicted = conflicted.concat(this.getConflictedKeyPaths(content[key], path));
                    }).bind(this));
                    return conflicted;
                }
            }
            return [];
        },

        hasUnresolvedConflict: (function () {
            var conflict = false;
            if (this.get('conflictedKeyPaths')) {
                conflict = Object.keys(this.get('conflictedKeyPaths')).any(function (key) {
                    return !this.get('conflictedKeyPaths')[key];
                }, this);
            }
            return conflict;
        }).property('conflictedKeyPaths'),

        saveDisabled: (function () {
            return this.get('hasUnresolvedConflict') || !this.get('currentFileName');
        }).property('hasUnresolvedConflict', 'currentFileName'),

        resolveContent: function resolveContent(content, parentPath) {
            if (this.toType(content) === 'object') {
                if ('__CONFLICT' in content) {
                    if (parentPath in this.get('conflictedKeyPaths')) {
                        var option = this.get('conflictedKeyPaths')[parentPath];
                        content = content['__CONFLICT'][option];
                    }
                } else {
                    Object.keys(content).forEach((function (key) {
                        var path = parentPath ? parentPath + '.' + key : key;
                        content[key] = this.resolveContent(content[key], path);
                    }).bind(this));
                }
            }
            return content;
        },

        displayConflictedFile: function displayConflictedFile(fileName) {
            this.set('currentFileName', fileName);
            var conflictedPaths = this.getConflictedKeyPaths(this.get('currentFileContents'));
            conflictedPaths.forEach(function (path) {
                this.set('conflictedKeyPaths.' + path, '');
            }, this);
            this.notifyPropertyChange('conflictedKeyPaths');
        },

        actions: {

            displayConflictedFile: function displayConflictedFile(fileName) {
                this.get('document.view').setInteractionsBlocked(false);
                this.displayConflictedFile(fileName);
            },

            conflictOptionSelected: function conflictOptionSelected(path, option) {
                this.set('conflictedKeyPaths.' + path, option);
                this.notifyPropertyChange('conflictedKeyPaths');
            },

            saveFile: function saveFile(fileName) {
                this.get('slyd').saveFile(this.get('slyd.project'), fileName, this.resolveContent(this.get('model')[fileName])).then((function () {
                    delete this.get('model')[fileName];
                    this.notifyPropertyChange('model');
                    this.set('conflictedKeyPaths', {});
                    this.set('currentFileName', null);
                    if (Ember['default'].isEmpty(this.get('conflictedFileNames'))) {
                        this.get('slyd').publishProject(this.get('slyd.project'), true);
                        this.showSuccessNotification(this.messages.get('conflicts_solved'));
                        this.transitionToRoute('projects');
                    } else {
                        this.displayConflictedFile(this.get('conflictedFileNames')[0]);
                    }
                }).bind(this));
            },

            publish: function publish() {
                this.get('slyd').publishProject(this.get('slyd.project'), true);
            }
        },

        willEnter: function willEnter() {
            this.set('model', this.get('model') || {});
            this.get('document.view').setInteractionsBlocked(false);
            if (!Ember['default'].isEmpty(this.get('conflictedFileNames'))) {
                this.displayConflictedFile(this.get('conflictedFileNames')[0]);
            }
        }
    });

});
define('portia-web/controllers/conflicts/index', ['exports', 'portia-web/controllers/conflicts'], function (exports, ConflictsController) {

    'use strict';

    exports['default'] = ConflictsController['default'].extend({
        breadCrumb: null
    });

});
define('portia-web/controllers/items', ['exports', 'portia-web/controllers/base-controller', 'portia-web/models/item', 'portia-web/models/item-field'], function (exports, BaseController, Item, ItemField) {

    'use strict';

    exports['default'] = BaseController['default'].extend({

        needs: ['application', 'projects', 'project'],

        documentView: null,

        addItem: function addItem() {
            var newItem = Item['default'].create({ name: this.shortGuid('_') });
            this.addField(newItem);
            this.model.pushObject(newItem);
        },

        addField: function addField(owner, name, type) {
            if (!owner) {
                this.showErrorNotification('No Item selected for extraction');
                return;
            }
            var newField = ItemField['default'].create({ name: name || 'new_field',
                type: type || 'text',
                required: false,
                vary: false });
            owner.set('fields', owner.fields || []);
            owner.fields.pushObject(newField);
        },

        saveChanges: function saveChanges() {
            var valid = true;
            this.get('content').forEach((function (item) {
                if (!item.isValid()) {
                    this.showErrorNotification('The item ' + item.get('name') + ' or one of its fields has an invalid name. Only A-Z, a-z, 0-9, - and _ are allowed characters.');
                    valid = false;
                }
            }).bind(this));
            if (valid) {
                this.get('slyd').saveItems(this.model).then((function () {
                    this.set('project_models.items', this.model);
                    this.transitionToRoute(this.getParentRoute());
                }).bind(this));
            }
        },

        getParentRoute: function getParentRoute() {
            var handlerInfo = this.get('router').router.currentHandlerInfos;
            return handlerInfo[handlerInfo.length - 2].name;
        },

        actions: {

            addItem: function addItem() {
                this.addItem();
            },

            addField: function addField(item) {
                this.addField(item);
            },

            deleteItem: function deleteItem(item) {
                this.model.removeObject(item);
            },

            deleteField: function deleteField(item, field) {
                item.get('fields').removeObject(field);
            },

            saveChanges: function saveChanges() {
                this.saveChanges();
            },

            undoChanges: function undoChanges() {
                this.get('slyd').loadItems().then((function (items) {
                    this.set('content', items);
                    this.transitionToRoute(this.getParentRoute());
                }).bind(this));
            }
        },

        willEnter: function willEnter() {}
    });

});
define('portia-web/controllers/project', ['exports', 'ember', 'portia-web/controllers/base-controller', 'portia-web/models/spider'], function (exports, Ember, BaseController, Spider) {

    'use strict';

    exports['default'] = BaseController['default'].extend({
        fixedToolbox: true,
        breadCrumb: null,
        _breadCrumbs: (function () {
            this.setBreadCrumb();
        }).observes('slyd.project'),

        setBreadCrumb: function setBreadCrumb() {
            var project_id = this.get('slyd.project');
            this.set('breadCrumb', this._project_name(project_id));
            this.set('breadCrumbModel', project_id);
        },

        additionalActions: (function () {
            function makeCopyMessage(type, copied, renamed) {
                return copied.length + ' ' + type + (copied.length > 1 ? 's' : '') + ' (' + copied.map(function (item) {
                    if (renamed[item]) {
                        return item + ' as ' + renamed[item];
                    }
                    return item;
                }).join(', ') + ')';
            }

            var copyAction = {
                modal: 'copy-spider',
                text: 'Copy Spider',
                title: 'Copy Spider to project',
                button_class: 'primary',
                button_text: 'Copy',
                okCallback: (function () {
                    if (!copyAction.params.spiders.length && !copyAction.params.items.length) {
                        return;
                    }
                    this.get('slyd').copySpider(this.get('slyd.project'), copyAction.params.destinationProject, copyAction.params.spiders, copyAction.params.items).then((function (response) {
                        /*
                            Create a notification message like:
                                Successfully copied 2 spiders (spider1, spider2 as spider2_copy)
                                and 1 item (default as default_copy).
                        */
                        var copiedSpiders = response.copied_spiders;
                        var renamedSpiders = response.renamed_spiders;
                        var copiedItems = response.copied_items;
                        var renamedItems = response.renamed_items;
                        var messageParts = [];
                        if (copiedSpiders.length) {
                            messageParts.push(makeCopyMessage('spider', copiedSpiders, renamedSpiders));
                        }
                        if (copiedItems.length) {
                            messageParts.push(makeCopyMessage('item', copiedItems, renamedItems));
                        }
                        if (messageParts.length) {
                            this.showSuccessNotification('Successfully copied ' + messageParts.join(' and ') + '.');
                        }
                    }).bind(this));
                }).bind(this)
            };

            return [{
                component: 'file-download'
            }, copyAction, {
                component: 'edit-items',
                controller: this
            }, {
                text: 'Documentation',
                url: 'http://support.scrapinghub.com/list/24895-knowledge-base/?category=17201'
            }];
        }).property(),

        needs: ['application', 'project'],

        spiderPage: null,

        _project_name: function _project_name(project_id) {
            return this.get('project_models.projects.' + project_id) || project_id;
        },

        project_name: (function () {
            return this._project_name(this.get('slyd.project'));
        }).property('slyd.project'),

        changedFiles: [],

        isDeploying: false,
        isPublishing: false,

        filteredSpiders: (function () {
            var a = Ember['default'].A(),
                filterText = this.filterSpider || '',
                re = new RegExp(filterText.replace(/[^A-Z0-9_-]*/gi, ''), 'i');
            for (var i = 0; i < this.get('model').length; i++) {
                var m = this.model[i];
                if (re.test(m)) {
                    a.push(m);
                }
            }
            return a;
        }).property('filterSpider', 'model', 'refreshSpiders'),

        hasChanges: (function () {
            return !Ember['default'].isEmpty(this.get('changedFiles'));
        }).property('changedFiles.[]'),

        noChanges: (function () {
            return this.get('isPublishing') || this.get('isDeploying') || !this.get('hasChanges');
        }).property('hasChanges', 'isDeploying', 'isPublishing'),

        addSpider: function addSpider(siteUrl) {
            if (this.get('addingNewSpider')) {
                return;
            }
            this.set('addingNewSpider', true);
            if (siteUrl.indexOf('http') !== 0) {
                siteUrl = 'http://' + siteUrl;
            }
            var documentView = this.get('documentView');
            documentView.showLoading();
            this.set('slyd.spider', null);
            this.get('slyd').fetchDocument(siteUrl).then((function (data) {
                if (data.error) {
                    documentView.hideLoading();
                    this.showErrorNotification('Failed to create spider', data.error);
                    return;
                }
                // XXX: Deal with incorrect model
                var names = this.get('model');
                if (!(names instanceof Array)) {
                    names = [];
                }
                var baseName = URI.parse(siteUrl).hostname.replace(/^www[0-9]?\./, '');
                var newSpiderName = this.getUnusedName(baseName, names);
                var spider = Spider['default'].create({ 'name': newSpiderName,
                    'start_urls': [siteUrl],
                    'follow_patterns': [],
                    'exclude_patterns': [],
                    'init_requests': [],
                    'templates': [],
                    'template_names': [],
                    'plugins': {}
                });
                this.get('slyd').saveSpider(spider).then((function () {
                    documentView.hideLoading();
                    this.set('slyd.spider', newSpiderName);
                    this.editSpider(newSpiderName, siteUrl);
                }).bind(this), (function (err) {
                    documentView.hideLoading();
                    throw err; // re-throw for the notification
                }).bind(this));
            }).bind(this), function (err) {
                documentView.hideLoading();
                throw err; // re-throw for the notification
            })['finally']((function () {
                this.set('controllers.application.siteWizard', null);
                this.set('spiderPage', null);
                this.set('addingNewSpider', false);
            }).bind(this));
        },

        editSpider: function editSpider(spiderName, siteUrl) {
            this.get('slyd').loadSpider(spiderName).then((function (spider) {
                var query = {};
                if (siteUrl) {
                    query['queryParams'] = { url: siteUrl };
                    this.transitionToRoute('spider', spider, query);
                } else {
                    this.transitionToRoute('spider', spider);
                }
            }).bind(this));
        },

        publishProject: function publishProject() {
            return this.get('slyd').publishProject(this.get('slyd.project'));
        },

        discardChanges: function discardChanges() {
            return this.get('slyd').discardChanges(this.get('slyd.project'));
        },

        deployProject: function deployProject() {
            return this.get('slyd').deployProject(this.get('slyd.project'));
        },

        actions: {

            editSpider: function editSpider(spiderName) {
                this.editSpider(spiderName);
            },

            addSpider: function addSpider(siteUrl) {
                this.addSpider(siteUrl);
            },

            deleteSpider: function deleteSpider(spider) {
                var spiderName = spider;
                this.showConfirm('Delete ' + spiderName, 'Are you sure you want to delete spider ' + spiderName + '?', (function () {
                    this.get('slyd').deleteSpider(spiderName).then((function () {
                        this.get('model').removeObject(spiderName);
                        this.set('refreshSpiders', !this.get('refreshSpiders'));
                        this.get('changedFiles').addObject('spiders/' + spiderName + '.json');
                    }).bind(this));
                }).bind(this), null, 'danger', 'Yes, Delete');
            },

            rename: function rename(newName, oldName) {
                this.get('slyd').renameProject(oldName, newName).then((function () {
                    this.set('slyd.project', newName);
                    this.replaceRoute('project', newName);
                }).bind(this), (function (err) {
                    this.set('slyd.project', oldName);
                    throw err;
                }).bind(this));
            },

            publishProject: function publishProject() {
                this.set('isPublishing', true);
                this.publishProject().then((function (result) {
                    this.set('isPublishing', false);
                    if (result['status'] === 'ok') {
                        if (!Ember['default'].isEmpty(result['schedule_url'])) {
                            this.showConfirm('Schedule Project', this.messages.get('publish_ok_schedule'), function () {
                                window.location = result['schedule_url'];
                            });
                        } else {
                            this.showSuccessNotification(this.messages.get('publish_ok'));
                        }
                        this.set('changedFiles', []);
                    } else if (result['status'] === 'conflict') {
                        this.showWarningNotification(this.messages.get('publish_conflict'));
                        this.transitionToRoute('conflicts');
                    } else {
                        this.showErrorNotification('Failed to publish project', result['message']);
                    }
                }).bind(this), (function (err) {
                    this.set('isPublishing', false);
                    throw err;
                }).bind(this));
            },

            deployProject: function deployProject() {
                this.set('isDeploying', true);
                this.deployProject().then((function (result) {
                    this.set('isDeploying', false);
                    if (result['status'] === 'ok') {
                        if (!Ember['default'].isEmpty(result['schedule_url'])) {
                            this.showConfirm('Schedule Project', this.messages.get('deploy_ok_schedule'), function () {
                                window.location = result['schedule_url'];
                            });
                        } else {
                            this.showSuccessNotification(this.messages.get('deploy_ok'));
                        }
                    }
                }).bind(this), (function (err) {
                    this.set('isDeploying', false);
                    throw err;
                }).bind(this));
            },

            discardChanges: function discardChanges() {
                this.set('isPublishing', true);
                this.discardChanges().then((function () {
                    this.set('isPublishing', false);
                    this.transitionToRoute('projects');
                }).bind(this), (function (err) {
                    this.set('isPublishing', false);
                    throw err;
                }).bind(this));
            },

            conflictedFiles: function conflictedFiles() {
                this.transitionToRoute('conflicts');
            }
        },

        willEnter: function willEnter() {
            this.setBreadCrumb();
            this.get('documentView').reset();
            this.get('documentView').showSpider();
            if (this.get('controllers.application.siteWizard')) {
                Ember['default'].run.next(this, this.addSpider, this.get('controllers.application.siteWizard'));
            }
        }
    });

});
define('portia-web/controllers/project/index', ['exports', 'portia-web/controllers/project'], function (exports, ProjectController) {

    'use strict';

    exports['default'] = ProjectController['default'].extend({
        breadCrumb: null,
        _breadCrumb: null,
        setBreadCrumb: function setBreadCrumb() {}
    });

});
define('portia-web/controllers/projects', ['exports', 'ember', 'portia-web/controllers/base-controller', 'portia-web/models/item'], function (exports, Ember, BaseController, Item) {

    'use strict';

    exports['default'] = BaseController['default'].extend({
        fixedToolbox: true,
        breadCrumb: 'home',
        needs: ['application'],
        projectSite: null,

        projectRevisions: {},

        revisionsForProject: function revisionsForProject(projectName) {
            if (projectName in this.get('projectRevisions')) {
                return this.get('projectRevisions')[projectName];
            } else {
                return [];
            }
        },

        openProject: function openProject(projectName, revision) {
            this.get('slyd').editProject(projectName, revision).then((function () {
                this.set('slyd.project', projectName);
                this.transitionToRoute('project', { id: projectName });
            }).bind(this));
        },

        displayProjects: (function () {
            return (this.get('model') || []).map(function (p) {
                if (p instanceof Object) {
                    return p;
                }
                return { id: p, name: p };
            });
        }).property('model', 'model.@each'),

        actions: {

            openProject: function openProject(projectName) {
                this.openProject(projectName, 'master');
            },

            openProjectRevision: function openProjectRevision(projectName, revision) {
                this.openProject(projectName, revision);
            },

            deleteProject: function deleteProject(projectName) {
                this.showConfirm('Delete ' + projectName, 'Are you sure you want to delete this project? This operation cannot be undone.', (function () {
                    this.get('slyd').deleteProject(projectName).then((function () {
                        this.set('model', this.get('model').filter(function (p) {
                            if (p instanceof Object) {
                                if (p.id !== projectName) {
                                    return p;
                                }
                            } else {
                                if (p !== projectName) {
                                    return p;
                                }
                            }
                        }));
                    }).bind(this));
                }).bind(this), function () {}, 'danger', 'Yes, Delete');
            },

            createProject: function createProject(projectSite) {
                var newProjectName = this.getUnusedName('new_project', this.get('model'));
                this.get('slyd').createProject(newProjectName).then((function () {
                    this.get('slyd').editProject(newProjectName).then((function () {
                        this.set('slyd.project', newProjectName);
                        // Initialize items spec.
                        var itemsPromise = this.get('slyd').saveItems([Item['default'].create({ name: 'default', fields: []
                        })]);
                        // Initialize extractors spec.
                        var extractorsPromise = this.get('slyd').saveExtractors([]);
                        // Setup automatic creation of an initial spider.
                        this.set('controllers.application.siteWizard', projectSite);
                        Ember['default'].RSVP.all([itemsPromise, extractorsPromise]).then((function () {
                            this.get('model').pushObject({ id: newProjectName, name: newProjectName });
                            this.transitionToRoute('project', { id: newProjectName });
                        }).bind(this));
                    }).bind(this));
                }).bind(this));
            },

            showProjectRevisions: function showProjectRevisions(projectName) {
                this.get('slyd').projectRevisions(projectName).then((function (revisions) {
                    this.get('projectRevisions')[projectName] = revisions['revisions'];
                    this.notifyPropertyChange('projectRevisions');
                }).bind(this));
            },

            hideProjectRevisions: function hideProjectRevisions(projectName) {
                delete this.get('projectRevisions')[projectName];
                this.notifyPropertyChange('projectRevisions');
            }
        },

        willEnter: function willEnter() {
            this.set('breadCrumb', 'home');
            if (this.get('controllers.application.currentRouteName').split('.')[1] === 'index') {
                this.set('slyd.project', null);
            }
            this.get('documentView').reset();
            this.get('documentView').showSpider();
        }
    });

});
define('portia-web/controllers/projects/index', ['exports', 'portia-web/controllers/projects'], function (exports, ProjectsController) {

    'use strict';

    exports['default'] = ProjectsController['default'].extend({
        breadCrumb: null
    });

});
define('portia-web/controllers/spider', ['exports', 'ember', 'portia-web/controllers/base-controller', 'portia-web/utils/canvas', 'portia-web/utils/sprite-store', 'portia-web/models/extracted-item', 'portia-web/models/template'], function (exports, Ember, BaseController, canvas, SpriteStore, ExtractedItem, Template) {

    'use strict';

    exports['default'] = BaseController['default'].extend({
        fixedToolbox: false,

        needs: ['application', 'projects', 'project', 'project/index'],

        saving: false,

        browseHistory: [],

        pageMap: {},

        loadedPageFp: null,

        autoloadTemplate: null,

        pendingFetches: [],

        itemDefinitions: null,

        extractedItems: [],

        testing: false,

        spriteStore: new SpriteStore['default'](),

        startUrls: null,
        startUrlsAction: 'addStartUrls',
        editAllStartUrlsType: 'primary',
        editAllStartUrlsAction: 'editAllStartUrls',
        editAllStartUrlsText: 'Edit All',

        followPatternOptions: [{ value: 'all', label: 'Follow all in-domain links' }, { value: 'none', label: 'Don\'t follow links' }, { value: 'patterns', label: 'Configure follow and exclude patterns' }],

        hasStartUrls: (function () {
            return this.get('model.start_urls').length < 1 && this.get('editAllStartUrlsAction') === 'editAllStartUrls';
        }).property('model.start_urls.@each'),

        _breadCrumb: (function () {
            this.set('slyd.spider', this.get('model.name'));
            this.set('breadCrumb', this.get('model.name'));
        }).observes('model.name'),

        startUrlCount: (function () {
            if (!Ember['default'].isEmpty(this.get('model.start_urls'))) {
                return this.get('model.start_urls').length;
            } else {
                return 0;
            }
        }).property('model.start_urls.[]'),

        displayEditPatterns: (function () {
            return this.get('links_to_follow') === 'patterns';
        }).property('links_to_follow'),

        displayNofollow: (function () {
            return this.get('links_to_follow') !== 'none';
        }).property('links_to_follow'),

        _showLinks: false,

        showLinks: (function (key, show) {
            if (arguments.length > 1) {
                if (show) {
                    this.set('_showLinks', true);
                    this.set('documentView.sprites', this.get('spriteStore'));
                } else {
                    this.set('_showLinks', false);
                    this.set('documentView.sprites', new SpriteStore['default']());
                }
            }
            return this.get('_showLinks');
        }).property('_showLinks'),

        showItems: true,

        addTemplateDisabled: (function () {
            return !this.get('loadedPageFp');
        }).property('loadedPageFp'),

        browseBackDisabled: (function () {
            return this.get('browseHistory').length <= 1;
        }).property('browseHistory.@each'),

        reloadDisabled: (function () {
            return !this.get('loadedPageFp');
        }).property('loadedPageFp'),

        showItemsDisabled: (function () {
            var loadedPageFp = this.get('loadedPageFp');
            if (this.extractedItems.length > 0) {
                return false;
            }
            if (this.pageMap[loadedPageFp] && this.pageMap[loadedPageFp].items) {
                return !loadedPageFp ? true : !this.pageMap[loadedPageFp].items.length;
            }
            return true;
        }).property('loadedPageFp', 'extractedItems'),

        showNoItemsExtracted: (function () {
            return this.get('loadedPageFp') && Ember['default'].isEmpty(this.get('extractedItems')) && this.showItemsDisabled;
        }).property('loadedPageFp', 'showItemsDisabled'),

        itemsButtonLabel: (function () {
            return this.get('showItems') ? 'Hide Items ' : 'Show Items';
        }).property('showItems'),

        testButtonLabel: (function () {
            if (this.get('testing')) {
                return 'Stop testing';
            } else {
                return 'Test spider';
            }
        }).property('testing'),

        links_to_follow: (function (key, follow) {
            // The spider spec only supports 'patterns' or 'none' for the
            // 'links_to_follow' attribute; 'all' is only used for UI purposes.
            var model = this.get('model');
            var retVal = follow;
            if (arguments.length > 1) {
                if (follow !== 'patterns') {
                    model.get('exclude_patterns').setObjects([]);
                    model.get('follow_patterns').setObjects([]);
                }
                model.set('links_to_follow', follow === 'none' ? 'none' : 'patterns');
            } else {
                retVal = model.get('links_to_follow');
                if (retVal === 'patterns' && Ember['default'].isEmpty(model.get('follow_patterns')) && Ember['default'].isEmpty(model.get('exclude_patterns'))) {
                    retVal = 'all';
                }
            }
            return retVal;
        }).property('model.links_to_follow', 'model.follow_patterns', 'model.exclude_patterns'),

        _get_init_request_property: function _get_init_request_property(prop) {
            if (this.get('model.init_requests').length > 0) {
                return this.get('model.init_requests')[0][prop];
            }
        },

        loginUrl: (function () {
            return this._get_init_request_property('loginurl');
        }).property('model.init_requests'),

        loginUser: (function () {
            return this._get_init_request_property('username');
        }).property('model.init_requests'),

        loginPassword: (function () {
            return this._get_init_request_property('password');
        }).property('model.init_requests'),

        spiderDomains: (function () {
            var spiderDomains = new Set();
            this.get('model.start_urls').forEach(function (startUrl) {
                spiderDomains.add(URI.parse(startUrl)['hostname']);
            });
            return spiderDomains;
        }).property('model.start_urls.@each'),

        sprites: (function () {
            if (!this.get('loadedPageFp') || !this.get('showLinks')) {
                return [];
            }
            var followedLinks = this.get('followedLinks'),
                allLinks = Ember['default'].$(Ember['default'].$('#scraped-doc-iframe').contents().get(0).links),
                sprites = [];
            allLinks.each((function (i, link) {
                var uri = URI(link.href),
                    followed = followedLinks.indexOf(uri.fragment('').toString()) >= 0 && this._allowedDomain(uri.hostname());
                sprites.pushObject(canvas.ElementSprite.create({
                    element: link,
                    hasShadow: false,
                    fillColor: followed ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)',
                    strokeColor: followed ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)' }));
            }).bind(this));
            this.set('spriteStore.sprites', sprites);
        }).observes('followedLinks', 'showLinks', 'spiderDomains'),

        _allowedDomain: function _allowedDomain(hostname) {
            var split_host = hostname.split('.');
            for (var i = 1; i < split_host.length; i++) {
                if (this.get('spiderDomains').has(split_host.slice(-i - 2).slice().join('.'))) {
                    return true;
                }
            }
            return false;
        },

        currentUrl: (function () {
            if (!Ember['default'].isEmpty(this.get('pendingFetches'))) {
                return 'Fetching page...';
            } else if (this.get('loadedPageFp')) {
                return this.get('pageMap')[this.get('loadedPageFp')].url;
            } else {
                return 'No page loaded';
            }
        }).property('loadedPageFp', 'pendingFetches.@each'),

        editTemplate: function editTemplate(templateName) {
            this.transitionToRoute('template', templateName);
        },

        viewTemplate: function viewTemplate(templateName) {
            this.get('slyd').loadTemplate(this.get('model.name'), templateName).then((function (template) {
                var newWindow = window.open('about:blank', '_blank', 'resizable=yes, scrollbars=yes');
                if (newWindow) {
                    newWindow.document.write(template.get('annotated_body'));
                    newWindow.document.title = 'Sample ' + template.get('name');
                } else {
                    this.showWarningNotification('Could not open a new browser window. ' + 'Please check your browser\'s pop-up settings.');
                }
            }).bind(this));
        },

        wrapItem: function wrapItem(item) {
            var itemDefinition = (this.get('project_models.items') || this.get('itemDefinitions')).findBy('name', item['_type']);
            return ExtractedItem['default'].create({ extracted: item,
                definition: itemDefinition,
                matchedTemplate: item['_template_name'] });
        },

        updateExtractedItems: function updateExtractedItems(items) {
            var extractedItems = items.map(this.wrapItem, this);
            this.set('extractedItems', extractedItems);
        },

        renderPage: function renderPage(url, data, skipHistory, callback) {
            data.url = url;
            if (!skipHistory) {
                this.get('browseHistory').pushObject(data.fp);
            }
            this.get('documentView').displayDocument(data.page, (function () {
                this.get('documentView').reset();
                this.get('documentView').config({ mode: 'browse',
                    listener: this,
                    dataSource: this });
                this.set('documentView.sprites', this.get('spriteStore'));
                this.set('loadedPageFp', data.fp);
                this.set('followedLinks', data.links);
                this.get('pageMap')[data.fp] = data;
                this.updateExtractedItems(data.items || []);
                Ember['default'].run.later((function () {
                    this.get('documentView').redrawNow();
                }).bind(this), 100);
                if (callback) {
                    callback();
                }
            }).bind(this));
        },

        fetchPage: function fetchPage(url, parentFp, skipHistory, baseurl) {
            this.set('loadedPageFp', null);
            var documentView = this.get('documentView');
            documentView.showLoading();
            var fetchId = this.guid();
            this.get('pendingFetches').pushObject(fetchId);
            this.set('documentView.sprites', new SpriteStore['default']());
            this.get('slyd').fetchDocument(url, this.get('model.name'), parentFp, baseurl).then((function (data) {
                if (this.get('pendingFetches').indexOf(fetchId) === -1) {
                    // This fetch has been cancelled.
                    return;
                }
                if (!data.error) {
                    this.renderPage(baseurl || url, data, skipHistory, (function () {
                        this.get('pendingFetches').removeObject(fetchId);
                        documentView.hideLoading();
                    }).bind(this));
                } else {
                    documentView.hideLoading();
                    this.get('pendingFetches').removeObject(fetchId);
                    this.showErrorNotification('Failed to fetch page', data.error);
                }
            }).bind(this), (function (err) {
                documentView.hideLoading();
                this.get('pendingFetches').removeObject(fetchId);
                throw err; // re-throw for the notification
            }).bind(this));
        },

        displayPage: function displayPage(fp) {
            this.set('loadedPageFp', null);
            var documentView = this.get('documentView');
            documentView.displayDocument(this.get('pageMap')[fp].page, (function () {
                this.get('documentView').reset();
                this.get('documentView').config({ mode: 'browse',
                    listener: this,
                    dataSource: this });
                this.set('loadedPageFp', fp);
            }).bind(this));
        },

        addTemplate: function addTemplate() {
            var page = this.get('pageMap')[this.get('loadedPageFp')],
                iframeTitle = this.get('documentView').getIframe().get(0).title,
                template_name = iframeTitle.trim().replace(/[^a-z\s_-]/ig, '').substring(0, 48).trim().replace(/\s+/g, '_');
            if (!template_name || ('' + template_name).length < 1) {
                this.shortGuid();
            }
            var template = Template['default'].create({ name: template_name,
                extractors: {},
                annotations: {},
                annotated_body: page.page,
                original_body: page.original,
                page_id: page.fp,
                _new: true,
                url: page.url }),
                itemDefs = this.get('itemDefinitions');
            if (!itemDefs.findBy('name', 'default') && !Ember['default'].isEmpty(itemDefs)) {
                // The default item doesn't exist but we have at least one item def.
                template.set('scrapes', itemDefs[0].get('name'));
            }
            this.get('model.template_names').pushObject(template_name);
            this.get('slyd').saveTemplate(this.get('name'), template).then((function () {
                this.set('saving', false);
                this.saveSpider().then((function () {
                    this.editTemplate(template_name);
                }).bind(this));
            }).bind(this));
        },

        addStartUrls: function addStartUrls(urls) {
            if (typeof urls === 'string') {
                urls = urls.match(/[^\s,]+/g);
            }
            var modelUrls = this.get('model.start_urls');
            urls.forEach((function (url) {
                var parsed = URI.parse(url);
                if (Ember['default'].$.inArray(url, modelUrls) > 0) {
                    return;
                }
                if (!parsed.protocol) {
                    parsed.protocol = 'http';
                    url = URI.build(parsed);
                }
                modelUrls.pushObject(url);
            }).bind(this));
        },

        addExcludePattern: function addExcludePattern(pattern, index) {
            if (index !== undefined) {
                this.get('model.exclude_patterns').insertAt(index, pattern);
                this.notifyPropertyChange('links_to_follow');
            } else {
                this.get('model.exclude_patterns').pushObject(pattern);
            }
        },

        deleteExcludePattern: function deleteExcludePattern(pattern) {
            this.get('model.exclude_patterns').removeObject(pattern);
        },

        addFollowPattern: function addFollowPattern(pattern, index) {
            if (index !== undefined) {
                this.get('model.follow_patterns').insertAt(index, pattern);
                this.notifyPropertyChange('links_to_follow');
            } else {
                this.get('model.follow_patterns').pushObject(pattern);
            }
        },

        deleteFollowPattern: function deleteFollowPattern(pattern) {
            this.get('model.follow_patterns').removeObject(pattern);
        },

        autoFetch: (function () {
            if (this.get('loadedPageFp') && this.get('showLinks')) {
                this.saveSpider().then((function () {
                    this.fetchPage(this.get('pageMap')[this.get('loadedPageFp')].url, null, true);
                }).bind(this));
            }
        }).observes('model.follow_patterns.@each', 'model.exclude_patterns.@each', 'links_to_follow'),

        attachAutoSave: (function () {
            this.get('model').addObserver('dirty', (function () {
                Ember['default'].run.once(this, 'saveSpider');
            }).bind(this));
        }).observes('model'),

        saveSpider: function saveSpider() {
            if (this.get('saving')) {
                return;
            }
            this.set('saving', true);
            return this.get('slyd').saveSpider(this.get('model')).then((function () {
                this.set('saving', false);
            }).bind(this), (function (err) {
                this.set('saving', false);
                throw err;
            }).bind(this));
        },

        reset: (function () {
            this.set('browseHistory', []);
            this.set('pageMap', {});
        }).observes('model'),

        testSpider: function testSpider(urls) {
            if (this.get('testing') && urls.length) {
                var fetchId = this.guid();
                this.get('pendingFetches').pushObject(fetchId);
                this.get('slyd').fetchDocument(urls[0], this.get('model.name')).then((function (data) {
                    if (this.get('pendingFetches').indexOf(fetchId) !== -1) {
                        this.get('pendingFetches').removeObject(fetchId);
                        if (!Ember['default'].isEmpty(data.items)) {
                            data.items.forEach(function (item) {
                                this.get('extractedItems').pushObject(this.wrapItem(item));
                            }, this);
                        }
                        this.testSpider(urls.splice(1));
                    } else {
                        this.set('testing', false);
                    }
                }).bind(this), (function (err) {
                    this.get('documentView').hideLoading();
                    if (this.get('pendingFetches').indexOf(fetchId) !== -1) {
                        this.get('pendingFetches').removeObject(fetchId);
                    }
                    this.set('testing', false);
                    throw err;
                }).bind(this));
            } else {
                this.get('documentView').hideLoading();
                if (Ember['default'].isEmpty(this.get('extractedItems'))) {
                    this.showSuccessNotification('Test Completed', this.messages.get('no_items_extracted'));
                }
                this.set('testing', false);
            }
        },

        actions: {

            editAllStartUrls: function editAllStartUrls() {
                this.set('startUrlsAction', 'updateAllStartUrls');
                this.set('startUrls', this.get('model.start_urls').join('\n\n'));
                this.set('model.start_urls', []);
                this.set('editAllStartUrlsType', 'danger');
                this.set('editAllStartUrlsAction', 'cancelEditAllSpiders');
                this.set('editAllStartUrlsText', 'cancel');
            },

            updateAllStartUrls: function updateAllStartUrls(urls) {
                this.set('editAllStartUrlsType', 'primary');
                this.set('editAllStartUrlsAction', 'editAllStartUrls');
                this.set('editAllStartUrlsText', 'Edit All');
                this.set('startUrlsAction', 'addStartUrls');
                this.set('startUrls', null);
                this.addStartUrls(urls);
            },

            cancelEditAllSpiders: function cancelEditAllSpiders() {
                this.set('editAllStartUrlsType', 'primary');
                this.set('editAllStartUrlsAction', 'editAllStartUrls');
                this.set('editAllStartUrlsText', 'Edit All');
                this.addStartUrls(this.get('startUrls'));
                this.set('startUrls', null);
            },

            editTemplate: function editTemplate(templateName) {
                this.editTemplate(templateName);
            },

            addTemplate: function addTemplate() {
                this.addTemplate();
            },

            deleteTemplate: function deleteTemplate(templateName) {
                this.get('model.template_names').removeObject(templateName);
                this.get('slyd').deleteTemplate(this.get('name'), templateName);
            },

            viewTemplate: function viewTemplate(templateName) {
                this.viewTemplate(templateName);
            },

            fetchPage: function fetchPage(url) {
                // Cancel all pending fetches.
                this.get('pendingFetches').setObjects([]);
                this.fetchPage(url);
            },

            reload: function reload() {
                this.fetchPage(this.get('pageMap')[this.get('loadedPageFp')].url, null, true);
            },

            browseBack: function browseBack() {
                var history = this.get('browseHistory');
                history.removeAt(history.length - 1);
                var lastPageFp = history.get('lastObject');
                this.displayPage(lastPageFp);
            },

            addStartUrls: function addStartUrls(urls) {
                this.addStartUrls(urls);
            },

            deleteStartUrl: function deleteStartUrl(url) {
                this.get('model.start_urls').removeObject(url);
            },

            addExcludePattern: function addExcludePattern(text) {
                if (text) {
                    this.addExcludePattern(text);
                }
            },

            deleteExcludePattern: function deleteExcludePattern(pattern) {
                this.deleteExcludePattern(pattern);
            },

            editExcludePattern: function editExcludePattern(newVal, index) {
                this.deleteExcludePattern(this.get('model.exclude_patterns').objectAt(index));
                this.addExcludePattern(newVal, index);
            },

            addFollowPattern: function addFollowPattern(text) {
                if (text) {
                    this.addFollowPattern(text);
                }
            },

            deleteFollowPattern: function deleteFollowPattern(pattern) {
                this.deleteFollowPattern(pattern);
            },

            editFollowPattern: function editFollowPattern(newVal, index) {
                this.deleteFollowPattern(this.get('model.follow_patterns').objectAt(index));
                this.addFollowPattern(newVal, index);
            },

            toggleShowItems: function toggleShowItems() {
                this.set('showItems', !this.get('showItems'));
            },

            rename: function rename(newName) {
                var oldName = this.get('model.name');
                if (newName.trim() === oldName.trim()) {
                    return;
                }
                this.set('spiderName', oldName);
                this.set('model.name', newName);
                this.get('slyd').renameSpider(oldName, newName).then((function () {
                    this.replaceRoute('spider', newName);
                }).bind(this), (function (err) {
                    this.set('model.name', this.get('spiderName'));
                    throw err;
                }).bind(this));
            },

            testSpider: function testSpider() {
                if (this.get('testing')) {
                    this.set('testing', false);
                } else {
                    this.set('testing', true);
                    this.get('documentView').showLoading();
                    this.get('pendingFetches').setObjects([]);
                    this.get('extractedItems').setObjects([]);
                    this.set('showItems', true);
                    this.testSpider(this.get('model.start_urls').copy());
                }
            },

            updateLoginInfo: function updateLoginInfo() {
                Ember['default'].run.once(this, 'saveSpider');
            },

            addInitRequest: function addInitRequest(value, field) {
                if (field) {
                    this.set(field, value);
                    if (this.get('loginUrl') && this.get('loginUser') && this.get('loginPassword')) {
                        this.set('model.init_requests', [{
                            'type': 'login',
                            'loginurl': this.get('loginUrl'),
                            'username': this.get('loginUser'),
                            'password': this.get('loginPassword')
                        }]);
                    }
                }
            }
        },

        documentActions: {

            linkClicked: function linkClicked(url) {
                this.get('documentView').showLoading();
                this.fetchPage(url, this.get('loadedPageFp'));
            }
        },

        willEnter: function willEnter() {
            this.set('loadedPageFp', null);
            this.get('extractedItems').setObjects([]);
            this.get('documentView').config({ mode: 'browse',
                listener: this,
                dataSource: this });
            this.get('documentView').showSpider();
            this.set('spiderName', this.get('model.name'));
            this.set('documentView.sprites', new SpriteStore['default']());
            if (this.get('autoloadTemplate')) {
                Ember['default'].run.next(this, function () {
                    this.saveSpider().then((function () {
                        this.fetchPage(this.get('autoloadTemplate'), null, true);
                        this.set('autoloadTemplate', null);
                    }).bind(this));
                });
            }
        },

        willLeave: function willLeave() {
            this.set('documentView.sprites', new SpriteStore['default']());
            this.get('documentView').redrawNow();
            this.get('pendingFetches').setObjects([]);
            this.get('documentView').hideLoading();
        }
    });

});
define('portia-web/controllers/spider/index', ['exports', 'ember', 'portia-web/controllers/spider'], function (exports, Ember, SpiderController) {

    'use strict';

    exports['default'] = SpiderController['default'].extend({
        queryParams: ['url', 'baseurl', 'rmt'],
        url: null,
        baseurl: null,
        rmt: null,

        queryUrl: (function () {
            if (!this.url) {
                return;
            }
            this.fetchQueryUrl();
        }).observes('url'),

        fetchQueryUrl: function fetchQueryUrl() {
            var url = this.url,
                baseurl = this.baseurl;
            this.set('url', null);
            this.set('baseurl', null);
            Ember['default'].run.next(this, function () {
                this.fetchPage(url, null, true, baseurl);
            });
        },

        removeTemplate: (function () {
            if (this.get('rmt')) {
                this.get('model.template_names').removeObject(this.get('rmt'));
                this.set('rmt', null);
            }
        }).observes('rmt'),

        _breadCrumb: null,

        willEnter: function willEnter() {
            this._super();
            if (this.url) {
                this.fetchQueryUrl();
            }
        }
    });

});
define('portia-web/controllers/template-items', ['exports', 'portia-web/controllers/items'], function (exports, Items) {

	'use strict';

	exports['default'] = Items['default'];

});
define('portia-web/controllers/template', ['exports', 'ember', 'portia-web/controllers/base-controller', 'portia-web/models/extractor', 'portia-web/models/mapped-field-data', 'portia-web/utils/sprite-store'], function (exports, Ember, BaseController, Extractor, MappedFieldData, SpriteStore) {

    'use strict';

    exports['default'] = BaseController['default'].extend({

        model: null,

        needs: ['application', 'projects', 'project', 'spider', 'spider/index'],

        _breadCrumb: (function () {
            this.set('breadCrumb', this.get('model.name'));
        }).observes('model.name'),

        annotations: [],

        plugins: {},

        showContinueBrowsing: true,

        showDiscardButton: true,

        showToggleCSS: true,

        showFloatingAnnotationWidgetAt: null,

        floatingAnnotation: null,

        extractionTools: {},

        activeExtractionTool: {
            data: { extracts: [] },
            pluginState: { extracted: [] },
            sprites: new SpriteStore['default']()
        },

        enableExtractionTool: function enableExtractionTool(tool) {
            // Convert old format to new
            var tool_parts = tool.split('.'),
                tool_name = tool_parts[tool_parts.length - 1];
            if (tool_name === 'annotations-plugin' && !this.get('model.plugins.annotations-plugin')) {
                this.set('model.plugins.annotations-plugin', {
                    'extracts': this.get('annotationsStore').findAll()
                });
            } else if (!this.get('model.plugins.' + tool_name)) {
                this.set('model.plugins.' + tool_name, {
                    'extracts': []
                });
            }
            if (!this.get('extractionTools.' + tool_name)) {
                this.set('extractionTools.' + tool_name, Ember['default'].Object.create({
                    data: this.get('model.plugins.' + tool_name),
                    pluginState: {},
                    sprites: new SpriteStore['default']({}),
                    component: tool_name,
                    options: this.getWithDefault('plugins.' + tool.replace(/\./g, '_'), {})
                }));
            }

            this.set('activeExtractionTool', this.get('extractionTools.' + tool_name));
            this.get('documentView').config({
                mode: 'select',
                listener: this,
                dataSource: this,
                partialSelects: true
            });
            this.set('documentView.sprites', this.get('activeExtractionTool.sprites'));
        },

        items: Ember['default'].computed.alias('project_models.items'),
        extractors: Ember['default'].computed.alias('project_models.extractors'),

        scrapedItem: (function () {
            if (!Ember['default'].isEmpty(this.get('items'))) {
                var item = this.get('items').findBy('name', this.get('model.scrapes'));
                if (!item.fields) {
                    item.fields = [];
                }
                return item;
            } else {
                return null;
            }
        }).property('model.scrapes', 'items.@each'),

        displayExtractors: (function () {
            return this.get('extractors').map(function (ext) {
                return {
                    type: ext.get('regular_expression') ? '<RegEx>' : '<Type>',
                    label: ext.get('regular_expression') || ext.get('type_extractor'),
                    extractor: ext
                };
            });
        }).property('extractors.@each', 'model.extractors.@each'),

        currentlySelectedElement: null,

        sprites: (function () {
            return this.get('activeExtractionTool.sprites');
        }).property('activeExtractionTool', 'activeExtractionTool.sprites'),

        saveTemplate: function saveTemplate() {
            if (this.get('model')) {
                this.set('model.extractors', this.validateExtractors());
                this.set('model.plugins', this.getWithDefault('model.plugins', {}));
                for (var key in this.get('extractionTools')) {
                    this.set('model.plugins.' + key, this.getWithDefault('extractionTools.' + key + '.data', { extracts: [] }));
                }
            }
            var missingFields = this.getMissingFields();
            if (missingFields.length > 0) {
                this.showWarningNotification('Required Fields Missing', 'You are unable to save this template as the following required fields are missing: "' + missingFields.join('", "') + '".');
            } else {
                return this.get('slyd').saveTemplate(this.get('controllers.spider.name'), this.get('model'));
            }
        },

        getMissingFields: function getMissingFields() {
            var itemRequiredFields = [],
                scrapedFields = new Set(),
                scraped_item = this.get('scrapedItem');
            if (scraped_item) {
                scraped_item.fields.forEach(function (field) {
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
            return itemRequiredFields.filter(function (field) {
                if (!scrapedFields.has(field)) {
                    return true;
                }
            });
        },

        saveExtractors: function saveExtractors() {
            // Cleanup extractor objects.
            this.get('extractors').forEach(function (extractor) {
                delete extractor['dragging'];
            });
            this.get('slyd').saveExtractors(this.get('extractors'));
        },

        validateExtractors: function validateExtractors() {
            var extractors = this.get('extractors'),
                template_ext = this.get('model.extractors'),
                new_extractors = {},
                validated_extractors = {},
                extractor_ids = new Set(),
                addExtractorToSet = function addExtractorToSet(extractor_id) {
                if (extractor_ids.has(extractor_id)) {
                    new_extractors[field] = new_extractors[field] || new Set();
                    new_extractors[field].add(extractor_id);
                }
            },
                addExtractorToArray = function addExtractorToArray(extractor) {
                arr.push(extractor);
            };
            extractors.forEach(function (extractor) {
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

        getAppliedExtractors: function getAppliedExtractors(fieldName) {
            var extractorIds = this.get('model.extractors.' + fieldName) || [],
                extractors = [],
                seen = new Set();
            for (var i = 0; i < extractorIds.length; i++) {
                var extractor = this.get('extractors').filterBy('name', extractorIds[i])[0];
                if (extractor) {
                    extractor = extractor.copy();
                    extractor['fieldName'] = fieldName;
                    extractor['type'] = extractor.get('regular_expression') ? '<RegEx>' : '<Type>';
                    extractor['label'] = extractor.get('regular_expression') || extractor.get('type_extractor');
                    if (!seen.has(extractor['type'] + extractor['label'])) {
                        extractors.push(extractor);
                        seen.add(extractor['type'] + extractor['label']);
                    }
                }
            }
            return extractors;
        },

        mappedFieldsData: (function () {
            var mappedFieldsData = [],
                seenFields = new Set(),
                scrapedItemFields = new Set(),
                item_required_fields = new Set(),
                extractedFields = this.get('activeExtractionTool.pluginState.extracted'),
                scraped_item = this.get('scrapedItem');
            if (scraped_item) {
                scraped_item.fields.forEach(function (field) {
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
                        var mappedFieldData = mappedFields[field.name] || MappedFieldData['default'].create(),
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
                this.get('scrapedItem').fields.forEach((function (field) {
                    if (!seenFields.has(field.name)) {
                        var mappedFieldData = MappedFieldData['default'].create();
                        mappedFieldData.set('fieldName', field.name);
                        mappedFieldData.set('required', field.required);
                        mappedFieldData.set('disabled', true);
                        mappedFieldData.set('extractors', this.getAppliedExtractors(field.name));
                        mappedFieldsData.pushObject(mappedFieldData);
                    }
                }).bind(this));
            }
            return mappedFieldsData;
        }).property('model.extractors.@each', 'extractors.@each', 'activeExtractionTool.pluginState.extracted', 'scrapedItem.fields.@each'),

        createExtractor: function createExtractor(extractorType, extractorDefinition) {
            var extractor = Extractor['default'].create({
                name: this.shortGuid()
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

        showFloatingAnnotationWidget: function showFloatingAnnotationWidget(_, element, x, y) {
            this.set('showFloatingAnnotationWidgetAt', { x: x, y: y });
            this.set('floatingElement', Ember['default'].$(element));
        },

        hideFloatingAnnotationWidget: function hideFloatingAnnotationWidget() {
            this.set('showFloatingAnnotationWidgetAt', null);
        },

        actions: {

            createField: function createField(item, fieldName, fieldType) {
                item.addField(fieldName, fieldType);
                this.get('slyd').saveItems(this.get('items').toArray());
            },

            rename: function rename(newName) {
                var oldName = this.get('model.name');
                var saveFuture = this.saveTemplate();
                if (!saveFuture) {
                    Ember['default'].run.next(this, function () {
                        this.set('model.name', oldName);
                    });
                    return;
                }
                this.set('templateName', oldName);
                this.set('model.name', newName);
                saveFuture.then((function () {
                    var templateNames = this.get('controllers.spider.model.template_names');
                    newName = this.getUnusedName(newName, templateNames);
                    var spiderName = this.get('controllers.spider.model.name');
                    this.get('slyd').renameTemplate(spiderName, oldName, newName).then((function () {
                        templateNames.removeObject(oldName);
                        templateNames.addObject(newName);
                        this.replaceRoute('template', newName);
                    }).bind(this), (function (err) {
                        this.set('model.name', this.get('templateName'));
                        throw err;
                    }).bind(this));
                }).bind(this));
            },

            createExtractor: function createExtractor(text, option) {
                if (text && text.length > 0) {
                    this.createExtractor('regular_expression', text);
                    this.saveExtractors();
                } else if (option && option.length > 0) {
                    this.createExtractor('type_extractor', option);
                    this.saveExtractors();
                }
            },

            deleteExtractor: function deleteExtractor(extractor) {
                // Remove all references to this extractor.
                var extractors = this.get('model.extractors');
                Object.keys(extractors).forEach((function (fieldName) {
                    extractors[fieldName].removeObject(extractor.extractor.id);
                }).bind(this));
                this.get('extractors').removeObject(extractor.extractor);
                this.saveExtractors();
            },

            applyExtractor: function applyExtractor(fieldName, extractorId) {
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

            removeAppliedExtractor: function removeAppliedExtractor(appliedExtractor) {
                // TODO: we need to automatically remove extractors when the field they
                // extract is no longer mapped from any annotation.
                var fieldName = appliedExtractor['fieldName'];
                this.get('model.extractors')[fieldName].removeObject(appliedExtractor['name']);
                this.notifyPropertyChange('model.extractors');
                this.notifyPropertyChange('mappedFieldsData');
            },

            editItems: function editItems() {
                this.transitionToRoute('template-items');
            },

            continueBrowsing: function continueBrowsing() {
                var saveFuture = this.saveTemplate();
                if (!saveFuture) {
                    return;
                }
                var sprites = this.get('documentView.sprites');
                this.set('documentView.sprites', new SpriteStore['default']());
                saveFuture.then((function () {
                    this.transitionToRoute('spider', {
                        queryParams: {
                            url: this.get('model.url')
                        }
                    });
                }).bind(this), (function (err) {
                    this.set('documentView.sprites', sprites);
                    throw err;
                }).bind(this));
            },

            discardChanges: function discardChanges() {
                var hasData = false,
                    tools = this.get('extractionTools'),
                    finishDiscard = (function () {
                    var params = {
                        url: this.get('model.url')
                    };
                    if (!hasData) {
                        params.rmt = this.get('model.name');
                    }
                    this.transitionToRoute('spider', {
                        queryParams: params
                    });
                }).bind(this);
                this.set('documentView.sprites', new SpriteStore['default']());
                for (var key in tools) {
                    if (((tools[key]['pluginState'] || {})['extracted'] || []).length > 0) {
                        hasData = true;
                        break;
                    }
                }

                if (hasData) {
                    finishDiscard();
                } else {
                    this.get('slyd').deleteTemplate(this.get('slyd.spider'), this.get('model.name')).then(finishDiscard);
                }
            },

            hideFloatingAnnotationWidget: function hideFloatingAnnotationWidget() {
                this.hideFloatingAnnotationWidget();
            },

            toggleCSS: function toggleCSS() {
                this.documentView.toggleCSS();
            },

            updatePluginField: function updatePluginField(field, value) {
                this.set(['extractionTools', this.get('activeExtractionTool.component'), field].join('.'), value);
                this.notifyPropertyChange(['activeExtractionTool', field].join('.'));
            },

            updateScraped: function updateScraped(name) {
                this.set('model.scrapes', name);
            }
        },

        documentActions: {

            elementSelected: function elementSelected(element, mouseX, mouseY) {
                if (element) {
                    this.showFloatingAnnotationWidget(null, element, mouseX, mouseY);
                }
            },

            partialSelection: function partialSelection(selection, mouseX, mouseY) {
                var element = Ember['default'].$('<ins/>').get(0);
                selection.getRangeAt(0).surroundContents(element);
                this.showFloatingAnnotationWidget(null, element, mouseX, mouseY);
            },

            elementHovered: function elementHovered() {
                this.get('documentView').redrawNow();
            }
        },

        setDocument: (function () {
            if (!this.get('model') || !this.get('model.annotated_body') || this.toString().indexOf('template/index') < 0) {
                return;
            }
            this.get('documentView').displayDocument(this.get('model.annotated_body'), (function () {
                if (!this.get('model.plugins')) {
                    this.set('model.plugins', Ember['default'].Object.create({}));
                }
                this.set('activeExtractionTool', {
                    data: { extracts: [] },
                    pluginState: {},
                    sprites: new SpriteStore['default'](),
                    component: 'dummy-component'
                });
                this.set('extractionTools', {});
                this.enableExtractionTool(this.get('capabilities.plugins').get(0)['component'] || 'annotations-plugin');
            }).bind(this));
        }).observes('model', 'model.annotated_body'),

        willEnter: function willEnter() {
            var plugins = {};
            this.get('capabilities.plugins').forEach(function (plugin) {
                plugins[plugin['component'].replace(/\./g, '_')] = plugin['options'];
            });
            this.set('extractedFields', []);
            this.set('plugins', plugins);
            this.setDocument();
        },

        willLeave: function willLeave() {
            this.hideFloatingAnnotationWidget();
            this.get('documentView').hideHoveredInfo();
            this.set('activeExtractionTool', { extracts: [],
                component: 'dummy-component',
                pluginState: {} });
        }
    });

});
define('portia-web/controllers/template/index', ['exports', 'portia-web/controllers/template'], function (exports, TemplateController) {

    'use strict';

    exports['default'] = TemplateController['default'].extend({
        breadCrumb: null,
        _breadCrumb: null
    });

});
define('portia-web/helpers/trim', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports.trim = trim;

  function trim(input, length) {
    return input.substring(0, length || 45);
  }

  exports['default'] = Ember['default'].Handlebars.makeBoundHelper(trim);

});
define('portia-web/initialize', ['exports', 'ember', 'ember-idx-utils/config'], function (exports, Em, IdxConfig) {

  'use strict';

  exports['default'] = {
    name: 'ember-idx-utils',
    initialize: function initialize() {
      if (!Em['default'].IdxConfig) {
        Em['default'].IdxConfig = IdxConfig['default'].create();
      }
    }
  };

});
define('portia-web/initializers/add-prototypes', ['exports', 'ember', 'portia-web/models/attribute'], function (exports, Ember, Attribute) {

    'use strict';

    exports.initialize = initialize;

    function initialize() {
        Ember['default'].$.fn.getUniquePath = function () {
            if (this.length !== 1) {
                throw 'Requires one element.';
            }
            var path,
                node = this;
            while (node.length) {
                var realNode = node[0],
                    name = realNode.localName;
                if (!name) {
                    break;
                }
                name = name.toLowerCase();
                var parent = node.parent();
                var siblings = parent.children(name);
                if (siblings.length > 1) {
                    name += ':eq(' + siblings.index(realNode) + ')';
                }
                path = name + (path ? '>' + path : '');
                node = parent;
            }
            return path;
        };

        Ember['default'].$.fn.getPath = function () {
            if (!this.prop('tagName')) {
                return;
            }
            var path = [this.prop('tagName').toLowerCase()];
            this.parents().not('html').each(function () {
                var entry = this.tagName.toLowerCase();
                path.push(entry);
            });
            return path.reverse().join(' > ');
        };

        Ember['default'].$.fn.getAttributeList = function () {
            var attributeList = [],
                text_content_key = 'content';
            if (this.attr('content')) {
                text_content_key = 'text content';
            }
            if (this.text()) {
                attributeList.push(Attribute['default'].create({
                    name: text_content_key,
                    value: this.text() }));
            }
            var element = this.get(0);
            if (!element) {
                return [];
            }
            Ember['default'].$(element.attributes).each(function () {
                if (Ember['default'].$.inArray(this.nodeName, Ember['default'].$.fn.getAttributeList.ignoredAttributes) === -1 && this.value) {
                    attributeList.push(Attribute['default'].create({
                        name: this.nodeName,
                        value: this.value }));
                }
            });
            return attributeList;
        };

        Ember['default'].$.fn.getAttributeList.ignoredAttributes = ['id', 'class', 'width', 'style', 'height', 'cellpadding', 'cellspacing', 'border', 'bgcolor', 'color', 'colspan', 'data-scrapy-annotate', 'data-tagid', 'data-genid'];

        Ember['default'].$.fn.boundingBox = function () {
            if (!this || !this.offset()) {
                return { top: 0, left: 0, width: 0, height: 0 };
            }
            var rect = {};
            rect.left = this.offset().left;
            rect.top = this.offset().top;
            rect.width = this.outerWidth();
            rect.height = this.outerHeight();
            return rect;
        };

        Ember['default'].$.fn.isDescendant = function (parent) {
            return Ember['default'].$(parent).find(this).length > 0;
        };

        Ember['default'].$.fn.findAnnotatedElements = function () {
            return this.find('[data-scrapy-annotate]');
        };

        Ember['default'].$.fn.findAnnotatedElement = function (annotationId) {
            var selector = '[data-scrapy-annotate*="' + annotationId + '"]';
            return this.find(selector);
        };

        Ember['default'].$.fn.findIgnoredElements = function (annotationId) {
            var selector;
            if (annotationId) {
                selector = '[data-scrapy-ignore*="' + annotationId + '"], [data-scrapy-ignore-beneath*="' + annotationId + '"]';
            } else {
                selector = '[data-scrapy-ignore], [data-scrapy-ignore-beneath]';
            }
            return this.find(selector);
        };

        Ember['default'].$.fn.removePartialAnnotation = function () {
            // FIXME: this may leave empty text node children.
            var element = this.get(0);
            var textNode = element.childNodes[0];
            var parentNode = element.parentNode;
            Ember['default'].$(textNode).unwrap();
            parentNode.normalize();
        };

        Ember['default'].$.fn.renameAttr = function (from, to) {
            return this.each(function () {
                var $this = Ember['default'].$(this);
                $this.attr(to, $this.attr(from));
                $this.removeAttr(from);
            });
        };

        Ember['default'].$.expr[':'].hasAttrWithPrefix = Ember['default'].$.expr.createPseudo(function (prefix) {
            return function (obj) {
                for (var i = 0; i < obj.attributes.length; i++) {
                    if (obj.attributes[i].nodeName.indexOf(prefix) === 0) {
                        return true;
                    }
                }
                return false;
            };
        });

        String.prototype.lstrip = function () {
            return this.replace(/^[\s\r\n]*/g, '');
        };

        if (!String.prototype.trim) {
            (function () {
                // Make sure we trim BOM and NBSP
                var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
                String.prototype.trim = function () {
                    return this.replace(rtrim, '');
                };
            })();
        }
    }

    exports['default'] = {
        name: 'add-prototypes',
        initialize: initialize
    };

});
define('portia-web/initializers/bread-crumbs', ['exports'], function (exports) {

  'use strict';

  exports['default'] = {
    name: "ember-breadcrumbs",
    initialize: function initialize(container, app) {
      app.inject("component:bread-crumbs", "router", "router:main");
      app.inject("component:bread-crumbs", "applicationController", "controller:application");
    }
  };

});
define('portia-web/initializers/controller-helper', ['exports'], function (exports) {

  'use strict';

  exports.initialize = initialize;

  function initialize(_, app) {
    app.inject('controller', 'router', 'router:main');
  }

  exports['default'] = {
    name: 'controller-helper',
    initialize: initialize
  };

});
define('portia-web/initializers/ember-cli-auto-register-helpers', ['exports', 'ember', 'portia-web/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize() {
    var matcher = new RegExp(config['default'].modulePrefix + '/helpers/.*');

    Ember['default'].A(Ember['default'].keys(window.require.entries)).filter(function (path) {
      return matcher.test(path);
    }).forEach(function (path) {
      var helperName = path.replace(config['default'].modulePrefix + '/helpers/', '');
      Ember['default'].Handlebars.registerHelper(helperName, window.require(path)['default']);
    });
  }

  ;

  exports['default'] = {
    name: 'ember-cli-auto-register-helpers',
    initialize: initialize
  };

});
define('portia-web/initializers/error-handler', ['exports', 'ember', 'portia-web/utils/notification-manager'], function (exports, Ember, NotificationManager) {

    'use strict';

    exports.initialize = initialize;

    function initialize(container, application) {
        function notifyError(err) {
            if (err.name === 'HTTPError') {
                if (!err.data) {
                    console.log(err.message);
                }
            } else {
                console.log(err);
            }

            NotificationManager['default'].add({
                title: err.title || 'Unexpected error',
                message: err.name === 'HTTPError' && err.data && err.data.detail ? err.data.detail : 'An unexpected error has occurred. Please notify the developers. ' + 'Details have been logged to the console.',
                type: err.status === 400 ? 'warning' : 'danger'
            });
        }

        Ember['default'].onerror = notifyError;

        application.ApplicationRoute = Ember['default'].Route.extend({
            actions: {
                error: notifyError
            }
        });
    }

    exports['default'] = {
        name: 'error-handler',
        initialize: initialize
    };

});
define('portia-web/initializers/export-application-global', ['exports', 'ember', 'portia-web/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  }

  ;

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };

});
define('portia-web/initializers/idx-accordion-config', ['exports', 'ember', 'ember-idx-utils/config'], function (exports, Em, IdxConfig) {

    'use strict';

    exports['default'] = {
        name: 'ember-idx-accordion',
        initialize: function initialize() {
            var Config = Em['default'].IdxConfig = Em['default'].IdxConfig ? Em['default'].IdxConfig : IdxConfig['default'].create();

            var defaultConfig = Config.getConfig('default');
            if (!defaultConfig) {
                Config.addConfig('default');
                defaultConfig = Config.getConfig('default');
            }

            //Bootstrap
            var bsConfig = Config.getConfig('bs');
            if (!bsConfig) {
                Config.addConfig('bs');
                bsConfig = Config.getConfig('bs');
            }
            bsConfig['accordion'] = {
                classes: ['panel-group'],
                itemClasses: ['panel', 'panel-default'],
                itemSelectedClasses: ['active'],
                panelHeaderClasses: ['panel-heading'],
                panelTitleClasses: ['panel-title'],
                panelTogglerClasses: ['accordion-toggle'],
                panelBodyContainerClasses: ['panel-collapse', 'collapse'],
                panelBodyClasses: ['panel-body']
            };
        }
    };

});
define('portia-web/initializers/messages', ['exports', 'portia-web/utils/messages'], function (exports, Messages) {

    'use strict';

    exports.initialize = initialize;

    function initialize(container, application) {
        container.register('app:messages', Messages['default'], { instantiate: false });
        application.inject('controller', 'messages', 'app:messages');
        application.inject('component:inline-help', 'messages', 'app:messages');
    }

    exports['default'] = {
        name: 'messages',
        initialize: initialize
    };

});
define('portia-web/initializers/project-models', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports.initialize = initialize;

    function initialize(container, application) {
        var globals = Ember['default'].Object.create({ items: null, extractors: null, projects: {} });
        container.register('projects:models', globals, { instantiate: false });
        application.inject('controller', 'project_models', 'projects:models');
        application.inject('route', 'project_models', 'projects:models');
    }

    exports['default'] = {
        name: 'project-models',
        initialize: initialize
    };

});
define('portia-web/initializers/register-api', ['exports', 'ember', 'ic-ajax', 'portia-web/config/environment', 'portia-web/utils/slyd-api', 'portia-web/utils/timer', 'portia-web/mixins/application-utils'], function (exports, Ember, ajax, config, SlydApi, Timer, ApplicationUtils) {

    'use strict';

    exports.initialize = initialize;

    var UUID = Ember['default'].Object.extend(ApplicationUtils['default'], {});
    function initialize(container, application) {
        application.deferReadiness();
        var hash = {};
        hash.type = 'GET';
        hash.url = (config['default'].SLYD_URL || window.location.protocol + '//' + window.location.host) + '/server_capabilities';
        ajax['default'](hash).then((function (settings) {
            this.set('serverCapabilities', settings['capabilities']);
            this.set('serverCustomization', Ember['default'].Object.create());
            for (var key in settings['custom']) {
                this.set('serverCustomization.' + key, Ember['default'].Object.create().setProperties(settings['custom'][key]));
            }
            container.register('api:capabilities', Ember['default'].Object.create().setProperties(application.get('serverCapabilities')), { instantiate: false });
            container.register('app:custom', Ember['default'].Object.create().setProperties(application.get('serverCustomization')), { instantiate: false });
            var api = new SlydApi['default']();
            api.set('username', settings.username);
            api.set('sessionid', new UUID().shortGuid());
            api.set('serverCapabilities', container.lookup('api:capabilities'));
            api.set('timer', new Timer['default']());
            container.register('api:slyd', api, { instantiate: false });
            application.inject('route', 'slyd', 'api:slyd');
            application.inject('adapter', 'slyd', 'api:slyd');
            application.inject('controller', 'slyd', 'api:slyd');
            application.inject('component', 'slyd', 'api:slyd');
            application.inject('controller', 'customizations', 'app:custom');
            application.inject('controller', 'capabilities', 'api:capabilities');
            application.inject('route', 'capabilities', 'api:capabilities');
            this.advanceReadiness();
        }).bind(application));
    }

    exports['default'] = {
        name: 'register-api',
        initialize: initialize
    };

});
define('portia-web/initializers/register-modal', ['exports', 'portia-web/utils/modal-manager'], function (exports, ModalManager) {

    'use strict';

    exports.initialize = initialize;

    function initialize(container, application) {
        var manager = new ModalManager['default']();
        container.register('modal:manager', manager, { instantiate: false });
        application.inject('component:bs-modal', 'ModalManager', 'modal:manager');
        application.inject('component:bs-dropdown', 'ModalManager', 'modal:manager');
        application.inject('controller', 'ModalManager', 'modal:manager');
    }

    exports['default'] = {
        name: 'register-modal',
        initialize: initialize
    };

});
define('portia-web/initializers/register-page-interaction', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    container.register('document:obj', Ember['default'].Object.create({ view: null,
      store: null,
      iframe: null }), { instantiate: false });
    application.inject('controller', 'document', 'document:obj');
    application.inject('component:web-document', 'document', 'document:obj');
    application.inject('component:tool-box', 'document', 'document:obj');
    application.inject('component:annotation-widget', 'document', 'document:obj');
    application.inject('model', 'document', 'document:obj');
  }

  exports['default'] = {
    name: 'register-page-interaction',
    initialize: initialize
  };

});
define('portia-web/initializers/toolbox', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports.initialize = initialize;

    function initialize(container, application) {
        container.register('toolbox:state', Ember['default'].Object.create({
            fixed: false,
            expand: false,
            pinned: !!(window.localStorage && localStorage.portia_toolbox_pinned)
        }), { instantiate: false });
        application.inject('route', 'toolbox', 'toolbox:state');
        application.inject('component:tool-box', 'control', 'toolbox:state');
        application.inject('component:tool-box', 'router', 'router:main');
        application.inject('component:tool-box', 'applicationController', 'controller:application');
    }

    exports['default'] = {
        name: 'toolbox',
        initialize: initialize
    };

});
define('portia-web/mixins/app-visibility', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        init: function init() {
            var hidden, visibilityChange;
            if (typeof document.hidden !== "undefined") {
                hidden = "hidden";
                visibilityChange = "visibilitychange";
            } else if (typeof document.mozHidden !== "undefined") {
                hidden = "mozHidden";
                visibilityChange = "mozvisibilitychange";
            } else if (typeof document.msHidden !== "undefined") {
                hidden = "msHidden";
                visibilityChange = "msvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                hidden = "webkitHidden";
                visibilityChange = "webkitvisibilitychange";
            }
            // Handle user changing tab
            document.addEventListener(visibilityChange, (function () {
                if (document[hidden]) {
                    this.get("slyd.timer").pause();
                } else {
                    this.get("slyd.timer").resume();
                }
            }).bind(this), false);
            // Handle user putting browser into background
            window.addEventListener("blur", (function () {
                this.get("slyd.timer").pause();
            }).bind(this));
            window.addEventListener("focus", (function () {
                this.get("slyd.timer").resume();
            }).bind(this));
        }
    });

});
define('portia-web/mixins/application-utils', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        s4: function s4() {
            return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
        },

        guid: function guid() {
            return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4();
        },

        shortGuid: function shortGuid(separator) {
            separator = typeof separator !== 'undefined' ? separator : '-';
            return this.s4() + separator + this.s4() + separator + this.s4();
        },

        toType: function toType(obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }
    });

});
define('portia-web/mixins/controller-utils', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        serverCapability: function serverCapability(capability) {
            return this.serverCapabilities.get(capability);
        },

        openAccordion: function openAccordion(accordionNumber) {
            Ember['default'].$(".accordion").accordion("option", "active", accordionNumber);
        },

        getUnusedName: function getUnusedName(baseName, usedNames) {
            var i = 1;
            var newName = baseName;
            var name_cmp = function name_cmp(usedName) {
                return usedName === newName;
            };
            while (usedNames.any(name_cmp)) {
                newName = baseName + "_" + i++;
            }
            return newName;
        }

    });

});
define('portia-web/mixins/draggable', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        attributeBindings: ['draggable'],
        draggable: true,
        content: null,

        dragStart: function dragStart(event) {
            this._super(event);
            var dataTransfer = event.originalEvent.dataTransfer;
            dataTransfer.setDragImage(this.get('element'), Ember['default'].$(this.get('element')).width() / 2, Ember['default'].$(this.get('element')).height());
            dataTransfer.setData('data', this.get('content'));
        }
    });

});
define('portia-web/mixins/droppable', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        classNameBindings: ['dragClass'],
        dragClass: 'deactivated',
        content: null,

        drop: function drop(event) {
            event.preventDefault();
            this.set('dragClass', '');
            var data = event.originalEvent.dataTransfer.getData('data');
            this.sendAction('action', this.get('content'), data);
            return false;
        },

        dragLeave: function dragLeave(event) {
            event.preventDefault();
            this.set('dragClass', '');
        },

        dragOver: function dragOver(event) {
            event.preventDefault();
            this.set('dragClass', 'drop-target-dragging');
        }
    });

});
define('portia-web/mixins/guess-types', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    var TAG_TYPES = {
        text: new Set(["b", "blockquote", "cite", "code", "dd", "del", "dfn", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6", "i", "id", "ins", "kbd", "lang", "mark", "p", "rb", "s", "samp", "small", "span", "strong", "sub", "sup", "td", "th", "title", "u"]),
        date: new Set(["time"]),
        media: new Set(["audio", "embed", "img", "source", "video"]),
        url: new Set(["a", "area"]),
        data: new Set(["data"]),
        option: new Set(["option"]),
        input: new Set(["input"]),
        quote: new Set(["q"]),
        meta: new Set(["meta"]),
        map: new Set(["map"]),
        article: new Set(["article"]),
        abbr: new Set(["abbr"])
    };

    var TYPE_FIELD_ORDER = {
        text: ["text content"],
        date: ["datetime", "text content"],
        media: ["src", "srcset", "media"],
        url: ["href"],
        data: ["value", "text content"],
        option: ["label", "value", "text content"],
        input: ["value", "src", "name", "type"],
        quote: ["cite", "text content"],
        meta: ["content"],
        map: ["name"],
        article: ["text content"],
        abbr: ["title", "text content"]
    };

    var FIELD_TYPE = {
        text: "text",
        date: "date",
        media: "image",
        url: "url",
        map: "text",
        article: "safe html"
    };

    var VOCAB_FIELD_PROPERTY = {
        image: new Set(["photo"]),
        price: new Set(["price"]),
        geopoint: new Set(["geo"]),
        url: new Set(["logo", "agent", "sound", "url", "attach", "license"]),
        date: new Set(["bday", "rev", "dtstart", "dtend", "exdate", "rdate", "created", "last-modified"])
    };

    var VOCAB_FIELD_CLASS = {
        number: new Set(["p-rating", "p-best", "p-worst", "p-longitude", "p-latitude", "p-yield"]),
        image: new Set(["u-photo"]),
        geopoint: new Set(["u-geo", "p-geo"]),
        url: new Set(["u-url", "u-url"]),
        date: new Set(["dt-bday", "dt-reviewed", "dt-start", "dt-end", "dt-rev", "dt-published", "dt-updated"])
    };

    exports['default'] = Ember['default'].Mixin.create({
        guessFieldName: function guessFieldName(element) {
            if (element.attributes.property) {
                return element.attributes.property.value;
            }
            if (element.attributes.itemprop) {
                return element.attributes.itemprop.value;
            }
            if (element.attributes.name) {
                return element.attributes.name.value;
            }
        },

        guessFieldType: function guessFieldType(extractedData, element, guess) {
            var type = this.guessFieldClassification(element);
            if (type !== null) {
                var classes = element.classList,
                    attributes = element.attributes,
                    property;
                if (attributes.property) {
                    property = attributes.property.value;
                }
                if (attributes.itemprop) {
                    property = attributes.itemprop.value;
                }
                if (guess || !FIELD_TYPE[type]) {
                    return this.guessType(extractedData, property, classes);
                }
                return FIELD_TYPE[type];
            }
        },

        guessFieldExtraction: function guessFieldExtraction(element, attributes) {
            var type = this.guessFieldClassification(element);
            if (type !== null) {
                var fieldOrders = TYPE_FIELD_ORDER[type];
                attributes = attributes || element.attributes;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = fieldOrders[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var f = _step.value;

                        if (f === "text content") {
                            if (attributes.contains("text content")) {
                                return f;
                            } else {
                                return "content";
                            }
                        }
                        if (attributes.contains(f)) {
                            return f;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator["return"]) {
                            _iterator["return"]();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        },

        guessFieldClassification: function guessFieldClassification(element) {
            var tag = element.tagName.toLowerCase();
            for (var key in TAG_TYPES) {
                if (TAG_TYPES[key].has(tag)) {
                    return key;
                }
            }
            return null;
        },

        guessType: function guessType(data, property, classes) {
            var classes = Array.prototype.slice.call(classes, 0),
                key;
            if (property) {
                for (key in VOCAB_FIELD_PROPERTY) {
                    if (VOCAB_FIELD_PROPERTY[key].has(property)) {
                        return key;
                    }
                }
            }
            if (classes) {
                var prefixes = new Set(["p", "u", "dt"]);
                classes = classes.filter(function (c) {
                    return prefixes.has(c.split("-")[0]);
                });
                if (classes.length) {
                    for (key in VOCAB_FIELD_CLASS) {
                        for (var i = 0; i < classes.length; i++) {
                            property = classes[i];
                            if (VOCAB_FIELD_CLASS[key].has(property)) {
                                return key;
                            }
                        }
                    }
                }
            }
            if (/^(?:(?:http)|(?:\/))/.test(data)) {
                return "url";
            }
            data = data.trim();
            var geopoint = data.match(/[+-]?\d+(?:\.\d+)?[,;]\s?[+-]?\d+(?:\.\d+)?/);
            if (geopoint !== null) {
                return "geopoint";
            }
            var prices = data.match(/\d+(?:(?:,\d{3})+)?(?:.\d+)?/);
            if (prices !== null && prices.length && prices[0].length / data.length > 0.05) {
                return "prices";
            }
            var numbers = data.match(/\d+(?:\.\d+)?/);
            if (numbers !== null && numbers.length && numbers[0].length / data.length > 0.05) {
                return "number";
            }
            return "text";
        }
    });

});
define('portia-web/mixins/modal-handler', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({

        actions: {
            modalConfirmed: function modalConfirmed() {
                var name = this.get('_modalName');
                this.set('_modalName', null);
                if (typeof this.get('_modalOKCallback') === 'function') {
                    this.get('_modalOKCallback')();
                }
                if (name) {
                    return this.ModalManager.get('name').destroy();
                }
            },

            modalCancelled: function modalCancelled() {
                var name = this._modalName;
                this._modalName = null;
                if (typeof this.get('_modalCancelCallback') === 'function') {
                    this.get('_modalCancelCallback')();
                }
                if (name) {
                    return this.ModalManager.get('name').destroy();
                }
            }
        },

        showConfirm: function showConfirm(title, content, okCallback, cancelCallback, button_class, button_text) {
            if (this.get('_modalName')) {
                // There is already a modal visible
                return;
            }
            if (button_class === undefined) {
                button_class = 'primary';
            }
            if (button_text === undefined) {
                button_text = 'OK';
            }
            this.set('_modalName', 'ConfirmModal');
            var buttons = [Ember['default'].Object.create({ dismiss: 'modal', type: 'default', label: 'Cancel', clicked: 'modalCancelled', size: 'sm' }), Ember['default'].Object.create({ dismiss: 'modal', type: button_class, label: button_text, clicked: 'modalConfirmed', size: 'sm' })];
            return this.showModal(title, content, null, null, buttons, okCallback, cancelCallback);
        },

        showComponentModal: function showComponentModal(title, component, componentData, okCallback, cancelCallback, button_class, button_text) {
            this.set('_modalName', 'ComponentModal');
            var buttons = [Ember['default'].Object.create({ dismiss: 'modal', type: 'default', label: 'Cancel', clicked: 'modalCancelled', size: 'sm' }), Ember['default'].Object.create({ dismiss: 'modal', type: button_class, label: button_text, clicked: 'modalConfirmed', size: 'sm' })];
            this.showModal(title, null, component, componentData, buttons, okCallback, cancelCallback);
        },

        showModal: function showModal(title, content, component, componentData, buttons, okCallback, cancelCallback) {
            this.set('_modalOKCallback', okCallback);
            this.set('_modalCancelCallback', cancelCallback);
            return this.ModalManager.open(this.get('_modalName'), title, buttons, content, component, componentData, this);
        }
    });

});
define('portia-web/mixins/notification-handler', ['exports', 'ember', 'portia-web/utils/notification-manager'], function (exports, Ember, NotificationManager) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        showNotification: function showNotification(title, message, type) {
            if (title && !message) {
                message = title;
                title = null;
            }
            if (message) {
                NotificationManager['default'].add({
                    title: title,
                    message: message,
                    type: type || 'info'
                });
            }
        },

        showSuccessNotification: function showSuccessNotification(title, message) {
            this.showNotification(title, message, 'success');
        },

        showWarningNotification: function showWarningNotification(title, message) {
            this.showNotification(title, message, 'warning');
        },

        showErrorNotification: function showErrorNotification(title, message) {
            this.showNotification(title, message, 'danger');
        }
    });

});
define('portia-web/mixins/popover', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        addTooltip: function addTooltip() {
            if (this.get('title')) {
                this.$().tooltip({
                    placement: this.getWithDefault('popoverPlacement', 'bottom'),
                    template: '<div class="tooltip" role="tooltip">' + '<div class="tooltip-arrow"></div>' + '<div><div class="tooltip-inner"></div>' + '</div></div>' + '</div>',
                    html: this.getWithDefault('html', false)
                });
            }
        },

        didInsertElement: function didInsertElement() {
            this.addTooltip();
            this._super();
        }
    });

});
define('portia-web/mixins/size-listener', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        full_box_height: 600,
        mid_box_height: 500,
        small_box_height: 400,
        tiny_box_height: 300,
        ex_tiny_box_height: 200,
        breadCrumb: null,
        breadCrumbs: null,

        handleResize: function handleResize() {
            Ember['default'].$('.adjust-height').height(window.innerHeight - 38);
            this.set('full_box_height', Math.max(80, window.innerHeight - 200));
            this.set('mid_box_height', Math.max(80, window.innerHeight - 300));
            this.set('small_box_height', Math.max(80, window.innerHeight - 400));
            this.set('tiny_box_height', Math.max(80, window.innerHeight - 500));
            this.set('ex_tiny_box_height', Math.max(60, window.innerHeight - 600));
        },

        full_box_style: (function () {
            return ('max-height: ' + this.full_box_height + 'px;').htmlSafe();
        }).property('full_box_height'),

        mid_box_style: (function () {
            return ('max-height: ' + this.mid_box_height + 'px;').htmlSafe();
        }).property('mid_box_height'),

        small_box_style: (function () {
            return ('max-height: ' + this.small_box_height + 'px;').htmlSafe();
        }).property('small_box_height'),

        tiny_box_style: (function () {
            return ('max-height: ' + this.tiny_box_height + 'px;').htmlSafe();
        }).property('tiny_box_height'),

        ex_tiny_box_style: (function () {
            return ('max-height: ' + this.ex_tiny_box_height + 'px;').htmlSafe();
        }).property('ex_tiny_box_height'),

        bindResizeEvent: (function () {
            this.handleResize();
            Ember['default'].$(window).on('resize', Ember['default'].run.bind(this, this.handleResize));
        }).on('init'),

        openAccordion: function openAccordion(accordionNumber) {
            Ember['default'].$('.accordion').accordion('option', 'active', accordionNumber);
        }
    });

});
define('portia-web/mixins/toolbox-state-mixin', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Mixin.create({
        willEnter: function willEnter() {
            this.set('toolbox.fixed', this.get('fixedToolbox') || false);
        }
    });

});
define('portia-web/models/annotation', ['exports', 'ember', 'portia-web/models/simple-model', 'portia-web/models/ignore'], function (exports, Ember, SimpleModel, Ignore) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({

        init: function init() {
            this._super();
            if (!this.get('iframe')) {
                this.set('iframe', Ember['default'].$(this[0]));
            }
            var ignoredElements = this.get('iframe').findIgnoredElements(this.get('id')).toArray();
            var ignores = ignoredElements.map(function (element) {
                var attributeName = Ember['default'].$(element).attr('data-scrapy-ignore') ? 'data-scrapy-ignore' : 'data-scrapy-ignore-beneath';
                var name = Ember['default'].$.parseJSON(Ember['default'].$(element).attr(attributeName))['name'];
                return Ignore['default'].create({ element: element,
                    name: name,
                    ignoreBeneath: attributeName === 'data-scrapy-ignore-beneath' });
            });
            this.set('ignores', ignores);
            if (this.get('required') === null) {
                this.set('required', []);
            }
            if (this.get('annotations') === null) {
                this.set('annotations', {});
            }
        },

        idBinding: null,

        serializedProperties: ['id', 'variant', 'annotations', 'required', 'generated'],

        name: (function () {
            var annotations = this.get('annotations');
            if (annotations && Object.keys(annotations).length) {
                var name = '';
                Object.keys(annotations).forEach(function (key) {
                    name += (name.length ? ', ' : '') + key + '  >  ';
                    name += annotations[key];
                });
                return name;
            } else {
                return 'No mappings';
            }
        }).property('annotations'),

        variant: 0,

        annotations: null,

        required: null,

        generated: false,

        ignores: null,

        addMapping: function addMapping(attribute, itemField) {
            this.get('annotations')[attribute] = itemField;
            this.notifyPropertyChange('annotations');
        },

        removeMapping: function removeMapping(attribute) {
            this.removeRequired(this.get('annotations')[attribute]);
            delete this.get('annotations')[attribute];
            this.notifyPropertyChange('annotations');
        },

        removeMappings: function removeMappings() {
            this.set('annotations', {});
            this.set('required', []);
            this.notifyPropertyChange('annotations');
        },

        addRequired: function addRequired(field) {
            this.get('required').pushObject(field);
        },

        removeRequired: function removeRequired(field) {
            this.get('required').removeObject(field);
        },

        addIgnore: function addIgnore(element) {
            var ignore = Ignore['default'].create({ element: element });
            this.get('ignores').pushObject(ignore);
        },

        removeIgnore: function removeIgnore(ignore) {
            this.get('ignores').removeObject(ignore);
        },

        removeIgnores: function removeIgnores() {
            this.get('ignores').setObjects([]);
        },

        partialText: (function () {
            if (this.get('element') && this.get('generated')) {
                return Ember['default'].$(this.get('element')).text();
            } else {
                return '';
            }
        }).property('element'),

        selectedElement: null,

        element: (function () {
            if (this.get('selectedElement')) {
                return this.get('selectedElement');
            } else {
                var annotatedElement = this.get('iframe').findAnnotatedElement(this.get('id'));
                if (annotatedElement.length) {
                    return annotatedElement.get(0);
                } else {
                    return null;
                }
            }
        }).property('selectedElement'),

        path: (function () {
            if (this.get('element')) {
                return Ember['default'].$(this.get('element')).getUniquePath();
            } else {
                return '';
            }
        }).property('element'),

        ancestorPaths: (function () {
            if (!this.get('element')) {
                return [];
            }
            var path = this.get('path'),
                splitted = path.split('>'),
                result = [],
                selector = '';
            splitted.forEach((function (pathElement) {
                var ancestorPath = {};
                selector += (selector ? '>' : '') + pathElement;
                ancestorPath['path'] = selector;
                var element = this.get('iframe').find(selector).get(0);
                ancestorPath['element'] = element;
                ancestorPath['label'] = element.tagName.toLowerCase();
                result.pushObject(ancestorPath);
            }).bind(this));
            return result;
        }).property('path'),

        childPaths: (function () {
            if (!this.get('element')) {
                return [];
            }
            var result = [];
            if (this.get('element')) {
                var path = this.get('path');
                var children = this.get('element').children;
                children = Array.prototype.slice.call(children);
                children.forEach(function (child, i) {
                    var childPath = {};
                    childPath['label'] = child.tagName.toLowerCase();
                    childPath['path'] = path + '>' + ':eq(' + i + ')';
                    childPath['element'] = child;
                    result.pushObject(childPath);
                });
            }
            return result;
        }).property('path'),

        attributes: (function () {
            if (this.get('element')) {
                return Ember['default'].$(this.get('element')).getAttributeList();
            } else {
                return [];
            }
        }).property('element'),

        unmappedAttributes: (function () {
            return this.get('attributes').filter((function (attribute) {
                return !this.get('annotations')[attribute.get('name')];
            }).bind(this));
        }).property('attributes.@each', 'annotations'),

        _mappedAttributes: function _mappedAttributes(filter) {
            var mapped = [];
            if (this.get('annotations')) {
                this.get('attributes').forEach((function (attribute) {
                    var mappedTo = this.get('annotations')[attribute.get('name')];
                    if (filter(mappedTo)) {
                        attribute.set('mappedField', mappedTo);
                        mapped.addObject(attribute);
                    }
                }).bind(this));
            }
            return mapped;
        },

        mappedAttributes: (function () {
            return this._mappedAttributes(function (fieldName) {
                return fieldName && fieldName.indexOf('_sticky') !== 0;
            });
        }).property('attributes.@each', 'annotations'),

        stickyAttributes: (function () {
            return this._mappedAttributes(function (fieldName) {
                return fieldName && fieldName.indexOf('_sticky') === 0;
            });
        }).property('attributes.@each', 'annotations')
    });

});
define('portia-web/models/attribute', ['exports', 'portia-web/models/simple-model'], function (exports, SimpleModel) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({
        value: null,
        mappedField: null,
        annotation: null
    });

});
define('portia-web/models/conflict', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Object.extend({});

});
define('portia-web/models/extracted-field', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend({
        name: null,
        type: null,
        value: null
    });

});
define('portia-web/models/extracted-item', ['exports', 'ember', 'portia-web/models/extracted-field', 'portia-web/models/extracted-variant'], function (exports, Ember, ExtractedField, ExtractedVariant) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend({
        definition: null,
        extracted: null,
        matchedTemplate: null,

        url: (function () {
            return this.get('extracted.url');
        }).property('extracted'),

        fields: (function () {
            var fields = [],
                item = this.get('extracted');
            Object.keys(item).forEach((function (key) {
                var fieldDefinition = this.get('definition.fields').findBy('name', key);
                if (fieldDefinition) {
                    fields.pushObject(ExtractedField['default'].create({ name: key, type: fieldDefinition.get('type'), value: item[key] }));
                }
            }).bind(this));
            return fields;
        }).property('extracted', 'definition'),

        variants: (function () {
            var variants = [],
                item = this.get('extracted');
            if (!Ember['default'].isEmpty(item['variants'])) {
                item.variants.forEach((function (variant) {
                    var fields = [];
                    Object.keys(variant).forEach((function (key) {
                        fields.pushObject(ExtractedField['default'].create({ name: key, type: 'variant', value: variant[key] }));
                    }).bind(this));
                    variants.pushObject(ExtractedVariant['default'].create({ fields: fields }));
                }).bind(this));
            }
            return variants;
        }).property('extracted', 'definition')
    });

});
define('portia-web/models/extracted-variant', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend({
        fields: null
    });

});
define('portia-web/models/extractor', ['exports', 'portia-web/models/simple-model'], function (exports, SimpleModel) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({

        serializedProperties: (function () {
            var serializedProperties = ['name'];
            if (this.get('regular_expression')) {
                serializedProperties.pushObject('regular_expression');
            } else {
                serializedProperties.pushObject('type_extractor');
            }
            return serializedProperties;
        }).property('regular_expression', 'type_extractor'),

        regular_expression: null,
        type_extractor: null
    });

});
define('portia-web/models/ignore', ['exports', 'portia-web/models/simple-model'], function (exports, SimpleModel) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({
        element: null,
        ignoreBeneath: false,
        highlighted: false
    });

});
define('portia-web/models/item-field', ['exports', 'portia-web/models/simple-model'], function (exports, SimpleModel) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({
        serializedProperties: ['name', 'type', 'required', 'vary'],
        type: 'text',
        required: false,
        vary: false
    });

});
define('portia-web/models/item', ['exports', 'portia-web/models/simple-model', 'portia-web/models/item-field'], function (exports, SimpleModel, ItemField) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({
        serializedRelations: ['fields'],
        serializedProperties: ['name'],
        fields: null,

        validateName: function validateName(name) {
            return /^[A-Za-z0-9_-]+$/g.test(name);
        },

        isValid: function isValid() {
            return this.validateName(this.get('name')) && this.get('fields').reduce((function (previousValue, field) {
                return previousValue && this.validateName(field.get('name'));
            }).bind(this), true);
        },

        addField: function addField(name, type) {
            var newField = ItemField['default'].create({ name: name || 'new_field',
                type: type || 'text',
                required: false,
                vary: false });
            this.get('fields').pushObject(newField);
        }
    });

});
define('portia-web/models/mapped-field-data', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend({
        fieldName: null,
        extractors: [],
        required: false,
        extracted: false,
        disabled: true
    });

});
define('portia-web/models/simple-model', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend(Ember['default'].Copyable, {
        idBinding: 'name',
        name: null,
        serializedProperties: null,
        serializedRelations: null,

        copy: function copy() {
            return Ember['default'].run(this.constructor, 'create', this);
        },

        serialize: function serialize() {
            var serialized = this.getProperties(this.get('serializedProperties'));
            if (!Ember['default'].isEmpty(this.get('serializedRelations'))) {
                this.get('serializedRelations').forEach((function (relation) {
                    if (!Ember['default'].isEmpty(this.get(relation))) {
                        serialized[relation] = this.get(relation).map(function (relatedObject) {
                            return relatedObject.serialize();
                        });
                    } else {
                        serialized[relation] = [];
                    }
                }).bind(this));
            }
            return serialized;
        }
    });

});
define('portia-web/models/spider', ['exports', 'ember', 'portia-web/models/simple-model'], function (exports, Ember, SimpleModel) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({
        serializedProperties: ['start_urls', 'start_urls', 'links_to_follow', 'follow_patterns', 'exclude_patterns', 'respect_nofollow', 'init_requests', 'template_names'],
        serializedRelations: ['templates'],
        start_urls: null,
        links_to_follow: 'patterns',
        follow_patterns: null,
        exclude_patterns: null,
        respect_nofollow: true,
        templates: null,
        template_names: null,
        init_requests: null,

        init: function init() {
            if (this.get('init_requests') === null) {
                this.set('init_requests', []);
            }

            this.get('serializedProperties').forEach((function (prop) {
                this.addObserver(prop + '.[]', (function () {
                    this.notifyPropertyChange('dirty');
                }).bind(this));
            }).bind(this));
        },

        performLogin: (function (key, performLogin) {
            if (arguments.length > 1) {
                if (performLogin) {
                    this.get('init_requests').setObjects([{ type: 'login' }]);
                } else {
                    this.set('loginUrl', '');
                    this.set('loginUser', '');
                    this.set('loginPassword', '');
                    this.get('init_requests').setObjects([]);
                }
            }
            return !Ember['default'].isEmpty(this.get('init_requests'));
        }).property('init_requests'),

        loginUrl: (function (key, loginUrl) {
            var reqs = this.get('init_requests');
            if (arguments.length > 1) {
                reqs[0]['loginurl'] = loginUrl;
            }
            return reqs.length ? reqs[0]['loginurl'] : null;
        }).property('init_requests'),

        loginUser: (function (key, loginUser) {
            var reqs = this.get('init_requests');
            if (arguments.length > 1) {
                reqs[0]['username'] = loginUser;
            }
            return reqs.length ? reqs[0]['username'] : null;
        }).property('init_requests'),

        loginPassword: (function (key, loginPassword) {
            var reqs = this.get('init_requests');
            if (arguments.length > 1) {
                reqs[0]['password'] = loginPassword;
            }
            return reqs.length ? reqs[0]['password'] : null;
        }).property('init_requests')
    });

});
define('portia-web/models/template', ['exports', 'portia-web/models/simple-model'], function (exports, SimpleModel) {

    'use strict';

    exports['default'] = SimpleModel['default'].extend({
        serializedProperties: ['page_id', 'default', 'scrapes', 'page_type', 'url', 'annotations', 'extractors', 'name', 'plugins'],
        page_id: '',
        scrapes: 'default',
        page_type: 'item',
        url: '',
        annotated_body: '',
        original_body: '',
        _new: false,
        extractors: null
    });

});
define('portia-web/router', ['exports', 'ember', 'portia-web/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {
    this.resource("projects", function () {
      this.resource("project", {
        path: ":project_id"
      }, function () {
        this.resource("spider", {
          path: ":spider_id"
        }, function () {
          this.resource("template", {
            path: ":template_id"
          }, function () {
            this.resource("template-items", {
              path: "items"
            });
          });
        });
        this.resource("conflicts");
        this.resource("items");
      });
    });
    this.route("base-route");
  });

  exports['default'] = Router;

});
define('portia-web/routes/base-route', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Route.extend({
        activate: function activate() {
            this.set('toolbox.fixed', this.getWithDefault('fixedToolbox', true));
            var controller = this.controller || this.controllerFor(this.getControllerName());
            if (controller.willEnter) {
                controller.willEnter();
            }
            this._super();
        },

        deactivate: function deactivate() {
            var controller = this.controller || this.controllerFor(this.getControllerName());
            if (controller.willLeave) {
                controller.willLeave();
            }
        },

        getControllerName: function getControllerName() {
            return this.getWithDefault('defaultControllerName', this.get('routeName').split('.').get(0));
        }
    });

});
define('portia-web/routes/conflicts', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        model: function model() {
            return this.get('slyd').conflictedFiles(this.get('slyd.project'));
        },

        renderTemplate: function renderTemplate() {
            var controller = this.controllerFor('conflicts');
            this.render('conflicts/toolbox', {
                into: 'application',
                outlet: 'main',
                controller: controller
            });

            this.render('conflicts/topbar', {
                into: 'application',
                outlet: 'topbar',
                controller: controller
            });

            this.render('conflicts/resolver', {
                into: 'application',
                outlet: 'conflictResolver',
                controller: controller
            });
        }
    });

});
define('portia-web/routes/conflicts/index', ['exports', 'portia-web/routes/conflicts'], function (exports, ConflictsRoute) {

	'use strict';

	exports['default'] = ConflictsRoute['default'];

});
define('portia-web/routes/index', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Route.extend({
        activate: function activate() {
            this.transitionTo('projects');
        }
    });

});
define('portia-web/routes/items', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        defaultControllerName: 'items',

        model: function model() {
            return this.get('slyd').loadItems();
        },

        renderTemplate: function renderTemplate() {
            var controller = this.controllerFor(this.get('defaultControllerName'));
            this.render('items/toolbox', {
                into: 'application',
                outlet: 'main',
                controller: controller
            });

            this.render('template/topbar', {
                into: 'application',
                outlet: 'topbar',
                controller: controller
            });
        }
    });

});
define('portia-web/routes/project', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        beforeModel: function beforeModel(s) {
            if (s.params.project.project_id) {
                this.set('slyd.project', s.params.project.project_id);
                return this.get('slyd').editProject(s.params.project.project_id, 'master');
            }
        },

        model: function model() {
            return this.get('slyd').getSpiderNames();
        }
    });

});
define('portia-web/routes/project/index', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        fixedToolbox: false,

        model: function model() {
            return this.get('slyd').getSpiderNames();
        },

        afterModel: function afterModel() {
            if (this.get('capabilities.version_control')) {
                var controller = this.controllerFor('project.index');
                return this.get('slyd').conflictedFiles(this.get('slyd.project')).then((function (conflictedFiles) {
                    if (Object.keys(conflictedFiles).length !== 0) {
                        // If there are conflicted files, redirect the user to
                        // automated concept resolution.
                        this.transitionTo('conflicts');
                    }
                }).bind(this)).then((function () {
                    return this.get('slyd').changedFiles(this.get('slyd.project'));
                }).bind(this)).then(function (changes) {
                    controller.set('changedFiles', changes);
                });
            }
        },

        renderTemplate: function renderTemplate() {
            var controller = this.controllerFor('project.index');
            this.render('project/toolbox', {
                into: 'application',
                outlet: 'main',
                controller: controller
            });

            this.render('project/topbar', {
                into: 'application',
                outlet: 'topbar',
                controller: controller
            });
        },

        serialize: function serialize() {
            var controller = this.controllerFor('project.index');
            return { project_id: controller.get('name') };
        }
    });

});
define('portia-web/routes/projects', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        model: function model() {
            return this.get('slyd').getProjectNames();
        },

        afterModel: function afterModel() {
            this.modelFor('projects').forEach((function (project) {
                if (project instanceof Object) {
                    this.set('project_models.projects.' + project.id, project.name);
                } else {
                    this.set('project_models.projects.' + project, project);
                }
            }).bind(this));
        },

        renderTemplate: function renderTemplate() {
            var controller = this.controllerFor('projects');
            this.render('projects/toolbox', {
                into: 'application',
                outlet: 'main',
                controller: controller
            });

            this.render('projects/topbar', {
                into: 'application',
                outlet: 'topbar',
                controller: controller
            });
        }
    });

});
define('portia-web/routes/projects/index', ['exports', 'portia-web/routes/projects'], function (exports, ProjectRoute) {

	'use strict';

	exports['default'] = ProjectRoute['default'];

});
define('portia-web/routes/spider', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        fixedToolbox: false,

        model: function model(params) {
            return this.get('slyd').loadSpider(params.spider_id);
        },

        afterModel: function afterModel() {
            // Load the items.
            var controller = this.controllerFor('spider.index');
            return this.get('slyd').loadItems().then(function (items) {
                controller.set('itemDefinitions', items);
            });
        },

        renderTemplate: function renderTemplate() {
            var controller = this.controllerFor('spider.index');
            this.render('spider/toolbox', {
                into: 'application',
                outlet: 'main',
                controller: controller
            });

            this.render('spider/topbar', {
                into: 'application',
                outlet: 'topbar',
                controller: controller
            });
        }
    });

});
define('portia-web/routes/spider/index', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        fixedToolbox: false,

        model: function model() {
            return this.modelFor('spider');
        }
    });

});
define('portia-web/routes/template-items', ['exports', 'portia-web/routes/items'], function (exports, Items) {

    'use strict';

    exports['default'] = Items['default'].extend({
        defaultControllerName: 'template-items'
    });

});
define('portia-web/routes/template', ['exports', 'ember', 'portia-web/routes/base-route'], function (exports, Ember, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({

        model: function model(params) {
            var spider = this.modelFor('spider');
            return this.get('slyd').loadTemplate(spider.get('name'), params.template_id);
        },

        afterModel: function afterModel() {
            var controller = this.controllerFor('template');
            var slyd = this.get('slyd');
            // Load the annotations if we can.
            if (!controller.get('documentView').getIframe().length) {
                return Ember['default'].run.later(this, this.refresh, 500);
            }

            // Load the items.
            var itemsPromise = slyd.loadItems().then(function (items) {
                controller.set('project_models.items', items);
            });
            // Load the extractors.
            var extractorsPromise = slyd.loadExtractors().then(function (extractors) {
                controller.set('project_models.extractors', extractors);
            });
            return Ember['default'].RSVP.all([itemsPromise, extractorsPromise]);
        },

        renderTemplate: function renderTemplate() {
            var controller = this.controllerFor('template.index');
            this.render('template/toolbox', {
                into: 'application',
                outlet: 'main',
                controller: controller
            });
            this.render('template/topbar', {
                into: 'application',
                outlet: 'topbar',
                controller: controller
            });
        }
    });

});
define('portia-web/routes/template/index', ['exports', 'portia-web/routes/base-route'], function (exports, BaseRoute) {

    'use strict';

    exports['default'] = BaseRoute['default'].extend({
        fixedToolbox: false,

        model: function model() {
            return this.modelFor('template');
        }
    });

});
define('portia-web/templates/annotated-document-view', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","scraped-doc");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("iframe");
        dom.setAttribute(el2,"id","scraped-doc-iframe");
        dom.setAttribute(el2,"src","start.html");
        dom.setAttribute(el2,"class","adjust-height");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("canvas");
        dom.setAttribute(el2,"id","infocanvas");
        dom.setAttribute(el2,"class","doc-canvas adjust-height");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"id","loader-container");
        dom.setAttribute(el2,"class","adjust-height");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","position:absolute;z-index:20;width:100%;pointer-events:none");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"id","hovered-element-info");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "outlet", ["topbar"], {});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "outlet", ["main"], {});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,1,1,contextualElement);
        var morph2 = dom.createMorphAt(fragment,3,3,contextualElement);
        var morph3 = dom.createMorphAt(fragment,5,5,contextualElement);
        var morph4 = dom.createMorphAt(fragment,7,7,contextualElement);
        var morph5 = dom.createMorphAt(fragment,8,8,contextualElement);
        var morph6 = dom.createMorphAt(fragment,10,10,contextualElement);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "top-bar", [], {"branding": get(env, context, "customizations.branding"), "project": get(env, context, "slyd.project")}, child0, null);
        inline(env, morph1, context, "outlet", ["conflictResolver"], {});
        inline(env, morph2, context, "outlet", ["modal"], {});
        content(env, morph3, context, "web-document");
        block(env, morph4, context, "tool-box", [], {}, child1, null);
        content(env, morph5, context, "bs-notifications");
        inline(env, morph6, context, "component", [get(env, context, "customizations.help.component")], {"data": get(env, context, "customizations.help.data")});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/base-route', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/accordion-item', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"data-header","true");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        dom.setAttribute(el2,"style","cursor: pointer;");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","section");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, element = hooks.element, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(fragment, [2]);
        var morph0 = dom.createMorphAt(element2,1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element3, [1]),0,0);
        element(env, element0, context, "bind-attr", [], {"class": get(env, context, "panelHeaderClasses")});
        element(env, element1, context, "bind-attr", [], {"class": get(env, context, "panelTitleClasses")});
        element(env, element2, context, "bind-attr", [], {"class": get(env, context, "panelTogglerClasses")});
        content(env, morph0, context, "view.title");
        element(env, element3, context, "bind-attr", [], {"class": get(env, context, "panelBodyContainerClasses")});
        content(env, morph1, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bread-crumbs', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, content = hooks.content;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
                content(env, morph0, context, "crumb.label");
                return fragment;
              }
            };
          }());
          var child1 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("i");
                dom.setAttribute(el1,"class","fa fa-icon fa-home");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, null);
              dom.insertBoundary(fragment, 0);
              block(env, morph0, context, "if", [get(env, context, "index")], {}, child0, child1);
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "link-to", [get(env, context, "crumb.path")], {}, child0, null);
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
              content(env, morph0, context, "crumb.label");
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("i");
              dom.setAttribute(el1,"class","fa fa-icon fa-home");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "index")], {}, child0, child1);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 2,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement, blockArguments) {
          var dom = env.dom;
          var hooks = env.hooks, set = hooks.set, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var attrMorph0 = dom.createAttrMorph(element0, 'class');
          set(env, context, "crumb", blockArguments[0]);
          set(env, context, "index", blockArguments[1]);
          attribute(env, attrMorph0, element0, "class", concat(env, ["crumbs ", subexpr(env, context, "if", [get(env, context, "crumb.isCurrent"), "current-crumb", "inactive-crumb"], {})]));
          block(env, morph0, context, "if", [get(env, context, "crumb.linkable")], {}, child0, child1);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("ul");
        dom.setAttribute(el1,"class","breadcrumb");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        block(env, morph0, context, "each", [get(env, context, "breadCrumbs")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bs-badge', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "content");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bs-button', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [0]);
          var attrMorph0 = dom.createAttrMorph(element0, 'class');
          attribute(env, attrMorph0, element0, "class", get(env, context, "activeIcon"));
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,1,1,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "activeIcon")], {}, child0, null);
        content(env, morph1, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bs-dropdown', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            inline(env, morph0, context, "component", [get(env, context, "_action.component")], {"clicked": "close", "actionData": get(env, context, "_action")});
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("a");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute, element = hooks.element, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element1 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element1,0,0);
              var attrMorph0 = dom.createAttrMorph(element1, 'title');
              attribute(env, attrMorph0, element1, "title", concat(env, [get(env, context, "_action.title")]));
              element(env, element1, context, "action", ["openModal", get(env, context, "_action")], {});
              content(env, morph0, context, "_action.text");
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("a");
              dom.setAttribute(el1,"target","_blank");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n        ");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute, element = hooks.element, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element0 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element0,0,0);
              var attrMorph0 = dom.createAttrMorph(element0, 'href');
              var attrMorph1 = dom.createAttrMorph(element0, 'title');
              attribute(env, attrMorph0, element0, "href", concat(env, [get(env, context, "_action.url")]));
              attribute(env, attrMorph1, element0, "title", concat(env, [get(env, context, "_action.title")]));
              element(env, element0, context, "action", ["close"], {"on": "mouseUp"});
              content(env, morph0, context, "_action.text");
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "_action.modal")], {}, child0, child1);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 1,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement, blockArguments) {
          var dom = env.dom;
          var hooks = env.hooks, set = hooks.set, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          set(env, context, "_action", blockArguments[0]);
          block(env, morph0, context, "if", [get(env, context, "_action.component")], {}, child0, child1);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("button");
        dom.setAttribute(el1,"type","button");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("i");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("ul");
        dom.setAttribute(el1,"class","dropdown-menu pull-right");
        dom.setAttribute(el1,"role","menu");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("li");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute, element = hooks.element, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element2 = dom.childAt(fragment, [0]);
        var element3 = dom.childAt(element2, [1]);
        var attrMorph0 = dom.createAttrMorph(element2, 'class');
        var attrMorph1 = dom.createAttrMorph(element3, 'class');
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [2, 1]),1,1);
        attribute(env, attrMorph0, element2, "class", concat(env, ["btn btn-default btn-xs dropdown-toggle ", get(env, context, "toggle")]));
        element(env, element2, context, "action", ["clicked"], {});
        attribute(env, attrMorph1, element3, "class", concat(env, [get(env, context, "iconClasses")]));
        block(env, morph0, context, "each", [get(env, context, "actions")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bs-label', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "content");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bs-modal', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("i");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          element(env, element1, context, "bind-attr", [], {"class": "titleIconClasses"});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "component", [get(env, context, "component")], {"data": get(env, context, "componentData")});
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createUnsafeMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "body");
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                        ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
              content(env, morph0, context, "btn.label");
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "bs-button", [], {"clicked": get(env, context, "btn.clicked"), "type": get(env, context, "btn.type"), "size": get(env, context, "btn.size"), "targetObject": get(env, context, "targetObject")}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("            ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          element(env, element0, context, "bind-attr", [], {"class": ":modal-footer fullSizeButtons:modal-footer-full"});
          block(env, morph0, context, "each", [get(env, context, "footerButtons")], {"keyword": "btn"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","modal-dialog");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","modal-content");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","modal-header");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("button");
        dom.setAttribute(el4,"type","button");
        dom.setAttribute(el4,"data-dismiss","modal");
        dom.setAttribute(el4,"aria-hidden","true");
        var el5 = dom.createTextNode("×");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("h4");
        dom.setAttribute(el4,"class","modal-title");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("                ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n            ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","modal-body");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element2 = dom.childAt(fragment, [0, 1]);
        var element3 = dom.childAt(element2, [1]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element3, [3]);
        var morph0 = dom.createMorphAt(element5,1,1);
        var morph1 = dom.createUnsafeMorphAt(element5,3,3);
        var morph2 = dom.createMorphAt(dom.childAt(element2, [3]),1,1);
        var morph3 = dom.createMorphAt(element2,5,5);
        element(env, element4, context, "bind-attr", [], {"class": ":close allowClose::hide"});
        block(env, morph0, context, "if", [get(env, context, "titleIconClasses")], {}, child0, null);
        content(env, morph1, context, "title");
        block(env, morph2, context, "if", [get(env, context, "component")], {}, child1, child2);
        block(env, morph3, context, "if", [get(env, context, "footerButtons")], {}, child3, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/bs-notification', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
          content(env, morph0, context, "view.content.title");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("button");
        dom.setAttribute(el1,"type","button");
        dom.setAttribute(el1,"class","close");
        dom.setAttribute(el1,"aria-label","Close");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"aria-hidden","true");
        var el3 = dom.createTextNode("×");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [3]),0,0);
        element(env, element0, context, "action", ["close"], {"target": "view"});
        block(env, morph0, context, "if", [get(env, context, "view.content.title")], {}, child0, null);
        content(env, morph1, context, "view.content.message");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/closable-accordion', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/collapsible-text', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            dom.setAttribute(el1,"class","blue-label collapse-button");
            var el2 = dom.createTextNode(" [+] ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            dom.setAttribute(el1,"class","blue-label collapse-button");
            var el2 = dom.createTextNode(" [-] ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "collapsed")], {}, child0, child1);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "displayedText");
        block(env, morph1, context, "if", [get(env, context, "collapsible")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/display-button-delete', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "yield");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-10");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-1 button-align-med");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, block = hooks.block, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        block(env, morph0, context, "bs-button", [], {"clicked": "default", "class": "pattern", "type": "light", "size": "sm", "draggable": true}, child0, null);
        inline(env, morph1, context, "bs-button", [], {"clicked": "delete", "clickedParam": get(env, context, "name"), "icon": "fa fa-icon fa-trash", "type": "danger", "size": "xs"});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/display-button-edit-delete', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n             ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1,"class","fa fa-icon");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "text");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "bs-button", [], {"class": "pattern", "type": "light", "size": "sm"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-10");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-1 button-align-med");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        block(env, morph0, context, "inline-editable-text-field", [], {"text": get(env, context, "text"), "action": "saveText", "name": get(env, context, "name"), "hideIcon": true}, child0, null);
        inline(env, morph1, context, "bs-button", [], {"clicked": "deleteText", "clickedParam": get(env, context, "name"), "icon": "fa fa-icon fa-trash", "type": "danger", "size": "xs"});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/edit-item', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                Item: ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "item.name");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                                    ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("span");
              dom.setAttribute(el1,"class","editable-name");
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
              content(env, morph0, context, "field.name");
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 2,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("                    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","row");
            dom.setAttribute(el1,"style","margin:0");
            var el2 = dom.createTextNode("\n                        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-4 top-div");
            var el3 = dom.createTextNode("\n                            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("div");
            dom.setAttribute(el3,"class","field-name");
            var el4 = dom.createTextNode("\n");
            dom.appendChild(el3, el4);
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            var el4 = dom.createTextNode("                            ");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n                        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-4");
            var el3 = dom.createTextNode("\n                            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n                        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-1");
            dom.setAttribute(el2,"style","text-align:center;");
            var el3 = dom.createTextNode("\n                            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n                        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-1");
            dom.setAttribute(el2,"style","text-align:center;");
            var el3 = dom.createTextNode("\n                            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n                        ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-1");
            var el3 = dom.createTextNode("\n                            ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                        ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n                    ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement, blockArguments) {
            var dom = env.dom;
            var hooks = env.hooks, set = hooks.set, get = hooks.get, block = hooks.block, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element0 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(dom.childAt(element0, [1, 1]),1,1);
            var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
            var morph2 = dom.createMorphAt(dom.childAt(element0, [5]),1,1);
            var morph3 = dom.createMorphAt(dom.childAt(element0, [7]),1,1);
            var morph4 = dom.createMorphAt(dom.childAt(element0, [9]),1,1);
            set(env, context, "field", blockArguments[0]);
            set(env, context, "index", blockArguments[1]);
            block(env, morph0, context, "inline-editable-text-field", [], {"action": "editField", "text": get(env, context, "field.name"), "name": get(env, context, "index"), "validation": "^[a-zA-Z0-9_-]+$"}, child0, null);
            inline(env, morph1, context, "item-select", [], {"options": get(env, context, "extractionTypes"), "value": get(env, context, "field.type")});
            inline(env, morph2, context, "check-box", [], {"checked": get(env, context, "field.required")});
            inline(env, morph3, context, "check-box", [], {"checked": get(env, context, "field.vary")});
            inline(env, morph4, context, "bs-button", [], {"size": "xs", "icon": "fa fa-icon fa-trash", "type": "danger", "clicked": "deleteField", "clickedParam": get(env, context, "field")});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row small-label");
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-4");
          var el3 = dom.createTextNode("Field");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-3");
          var el3 = dom.createTextNode("Type");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-5");
          var el3 = dom.createTextNode("Required Vary");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n                ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row");
          dom.setAttribute(el1,"style","color: #CCC;margin:0");
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-4");
          var el3 = dom.createTextNode("url");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-4");
          var el3 = dom.createTextNode("url");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-1");
          var el3 = dom.createElement("input");
          dom.setAttribute(el3,"type","checkbox");
          dom.setAttribute(el3,"checked","true");
          dom.setAttribute(el3,"disabled","true");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-1");
          var el3 = dom.createElement("input");
          dom.setAttribute(el3,"type","checkbox");
          dom.setAttribute(el3,"checked","true");
          dom.setAttribute(el3,"disabled","true");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-1");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n                ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          if (this.cachedFragment) { dom.repairClonedNode(dom.childAt(fragment, [3, 5, 0]),[],true); }
          if (this.cachedFragment) { dom.repairClonedNode(dom.childAt(fragment, [3, 7, 0]),[],true); }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [3, 9]),0,0);
          var morph1 = dom.createMorphAt(fragment,5,5,contextualElement);
          dom.insertBoundary(fragment, null);
          inline(env, morph0, context, "bs-button", [], {"icon": "fa fa-icon fa-trash", "type": "danger", "disabled": true, "size": "xs"});
          block(env, morph1, context, "each", [get(env, context, "item.fields")], {}, child0, null);
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          var el2 = dom.createTextNode("No fields defined yet.");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("                Field\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","editable-item-container");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"style","margin:2px 0px 0px 10px");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"style","float:right");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","margin-top:20px");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"style","text-align:center;margin-top:10px");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element1 = dom.childAt(fragment, [0]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(element1, [3]);
        var morph0 = dom.createMorphAt(dom.childAt(element2, [1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element2, [3]),1,1);
        var morph2 = dom.createMorphAt(element3,1,1);
        var morph3 = dom.createMorphAt(dom.childAt(element3, [3]),1,1);
        block(env, morph0, context, "inline-editable-text-field", [], {"text": get(env, context, "item.name"), "validation": "^[a-zA-Z0-9_-]+$"}, child0, null);
        inline(env, morph1, context, "bs-button", [], {"clicked": "delete", "icon": "fa fa-icon fa-trash", "type": "danger", "size": "xs"});
        block(env, morph2, context, "if", [get(env, context, "item.fields")], {}, child1, child2);
        block(env, morph3, context, "bs-button", [], {"clicked": "addField", "icon": "fa fa-icon fa-plus", "type": "primary", "size": "sm"}, child3, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/em-accordion-item', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("panel-heading");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("panel-title");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("accordion-toggle");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("panel-collapse collapse");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("panel-body");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        dom.setAttribute(el2,"style","cursor: pointer;");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("a");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, element = hooks.element, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [10]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(element1, [1]);
        var element3 = dom.childAt(fragment, [12]);
        var element4 = dom.childAt(element3, [1]);
        var morph0 = dom.createMorphAt(element2,1,1);
        var morph1 = dom.createMorphAt(element4,0,0);
        element(env, element0, context, "bind-attr", [], {"class": get(env, context, "panelHeaderClasses")});
        element(env, element1, context, "bind-attr", [], {"class": get(env, context, "panelTitleClasses")});
        element(env, element2, context, "bind-attr", [], {"class": get(env, context, "panelTogglerClasses")});
        content(env, morph0, context, "view.title");
        element(env, element3, context, "bind-attr", [], {"class": get(env, context, "panelBodyContainerClasses")});
        element(env, element4, context, "bind-attr", [], {"class": get(env, context, "panelBodyClasses")});
        content(env, morph1, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/extracted-item', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            dom.setAttribute(el1,"style","color:white;word-wrap:break-word;");
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            inline(env, morph0, context, "collapsible-text", [], {"fullText": get(env, context, "value")});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"style","margin-bottom:2px");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","small-label blue-label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(":");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element3 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element3, [1]),0,0);
          var morph1 = dom.createMorphAt(element3,3,3);
          content(env, morph0, context, "textField.name");
          block(env, morph1, context, "each", [get(env, context, "textField.value")], {"keyword": "value"}, child0, null);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            dom.setAttribute(el1,"style","color:white;word-wrap:break-word;");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"style","margin:10px;text-align:center");
            var el2 = dom.createTextNode("\n                ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("img");
            dom.setAttribute(el2,"width","200px");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element1 = dom.childAt(fragment, [3, 1]);
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
            var attrMorph0 = dom.createAttrMorph(element1, 'src');
            content(env, morph0, context, "value");
            attribute(env, attrMorph0, element1, "src", concat(env, [get(env, context, "value")]));
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"style","margin-bottom:2px");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("span");
          dom.setAttribute(el2,"class","small-label blue-label");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(":");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element2 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element2, [1]),0,0);
          var morph1 = dom.createMorphAt(element2,3,3);
          content(env, morph0, context, "imageField.name");
          block(env, morph1, context, "each", [get(env, context, "imageField.value")], {"keyword": "value"}, child0, null);
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("span");
                dom.setAttribute(el1,"style","color:white;word-wrap:break-word;");
                var el2 = dom.createTextNode("\n                            ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                        ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
                inline(env, morph0, context, "collapsible-text", [], {"fullText": get(env, context, "value")});
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-bottom:2px");
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("span");
              dom.setAttribute(el2,"class","small-label green-label");
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode(":");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element0 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
              var morph1 = dom.createMorphAt(element0,3,3);
              content(env, morph0, context, "field.name");
              block(env, morph1, context, "each", [get(env, context, "field.value")], {"keyword": "value"}, child0, null);
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"style","margin-bottom:3px");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            block(env, morph0, context, "each", [get(env, context, "variant.fields")], {"keyword": "field"}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h3");
          dom.setAttribute(el1,"class","important-label");
          dom.setAttribute(el1,"style","margin:3px 0px 2px 0px");
          var el2 = dom.createTextNode("Variants");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
          dom.insertBoundary(fragment, null);
          block(env, morph0, context, "each", [get(env, context, "variants")], {"keyword": "variant"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","text-align:left;margin-bottom:5px;");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","margin-bottom:2px");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","small-label yellow-label");
        var el4 = dom.createTextNode("URL:");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","link");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","small-label yellow-label");
        var el4 = dom.createTextNode("Matched template:");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("span");
        dom.setAttribute(el3,"class","link");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, element = hooks.element, inline = hooks.inline, content = hooks.content, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element4 = dom.childAt(fragment, [0]);
        var element5 = dom.childAt(element4, [1, 3]);
        var element6 = dom.childAt(element4, [3, 3]);
        var morph0 = dom.createMorphAt(element5,1,1);
        var morph1 = dom.createMorphAt(element6,1,1);
        var morph2 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph3 = dom.createMorphAt(fragment,3,3,contextualElement);
        var morph4 = dom.createMorphAt(fragment,4,4,contextualElement);
        dom.insertBoundary(fragment, null);
        element(env, element5, context, "action", ["fetchPage", get(env, context, "url")], {});
        inline(env, morph0, context, "trim", [get(env, context, "url"), 45], {});
        element(env, element6, context, "action", ["editTemplate", get(env, context, "matchedTemplate")], {});
        content(env, morph1, context, "matchedTemplate");
        block(env, morph2, context, "each", [get(env, context, "textFields")], {"keyword": "textField"}, child0, null);
        block(env, morph3, context, "each", [get(env, context, "imageFields")], {"keyword": "imageField"}, child1, null);
        block(env, morph4, context, "if", [get(env, context, "variants")], {}, child2, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/extractor-dropzone', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/inline-editable-text-field', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "text-field", [], {"value": get(env, context, "text"), "width": "100%", "saveOnExit": true, "action": "update"});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("i");
            dom.setAttribute(el1,"class","fa fa-icon");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          dom.setAttribute(el1,"class","editable-name");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var morph1 = dom.createMorphAt(element0,3,3);
          content(env, morph0, context, "yield");
          block(env, morph1, context, "unless", [get(env, context, "hideIcon")], {}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "editing")], {}, child0, child1);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/item-select', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("option");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, concat = hooks.concat, attribute = hooks.attribute, subexpr = hooks.subexpr, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var attrMorph0 = dom.createAttrMorph(element0, 'value');
          var attrMorph1 = dom.createAttrMorph(element0, 'selected');
          attribute(env, attrMorph0, element0, "value", concat(env, [get(env, context, "option.value")]));
          attribute(env, attrMorph1, element0, "selected", concat(env, [subexpr(env, context, "if", [get(env, context, "option.selected"), "selected", ""], {})]));
          content(env, morph0, context, "option.label");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "each", [get(env, context, "optionsList")], {"keyword": "option"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/j-breadcrumb', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("a");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        content(env, morph0, context, "label");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/j-breadcrumbs', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 2,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("span");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement, blockArguments) {
          var dom = env.dom;
          var hooks = env.hooks, set = hooks.set, get = hooks.get, inline = hooks.inline, concat = hooks.concat, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [3]);
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          var attrMorph0 = dom.createAttrMorph(element0, 'class');
          set(env, context, "bc", blockArguments[0]);
          set(env, context, "index", blockArguments[1]);
          inline(env, morph0, context, "j-breadcrumb", [], {"hovered": "hovered", "clicked": "clicked", "info": get(env, context, "bc"), "index": get(env, context, "index")});
          attribute(env, attrMorph0, element0, "class", concat(env, ["fa fa-icon fa-", get(env, context, "bc.separator")]));
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "each", [get(env, context, "breadcrumbs")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/json-file-compare', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("span");
              dom.setAttribute(el1,"style","color:#2d882d;font-weight:bold");
              var el2 = dom.createTextNode("RESOLVED");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin:5px 0px 0px 40px;background:#AEA;");
              dom.setAttribute(el1,"class","conflict-option");
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("span");
              dom.setAttribute(el2,"style","font-weight:bold;color:#2d882d;margin:5px");
              var el3 = dom.createTextNode(" [CHANGE SELECTION] ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode(",\n            ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, element = hooks.element, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element2 = dom.childAt(fragment, [3]);
              var morph0 = dom.createMorphAt(element2,3,3);
              element(env, element2, context, "action", ["conflictOptionSelected", get(env, context, "path"), get(env, context, "null")], {});
              content(env, morph0, context, "resolvedValue");
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                    ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","conflict-option");
                var el2 = dom.createTextNode("\n                        ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"style","color:#F3F3F3;font-weight:bold");
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode(":");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                        ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("div");
                dom.setAttribute(el2,"style","word-break:break-word");
                var el3 = dom.createTextNode("\n                            ");
                dom.appendChild(el2, el3);
                var el3 = dom.createComment("");
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("\n                        ");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                    ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, get = hooks.get, element = hooks.element, content = hooks.content;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var element1 = dom.childAt(fragment, [1]);
                var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),0,0);
                var morph1 = dom.createMorphAt(dom.childAt(element1, [3]),1,1);
                element(env, element1, context, "action", ["conflictOptionSelected", get(env, context, "path"), get(env, context, "value.key")], {});
                content(env, morph0, context, "value.label");
                content(env, morph1, context, "value.value");
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("span");
              dom.setAttribute(el1,"style","color:#ff3939;font-weight:bold");
              var el2 = dom.createTextNode("CONFLICT");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-left:40px;");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("            ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(dom.childAt(fragment, [3]),1,1);
              block(env, morph0, context, "each", [get(env, context, "conflictValues")], {"keyword": "value"}, child0, null);
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "resolved")], {}, child0, child1);
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin:5px 5px 0px 20px;");
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("span");
              dom.setAttribute(el2,"style","font-weight:bold");
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode(":");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element0 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
              var morph1 = dom.createMorphAt(element0,2,2);
              content(env, morph0, context, "entry.key");
              inline(env, morph1, context, "json-file-compare", [], {"json": get(env, context, "entry.json"), "path": get(env, context, "entry.path"), "conflictedKeyPaths": get(env, context, "conflictedKeyPaths"), "conflictOptionSelected": "conflictOptionSelected"});
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            block(env, morph0, context, "each", [get(env, context, "entries")], {"keyword": "entry"}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "isConflict")], {}, child0, child1);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode(",\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "value");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "isObject")], {}, child0, child1);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/label-with-tooltip', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/pin-toolbox-button', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("i");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, element = hooks.element;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [0]);
          element(env, element0, context, "bind-attr", [], {"class": "icon"});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        var morph1 = dom.createMorphAt(fragment,1,1,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        block(env, morph0, context, "if", [get(env, context, "icon")], {}, child0, null);
        content(env, morph1, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/portia-branding', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("span");
        dom.setAttribute(el1,"class","pull-right label-align");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        inline(env, morph0, context, "bs-label", [], {"type": "danger", "content": "Beta"});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/text-area-with-button', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        Add urls\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","margin-top:5px;text-align:center");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        inline(env, morph0, context, "text-area", [], {"width": "93%", "splitlines": true, "clear": get(env, context, "clear"), "placeholder": get(env, context, "placeholder"), "action": "sendText", "update": "updateText", "resize": "vertical", "max_height": "300px", "value": get(env, context, "value"), "submitOnEnter": false});
        block(env, morph1, context, "bs-button", [], {"clicked": "sendText", "icon": "fa fa-icon fa-plus", "disabled": get(env, context, "disabled"), "type": "primary"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/text-field-dropdown-button', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        New extractor\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","float:left;width:53%;");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","small-label");
        dom.setAttribute(el2,"style","margin:5px 0px 5px 0px");
        var el3 = dom.createTextNode("- or choose a type -");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","typeBox");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","float:left;width:40%;margin-top: 23px");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(element0,1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [5]),0,0);
        var morph2 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        inline(env, morph0, context, "text-field", [], {"width": "160px", "placeholder": get(env, context, "placeholder"), "action": "save", "update": "updateText"});
        inline(env, morph1, context, "item-select", [], {"value": get(env, context, "default"), "options": get(env, context, "options"), "width": "160px", "changed": "updateOption"});
        block(env, morph2, context, "bs-button", [], {"clicked": "save", "icon": "fa fa-icon fa-plus", "type": "primary", "size": "sm"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/text-field-with-button', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-10");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-2 button-align-sm");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        inline(env, morph0, context, "text-field", [], {"clear": get(env, context, "clear"), "width": "110%", "placeholder": get(env, context, "placeholder"), "action": "sendText", "update": "updateText"});
        inline(env, morph1, context, "bs-button", [], {"clicked": "sendText", "icon": "fa fa-icon fa-plus", "disabled": get(env, context, "disabled"), "type": "primary", "size": "xs"});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/tool-box', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","toolbox");
        dom.setAttribute(el1,"class","adjust-height");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","position:absolute;height:100%;z-index:10");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","container");
        dom.setAttribute(el3,"style","height:100%;width:400px;");
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4,"class","bar");
        var el5 = dom.createTextNode("\n                ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("div");
        dom.setAttribute(el5,"style","position:absolute;left:8px;top:45%");
        var el6 = dom.createTextNode("\n                    ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("div");
        dom.setAttribute(el6,"class","arrow-left");
        var el7 = dom.createTextNode("\n                    ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n                ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n            ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("span");
        dom.setAttribute(el4,"style","float:left;margin:0px 5px 0px -35px");
        var el5 = dom.createTextNode("\n                ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n            ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4,"style","padding-top:10px;margin-left:40px;padding-right:2px");
        var el5 = dom.createTextNode("\n                ");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n            ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0, 1, 1]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [5]),1,1);
        inline(env, morph0, context, "pin-toolbox-button", [], {"toolbox": get(env, context, "this.control"), "type": "clear", "icon": "fa fa-icon fa-thumb-tack unpinned"});
        content(env, morph1, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/top-bar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","topbar");
        dom.setAttribute(el1,"class","navbar navbar-default");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","nav-container");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
        var morph1 = dom.createMorphAt(element0,3,3);
        var morph2 = dom.createMorphAt(element0,5,5);
        content(env, morph0, context, "bread-crumbs");
        content(env, morph1, context, "yield");
        inline(env, morph2, context, "component", [get(env, context, "branding.component")], {"project": get(env, context, "project"), "data": get(env, context, "branding.data")});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/web-document', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"id","scraped-doc");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("iframe");
        dom.setAttribute(el2,"id","scraped-doc-iframe");
        dom.setAttribute(el2,"src","/static/start.html");
        dom.setAttribute(el2,"class","adjust-height");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("canvas");
        dom.setAttribute(el2,"id","infocanvas");
        dom.setAttribute(el2,"class","doc-canvas adjust-height");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"id","loader-container");
        dom.setAttribute(el2,"class","adjust-height");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","position:absolute;z-index:20;width:100%;pointer-events:none");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"id","hovered-element-info");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/wizard-box', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "yield");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-xs-8");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-xs-2");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
        inline(env, morph0, context, "text-field", [], {"width": "105%", "placeholder": get(env, context, "placeholder"), "action": "add", "update": "update", "clear": true, "value": get(env, context, "defaultValue")});
        block(env, morph1, context, "bs-button", [], {"type": "info", "size": "sm", "clicked": "add", "icon": "fa fa-icon fa-plus", "disabled": get(env, context, "noText")}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/components/zero-clipboard', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("button");
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, element = hooks.element, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(element0,0,0);
        element(env, element0, context, "bind-attr", [], {"class": get(env, context, "innerClass")});
        content(env, morph0, context, "label");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/conflicts', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/conflicts/resolver', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","position:relative;margin-right:400px;");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","width:100%;position:absolute;top:30px;z-index:1;font:12px 'Courier';overflow-y:auto");
        dom.setAttribute(el2,"class","adjust-height conflicted-file");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"style","padding:10px");
        var el4 = dom.createTextNode("\n			");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n		");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0, 1, 1]),1,1);
        inline(env, morph0, context, "json-file-compare", [], {"json": get(env, context, "controller.currentFileContents"), "conflictedKeyPaths": get(env, context, "controller.conflictedKeyPaths"), "conflictOptionSelected": "conflictOptionSelected"});
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/conflicts/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("					");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "name");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"style","margin:4px 0px 4px 0px");
          dom.setAttribute(el1,"class","pattern");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("			");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          block(env, morph0, context, "bs-button", [], {"clicked": "displayConflictedFile", "clickedParam": get(env, context, "name"), "type": "light"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","margin:10px 0px 0px 10px");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        var el3 = dom.createTextNode("Conflicted files");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0, 3]),1,1);
        block(env, morph0, context, "each", [get(env, context, "conflictedFileNames")], {"keyword": "name"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/conflicts/topbar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		Save File\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","float:left;margin-top:2px");
        dom.setAttribute(el1,"class","nav-container");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"style","margin-right:10px");
        var el3 = dom.createTextNode("Resolving ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("b");
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1, 1]),0,0);
        var morph1 = dom.createMorphAt(element0,3,3);
        content(env, morph0, context, "controller.currentFileName");
        block(env, morph1, context, "bs-button", [], {"clicked": "saveFile", "clickedParam": get(env, context, "controller.currentFileName"), "icon": "fa fa-icon fa-upload", "type": "primary", "disabled": get(env, context, "controller.saveDisabled"), "size": "sm"}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/empty/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","text-align:center;margin:10px 0px 10px 0px;");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h3");
        dom.setAttribute(el2,"style","color:#555; font-size: 1.2em");
        var el3 = dom.createTextNode("Portia Developer Preview");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/empty/topbar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, null);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/items/item', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("yes");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("no");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        var child2 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("yes");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        var child3 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("no");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("					");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("tr");
            var el2 = dom.createTextNode("\n						");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createElement("h5");
            dom.setAttribute(el3,"style","color:#666");
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n						");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createElement("h5");
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n						");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createElement("h5");
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n						");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            var el3 = dom.createElement("h5");
            var el4 = dom.createComment("");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n						");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("td");
            dom.setAttribute(el2,"style","padding-bottom:4px;");
            var el3 = dom.createTextNode("\n							");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n						");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n					");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element0 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(dom.childAt(element0, [1, 0]),0,0);
            var morph1 = dom.createMorphAt(dom.childAt(element0, [3, 0]),0,0);
            var morph2 = dom.createMorphAt(dom.childAt(element0, [5, 0]),0,0);
            var morph3 = dom.createMorphAt(dom.childAt(element0, [7, 0]),0,0);
            var morph4 = dom.createMorphAt(dom.childAt(element0, [9]),1,1);
            content(env, morph0, context, "field.name");
            content(env, morph1, context, "field.type");
            block(env, morph2, context, "if", [get(env, context, "field.required")], {}, child0, child1);
            block(env, morph3, context, "if", [get(env, context, "field.vary")], {}, child2, child3);
            inline(env, morph4, context, "bs-button", [], {"icon": "fa fa-icon fa-check-circle", "clicked": "fieldSelected", "clickedParam": get(env, context, "name"), "type": "primary", "size": "xs"});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("table");
          dom.setAttribute(el1,"style","margin:0 auto;");
          var el2 = dom.createTextNode("\n				");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("tr");
          dom.setAttribute(el2,"class","small-label");
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("td");
          var el4 = dom.createTextNode("Field");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("td");
          var el4 = dom.createTextNode("Type");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("td");
          var el4 = dom.createTextNode("Required");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("td");
          var el4 = dom.createTextNode("Vary");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode(" ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("			");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),3,3);
          block(env, morph0, context, "each", [get(env, context, "fields")], {"keyword": "field"}, child0, null);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          var el2 = dom.createTextNode("The item has no fields.");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h5");
        dom.setAttribute(el2,"style","text-align:center;");
        var el3 = dom.createTextNode("Choose an item field");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","text-align:center; margin-top:10px");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Item ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element1 = dom.childAt(fragment, [0, 3]);
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        var morph1 = dom.createMorphAt(element1,3,3);
        content(env, morph0, context, "name");
        block(env, morph1, context, "if", [get(env, context, "fields")], {}, child0, child1);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/items/items', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/items/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("				");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "edit-item", [], {"item": get(env, context, "item"), "extractionTypes": get(env, context, "extractionTypes"), "addField": "addField", "deleteField": "deleteField", "delete": "deleteItem"});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		 		");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createTextNode("No items have been defined yet.");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("				Item\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("				Save changes\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child4 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("				Discard Changes\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","margin:10px 0px 0px 10px");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        var el3 = dom.createTextNode("Items");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","scrolling-container");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("		");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","button-spacer");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("		");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0, 3]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(element0, [3]);
        var morph0 = dom.createMorphAt(element1,1,1);
        var morph1 = dom.createMorphAt(element2,1,1);
        var morph2 = dom.createMorphAt(element2,2,2);
        var morph3 = dom.createMorphAt(element2,3,3);
        element(env, element1, context, "bind-attr", [], {"style": "full_box_style"});
        block(env, morph0, context, "each", [get(env, context, "model")], {"keyword": "item"}, child0, child1);
        block(env, morph1, context, "bs-button", [], {"clicked": "addItem", "icon": "fa fa-icon fa-plus", "type": "primary", "size": "sm"}, child2, null);
        block(env, morph2, context, "bs-button", [], {"clicked": "saveChanges", "size": "sm", "icon": "fa fa-icon fa-save", "type": "primary"}, child3, null);
        block(env, morph3, context, "bs-button", [], {"clicked": "undoChanges", "size": "sm", "icon": "fa fa-icon fa-reply", "type": "danger"}, child4, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/loading', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","position:fixed; width:100%; left:0%; height:100%; background:linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.05));");
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h3");
        dom.setAttribute(el2,"style","text-align:left; margin:50px 0px 0px 20px; color:#FFF; width:200px; font-size: 1.2em");
        var el3 = dom.createTextNode("Loading. Please wait...");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/project', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/project/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("				Project: ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "slyd.project");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "inline-editable-text-field", [], {"text": get(env, context, "slyd.project"), "validation": "^[a-zA-Z0-9_-]+$", "name": get(env, context, "slyd.project"), "action": "rename"}, child0, null);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createTextNode("Project: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          content(env, morph0, context, "project_name");
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "bs-dropdown", [], {"actions": get(env, context, "additionalActions")});
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("							");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "spider");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("				");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row");
          var el2 = dom.createTextNode("\n					");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-9 clickable-url");
          var el3 = dom.createTextNode("\n");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("					");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n					");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          dom.setAttribute(el2,"class","col-xs-3 button-align");
          var el3 = dom.createTextNode("\n						");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n					");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n				");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
          var morph1 = dom.createMorphAt(dom.childAt(element1, [3]),1,1);
          block(env, morph0, context, "bs-button", [], {"clicked": "editSpider", "clickedParam": get(env, context, "spider"), "type": "light"}, child0, null);
          inline(env, morph1, context, "bs-button", [], {"clicked": "deleteSpider", "size": "sm", "clickedParam": get(env, context, "spider"), "icon": "fa fa-icon fa-trash", "type": "danger"});
          return fragment;
        }
      };
    }());
    var child4 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("					");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("h4");
            var el2 = dom.createTextNode("No Spiders matching \"");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\" found in this project.");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            content(env, morph0, context, "controller.filterSpider");
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("					");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("h4");
            var el2 = dom.createTextNode("No spiders for this project.");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "controller.filterSpider")], {}, child0, child1);
          return fragment;
        }
      };
    }());
    var child5 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("				Publish changes\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("				Discard Changes\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      var child2 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("						Deploy\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("				");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","text-align:center;font-size:1.1em;margin-top:10px");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("				");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
              block(env, morph0, context, "bs-button", [], {"clicked": "deployProject", "size": "sm", "icon": "fa fa-icon fa-upload", "type": "primary", "disabled": get(env, context, "controller.isDeploying"), "processing": get(env, context, "controller.isDeploying")}, child0, null);
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "capabilities.deploy_projects")], {}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","button-spacer");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("		");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(element0,1,1);
          var morph1 = dom.createMorphAt(element0,2,2);
          var morph2 = dom.createMorphAt(fragment,3,3,contextualElement);
          dom.insertBoundary(fragment, null);
          block(env, morph0, context, "bs-button", [], {"clicked": "publishProject", "size": "sm", "icon": "fa fa-icon fa-upload", "type": "primary", "disabled": get(env, context, "controller.noChanges"), "processing": get(env, context, "controller.isPublishing")}, child0, null);
          block(env, morph1, context, "bs-button", [], {"clicked": "discardChanges", "size": "sm", "icon": "fa fa-icon fa-trash", "type": "danger", "disabled": get(env, context, "controller.noChanges")}, child1, null);
          block(env, morph2, context, "unless", [get(env, context, "controller.hasChanges")], {}, child2, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","section");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","text-align:center;font-size:1.1em;margin-bottom:5px");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        var el3 = dom.createTextNode("Spiders");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","pull-right");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","input-group col-xs-11");
        var el4 = dom.createTextNode("\n			");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n			");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("div");
        dom.setAttribute(el4,"class","input-group-addon");
        var el5 = dom.createElement("span");
        dom.setAttribute(el5,"class","fa fa-search");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n		");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","scrolling-container");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("		");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline, element = hooks.element;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element2 = dom.childAt(fragment, [0]);
        var element3 = dom.childAt(element2, [7]);
        var element4 = dom.childAt(element3, [3]);
        var morph0 = dom.createMorphAt(dom.childAt(element2, [1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element2, [5]),1,1);
        var morph2 = dom.createMorphAt(dom.childAt(element3, [1]),1,1);
        var morph3 = dom.createMorphAt(element4,1,1);
        var morph4 = dom.createMorphAt(element2,9,9);
        block(env, morph0, context, "if", [get(env, context, "capabilities.rename_projects")], {}, child0, child1);
        block(env, morph1, context, "if", [get(env, context, "additionalActions")], {}, child2, null);
        inline(env, morph2, context, "input", [], {"value": get(env, context, "filterSpider"), "class": "form-control", "placeholder": "Filter Spiders"});
        element(env, element4, context, "bind-attr", [], {"style": "full_box_style"});
        block(env, morph3, context, "each", [get(env, context, "filteredSpiders")], {"keyword": "spider"}, child3, child4);
        block(env, morph4, context, "if", [get(env, context, "capabilities.version_control")], {}, child5, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/project/topbar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		New Spider\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","nav-container");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        block(env, morph0, context, "wizard-box", [], {"action": "addSpider", "placeholder": "Enter page URL", "defaultValue": get(env, context, "siteWizard")}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/projects', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/projects/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("							");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
              content(env, morph0, context, "project.name");
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("					");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","col-xs-9 clickable-url");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("					");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n					");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","col-xs-3 button-align");
            var el2 = dom.createTextNode("\n						");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n					");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            var morph1 = dom.createMorphAt(dom.childAt(fragment, [3]),1,1);
            block(env, morph0, context, "bs-button", [], {"clicked": "openProject", "clickedParam": get(env, context, "project.id"), "type": "light"}, child0, null);
            inline(env, morph1, context, "bs-button", [], {"clicked": "deleteProject", "clickedParam": get(env, context, "project.id"), "icon": "fa fa-icon fa-trash", "type": "danger", "size": "sm"});
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("							");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
              content(env, morph0, context, "project.name");
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("					");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","col-xs-11 clickable-url full-size");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("					");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
            block(env, morph0, context, "bs-button", [], {"clicked": "openProject", "clickedParam": get(env, context, "project.id"), "type": "light"}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row");
          var el2 = dom.createTextNode("\n");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("			");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          block(env, morph0, context, "if", [get(env, context, "capabilities.delete_projects")], {}, child0, child1);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          var el2 = dom.createTextNode("No projects have been created yet.");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","margin:10px 0px 0px 10px");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"style","margin-top:10px");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h4");
        var el3 = dom.createTextNode("Open project");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","scrolling-container");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0, 5]);
        var morph0 = dom.createMorphAt(element0,1,1);
        element(env, element0, context, "bind-attr", [], {"style": "full_box_style"});
        block(env, morph0, context, "each", [get(env, context, "displayProjects")], {"keyword": "project"}, child0, child1);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/projects/topbar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("			Start\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "wizard-box", [], {"action": "createProject", "placeholder": "Enter site URL"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","float:left;margin-top:2px");
        dom.setAttribute(el1,"class","nav-container");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        block(env, morph0, context, "if", [get(env, context, "capabilities.create_projects")], {}, child0, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/spider', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/spider/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("            Spider: ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "model.name");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "inline-editable-text-field", [], {"text": get(env, context, "model.name"), "validation": "^[a-zA-Z0-9_-]+$", "name": get(env, context, "model.name"), "action": "rename"}, child0, null);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createTextNode("Spider: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          content(env, morph0, context, "model.name");
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                    ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
              content(env, morph0, context, "editAllStartUrlsText");
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, content = hooks.content;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
                content(env, morph0, context, "url");
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","row");
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-9 clickable-url");
              var el3 = dom.createTextNode("\n");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("                    ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-3 button-align");
              var el3 = dom.createTextNode("\n                        ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n                        ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n                    ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element8 = dom.childAt(fragment, [1]);
              var element9 = dom.childAt(element8, [3]);
              var morph0 = dom.createMorphAt(dom.childAt(element8, [1]),1,1);
              var morph1 = dom.createMorphAt(element9,1,1);
              var morph2 = dom.createMorphAt(element9,3,3);
              block(env, morph0, context, "bs-button", [], {"clicked": "fetchPage", "clickedParam": get(env, context, "url"), "type": "light", "title": get(env, context, "url"), "popoverPlacement": "left"}, child0, null);
              inline(env, morph1, context, "copy-clipboard", [], {"text": get(env, context, "url")});
              inline(env, morph2, context, "bs-button", [], {"clicked": "deleteStartUrl", "clickedParam": get(env, context, "url"), "icon": "fa fa-icon fa-trash", "type": "danger", "size": "xs"});
              return fragment;
            }
          };
        }());
        var child2 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h5");
              var el2 = dom.createTextNode("No start pages for this spider.");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        var child3 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("            ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","scrolling-container");
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"style","margin-top:10px");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"style","margin-top:5px");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"style","margin-top:5px");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n            ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, element = hooks.element, get = hooks.get, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element7 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element7,3,3);
              var morph1 = dom.createMorphAt(element7,7,7);
              var morph2 = dom.createMorphAt(element7,11,11);
              element(env, element7, context, "bind-attr", [], {"style": "ex_tiny_box_style"});
              inline(env, morph0, context, "text-field", [], {"value": get(env, context, "loginUrl"), "name": "loginUrl", "width": "94%", "placeholder": "Login URL", "action": "updateLoginInfo", "update": "addInitRequest"});
              inline(env, morph1, context, "text-field", [], {"value": get(env, context, "loginUser"), "name": "loginUser", "width": "94%", "placeholder": "Login user", "action": "updateLoginInfo", "update": "addInitRequest"});
              inline(env, morph2, context, "text-field", [], {"value": get(env, context, "loginPassword"), "name": "loginPassword", "width": "94%", "placeholder": "Login password", "action": "updateLoginInfo", "update": "addInitRequest"});
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","row");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-8");
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("h4");
            var el4 = dom.createTextNode("Start Pages");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"class","col-xs-4 start-url-badge button-spacer");
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","scrolling-container");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"style","margin-top:20px");
            dom.setAttribute(el1,"class","scrolling-container");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("span");
            dom.setAttribute(el2,"class","important-label");
            var el3 = dom.createTextNode("Perform login");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n\n");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block, element = hooks.element;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element10 = dom.childAt(fragment, [1, 3]);
            var element11 = dom.childAt(fragment, [3]);
            var element12 = dom.childAt(fragment, [7]);
            var morph0 = dom.createMorphAt(element10,1,1);
            var morph1 = dom.createMorphAt(element10,3,3);
            var morph2 = dom.createMorphAt(element11,1,1);
            var morph3 = dom.createMorphAt(fragment,5,5,contextualElement);
            var morph4 = dom.createMorphAt(element12,3,3);
            var morph5 = dom.createMorphAt(element12,5,5);
            var morph6 = dom.createMorphAt(fragment,9,9,contextualElement);
            dom.insertBoundary(fragment, null);
            inline(env, morph0, context, "bs-badge", [], {"class": "pull-right btn-primary", "content": get(env, context, "startUrlCount")});
            block(env, morph1, context, "bs-button", [], {"type": get(env, context, "editAllStartUrlsType"), "clicked": get(env, context, "editAllStartUrlsAction"), "size": "xs", "disabled": get(env, context, "hasStartUrls"), "class": "pull-right"}, child0, null);
            element(env, element11, context, "bind-attr", [], {"style": "tiny_box_style"});
            block(env, morph2, context, "each", [get(env, context, "model.start_urls")], {"keyword": "url"}, child1, child2);
            inline(env, morph3, context, "text-area-with-button", [], {"placeholder": "Enter one or multiple start page urls here", "action": get(env, context, "startUrlsAction"), "reset": true, "value": get(env, context, "startUrls")});
            inline(env, morph4, context, "check-box", [], {"checked": get(env, context, "model.performLogin"), "name": "performLoginCheck"});
            inline(env, morph5, context, "inline-help", [], {"message": "perform_login"});
            block(env, morph6, context, "if", [get(env, context, "model.performLogin")], {}, child3, null);
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px;margin-bottom:10px");
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("span");
              dom.setAttribute(el2,"class","important-label");
              var el3 = dom.createTextNode("Respect nofollow");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
              inline(env, morph0, context, "check-box", [], {"checked": get(env, context, "model.respect_nofollow"), "name": "respectNoFollow"});
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 2,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement, blockArguments) {
                var dom = env.dom;
                var hooks = env.hooks, set = hooks.set, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
                set(env, context, "pattern", blockArguments[0]);
                set(env, context, "index", blockArguments[1]);
                inline(env, morph0, context, "display-button-edit-delete", [], {"save": "editFollowPattern", "delete": "deleteFollowPattern", "text": get(env, context, "pattern"), "name": get(env, context, "index")});
                return fragment;
              }
            };
          }());
          var child1 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","col-xs-12");
                var el2 = dom.createTextNode("\n                            ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("h5");
                var el3 = dom.createTextNode("No follow patterns defined yet.");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                        ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                return fragment;
              }
            };
          }());
          var child2 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 2,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement, blockArguments) {
                var dom = env.dom;
                var hooks = env.hooks, set = hooks.set, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
                set(env, context, "pattern", blockArguments[0]);
                set(env, context, "index", blockArguments[1]);
                inline(env, morph0, context, "display-button-edit-delete", [], {"save": "editExcludePattern", "delete": "deleteExcludePattern", "text": get(env, context, "pattern"), "name": get(env, context, "index")});
                return fragment;
              }
            };
          }());
          var child3 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                        ");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","col-xs-12");
                var el2 = dom.createTextNode("\n                            ");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("h5");
                var el3 = dom.createTextNode("No exclude patterns defined yet.");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n                        ");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h4");
              var el2 = dom.createTextNode("Follow links that match this patterns");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","scrolling-container");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h4");
              var el2 = dom.createTextNode("Exclude links that match this patterns");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","scrolling-container");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin-top:10px");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, inline = hooks.inline, element = hooks.element, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element3 = dom.childAt(fragment, [5]);
              var element4 = dom.childAt(fragment, [17]);
              var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
              var morph1 = dom.createMorphAt(element3,1,1);
              var morph2 = dom.createMorphAt(fragment,9,9,contextualElement);
              var morph3 = dom.createMorphAt(fragment,15,15,contextualElement);
              var morph4 = dom.createMorphAt(element4,1,1);
              var morph5 = dom.createMorphAt(fragment,21,21,contextualElement);
              inline(env, morph0, context, "inline-help", [], {"message": "follow_links"});
              element(env, element3, context, "bind-attr", [], {"style": "ex_tiny_box_style"});
              block(env, morph1, context, "each", [get(env, context, "model.follow_patterns")], {}, child0, child1);
              inline(env, morph2, context, "regex-text-field-with-button", [], {"action": "addFollowPattern", "placeholder": "New follow pattern", "reset": true});
              inline(env, morph3, context, "inline-help", [], {"message": "exclude_links"});
              element(env, element4, context, "bind-attr", [], {"style": "ex_tiny_box_style"});
              block(env, morph4, context, "each", [get(env, context, "model.exclude_patterns")], {}, child2, child3);
              inline(env, morph5, context, "regex-text-field-with-button", [], {"action": "addExcludePattern", "placeholder": "New exclude pattern", "reset": true});
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","scrolling-container");
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n            ");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"style","margin-top:10px");
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("span");
            dom.setAttribute(el3,"class","important-label");
            var el4 = dom.createTextNode("Overlay blocked links");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n                ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n            ");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, element = hooks.element, get = hooks.get, inline = hooks.inline, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element5 = dom.childAt(fragment, [1]);
            var element6 = dom.childAt(element5, [3]);
            var morph0 = dom.createMorphAt(element5,1,1);
            var morph1 = dom.createMorphAt(element6,1,1);
            var morph2 = dom.createMorphAt(element6,5,5);
            var morph3 = dom.createMorphAt(element5,5,5);
            var morph4 = dom.createMorphAt(element5,7,7);
            element(env, element5, context, "bind-attr", [], {"style": "mid_box_style"});
            inline(env, morph0, context, "item-select", [], {"options": get(env, context, "followPatternOptions"), "value": get(env, context, "controller.links_to_follow")});
            inline(env, morph1, context, "check-box", [], {"checked": get(env, context, "showLinks"), "name": "showLinks"});
            inline(env, morph2, context, "inline-help", [], {"message": "overlay_blocked_links"});
            block(env, morph3, context, "if", [get(env, context, "displayNofollow")], {}, child0, null);
            block(env, morph4, context, "if", [get(env, context, "displayEditPatterns")], {}, child1, null);
            return fragment;
          }
        };
      }());
      var child2 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("                            ");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, content = hooks.content;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
                content(env, morph0, context, "templ");
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","row");
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-9 clickable-url");
              var el3 = dom.createTextNode("\n");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("                    ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                    ");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-3 button-align-sm");
              var el3 = dom.createTextNode("\n                        ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n                        ");
              dom.appendChild(el2, el3);
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n                    ");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n                ");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element0 = dom.childAt(fragment, [1]);
              var element1 = dom.childAt(element0, [3]);
              var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
              var morph1 = dom.createMorphAt(element1,1,1);
              var morph2 = dom.createMorphAt(element1,3,3);
              block(env, morph0, context, "bs-button", [], {"clicked": "editTemplate", "clickedParam": get(env, context, "templ"), "title": get(env, context, "url"), "type": "light"}, child0, null);
              inline(env, morph1, context, "bs-button", [], {"clicked": "viewTemplate", "clickedParam": get(env, context, "templ"), "icon": " fa fa-icon fa-external-link", "type": "primary", "size": "xs"});
              inline(env, morph2, context, "bs-button", [], {"clicked": "deleteTemplate", "clickedParam": get(env, context, "templ"), "icon": "fa fa-icon fa-trash", "type": "danger", "size": "xs"});
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("                ");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h5");
              var el2 = dom.createTextNode("No templates exist for this spider yet.");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("        ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","scrolling-container");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("        ");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element2 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(element2,1,1);
            element(env, element2, context, "bind-attr", [], {"style": "mid_box_style"});
            block(env, morph0, context, "each", [get(env, context, "model.template_names")], {"keyword": "templ"}, child0, child1);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
          var morph2 = dom.createMorphAt(fragment,4,4,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "accordion-item", [], {"title": "Initialization"}, child0, null);
          block(env, morph1, context, "accordion-item", [], {"title": "Crawling"}, child1, null);
          block(env, morph2, context, "accordion-item", [], {"title": "Samples"}, child2, null);
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "controller.testButtonLabel");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","text-align:center;font-size:1.1em;margin:10px 0px 10px 0px");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","margin-top:10px;text-align:center");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
        var morph1 = dom.createMorphAt(fragment,3,3,contextualElement);
        var morph2 = dom.createMorphAt(dom.childAt(fragment, [5]),1,1);
        block(env, morph0, context, "if", [get(env, context, "capabilities.rename_spiders")], {}, child0, child1);
        block(env, morph1, context, "closable-accordion", [], {"configName": "bs", "selected-idx": 0}, child2, null);
        block(env, morph2, context, "bs-button", [], {"clicked": "testSpider", "clickedParam": get(env, context, "this"), "icon": "fa fa-icon fa-check", "type": "primary", "title": "Tests the spider on every start URL."}, child3, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/spider/topbar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "controller.currentUrl");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("			Annotate this page\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "bs-button", [], {"type": "danger", "clicked": "addTemplate", "size": "sm"}, child0, null);
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("			");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "itemsButtonLabel");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "bs-button", [], {"clicked": "toggleShowItems", "type": "black", "size": "sm"}, child0, null);
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "bs-label", [], {"content": "No items extracted", "type": "info"});
          return fragment;
        }
      };
    }());
    var child4 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "bs-label", [], {"content": "Saving Spider", "type": "warning"});
          return fragment;
        }
      };
    }());
    var child5 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("					");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("hr");
              dom.setAttribute(el1,"style","margin:0px;background-color:rgba(70,70,70,1)");
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n					");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","padding:10px 0px 10px 0px; border-bottom: 1px groove rgba(255,255,255,0.2);");
              var el2 = dom.createTextNode("\n						");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n					");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(dom.childAt(fragment, [3]),1,1);
              inline(env, morph0, context, "extracted-item", [], {"extractedItem": get(env, context, "item"), "fetchPage": "fetchPage", "editTemplate": "editTemplate"});
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","extracted-items-container");
            var el2 = dom.createTextNode("\n			");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("span");
            dom.setAttribute(el2,"style","float:right");
            var el3 = dom.createTextNode("\n				");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n			");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n			");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("h3");
            dom.setAttribute(el2,"style","text-align:center");
            dom.setAttribute(el2,"class","important-label");
            var el3 = dom.createTextNode("Displaying ");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode(" extracted items");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n			");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"style","max-height:500px; padding:8px;");
            dom.setAttribute(el2,"class","scrolling-container");
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("			");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n		");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, inline = hooks.inline, content = hooks.content, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element0 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
            var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),1,1);
            var morph2 = dom.createMorphAt(dom.childAt(element0, [5]),1,1);
            inline(env, morph0, context, "bs-button", [], {"clicked": "toggleShowItems", "size": "sm", "type": "light", "icon": "fa fa-icon fa-close"});
            content(env, morph1, context, "controller.extractedItems.length");
            block(env, morph2, context, "each", [get(env, context, "controller.extractedItems")], {"keyword": "item"}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "if", [get(env, context, "controller.extractedItems.length")], {}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","nav-container button-align");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"style","float:left");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"style","float:left");
        var el3 = dom.createTextNode("\n		");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"class","url");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","nav-container button-align white-text");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element1 = dom.childAt(fragment, [0]);
        var element2 = dom.childAt(fragment, [2]);
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(element1, [3]),1,1);
        var morph2 = dom.createMorphAt(dom.childAt(element1, [5]),1,1);
        var morph3 = dom.createMorphAt(element2,1,1);
        var morph4 = dom.createMorphAt(element2,3,3);
        var morph5 = dom.createMorphAt(element2,5,5);
        var morph6 = dom.createMorphAt(element2,7,7);
        var morph7 = dom.createMorphAt(fragment,4,4,contextualElement);
        dom.insertBoundary(fragment, null);
        inline(env, morph0, context, "bs-button", [], {"clicked": "browseBack", "icon": "fa fa-icon fa-arrow-left", "size": "sm", "disabled": get(env, context, "browseBackDisabled")});
        inline(env, morph1, context, "bs-button", [], {"clicked": "reload", "icon": "fa fa-icon fa-refresh", "size": "sm", "disabled": get(env, context, "reloadDisabled")});
        block(env, morph2, context, "label-with-tooltip", [], {"title": get(env, context, "controller.currentUrl")}, child0, null);
        block(env, morph3, context, "unless", [get(env, context, "addTemplateDisabled")], {}, child1, null);
        block(env, morph4, context, "unless", [get(env, context, "showItemsDisabled")], {}, child2, null);
        block(env, morph5, context, "if", [get(env, context, "showNoItemsExtracted")], {}, child3, null);
        block(env, morph6, context, "if", [get(env, context, "saving")], {}, child4, null);
        block(env, morph7, context, "if", [get(env, context, "showItems")], {}, child5, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/template-items', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/template', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/template/toolbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("			Sample: ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, content = hooks.content;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            content(env, morph0, context, "model.name");
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "inline-editable-text-field", [], {"text": get(env, context, "content.name"), "validation": "^[a-zA-Z0-9_-]+$", "name": "model.name", "action": "rename"}, child0, null);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("		");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h4");
          var el2 = dom.createTextNode("Sample: ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
          content(env, morph0, context, "model.name");
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("					");
                dom.appendChild(el0, el1);
                var el1 = dom.createComment("");
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
                inline(env, morph0, context, "component", [get(env, context, "activeExtractionTool.component")], {"data": get(env, context, "anno"), "alldata": get(env, context, "activeExtractionTool.data.extracts"), "item": get(env, context, "scrapedItem"), "createField": "createField", "close": "hideFloatingAnnotationWidget", "edit": "editAnnotation", "document": get(env, context, "document"), "pluginState": get(env, context, "activeExtractionTool.pluginState"), "sprites": get(env, context, "activeExtractionTool.sprites"), "extractionFieldTypes": get(env, context, "extractionTypes"), "updatePluginData": "updatePluginField"});
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("			");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","scrolling-container");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("			");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element7 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element7,1,1);
              element(env, element7, context, "bind-attr", [], {"style": "mid_box_style"});
              block(env, morph0, context, "each", [get(env, context, "activeExtractionTool.data.extracts")], {"keyword": "anno"}, child0, null);
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("			");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h5");
              var el2 = dom.createTextNode("No annotations have been created yet.");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, null);
            dom.insertBoundary(fragment, 0);
            block(env, morph0, context, "if", [get(env, context, "activeExtractionTool.data.extracts")], {}, child0, child1);
            return fragment;
          }
        };
      }());
      var child1 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("				Edit Items\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("label");
            dom.setAttribute(el1,"class","small-label");
            var el2 = dom.createTextNode("Extracted item type:");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"style","margin-top:10px");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("		");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
            var morph1 = dom.createMorphAt(fragment,5,5,contextualElement);
            var morph2 = dom.createMorphAt(dom.childAt(fragment, [7]),1,1);
            inline(env, morph0, context, "item-select", [], {"options": get(env, context, "items"), "value": get(env, context, "controller.scrapedItem.id"), "changed": "updateScraped"});
            inline(env, morph1, context, "inline-help", [], {"message": "select_item"});
            block(env, morph2, context, "bs-button", [], {"clicked": "editItems", "type": "primary", "size": "sm"}, child0, null);
            return fragment;
          }
        };
      }());
      var child2 = (function() {
        var child0 = (function() {
          var child0 = (function() {
            var child0 = (function() {
              return {
                isHTMLBars: true,
                revision: "Ember@1.11.3",
                blockParams: 0,
                cachedFragment: null,
                hasRendered: false,
                build: function build(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("							");
                  dom.appendChild(el0, el1);
                  var el1 = dom.createElement("div");
                  dom.setAttribute(el1,"style","margin-top:10px");
                  dom.appendChild(el0, el1);
                  var el1 = dom.createTextNode("\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                render: function render(context, env, contextualElement) {
                  var dom = env.dom;
                  dom.detectNamespace(contextualElement);
                  var fragment;
                  if (env.useFragmentCache && dom.canClone) {
                    if (this.cachedFragment === null) {
                      fragment = this.build(dom);
                      if (this.hasRendered) {
                        this.cachedFragment = fragment;
                      } else {
                        this.hasRendered = true;
                      }
                    }
                    if (this.cachedFragment) {
                      fragment = dom.cloneNode(this.cachedFragment, true);
                    }
                  } else {
                    fragment = this.build(dom);
                  }
                  return fragment;
                }
              };
            }());
            var child1 = (function() {
              var child0 = (function() {
                return {
                  isHTMLBars: true,
                  revision: "Ember@1.11.3",
                  blockParams: 0,
                  cachedFragment: null,
                  hasRendered: false,
                  build: function build(dom) {
                    var el0 = dom.createDocumentFragment();
                    var el1 = dom.createTextNode("									");
                    dom.appendChild(el0, el1);
                    var el1 = dom.createElement("span");
                    var el2 = dom.createComment("");
                    dom.appendChild(el1, el2);
                    var el2 = dom.createTextNode(" ");
                    dom.appendChild(el1, el2);
                    var el2 = dom.createComment("");
                    dom.appendChild(el1, el2);
                    dom.appendChild(el0, el1);
                    var el1 = dom.createTextNode("\n");
                    dom.appendChild(el0, el1);
                    return el0;
                  },
                  render: function render(context, env, contextualElement) {
                    var dom = env.dom;
                    var hooks = env.hooks, content = hooks.content;
                    dom.detectNamespace(contextualElement);
                    var fragment;
                    if (env.useFragmentCache && dom.canClone) {
                      if (this.cachedFragment === null) {
                        fragment = this.build(dom);
                        if (this.hasRendered) {
                          this.cachedFragment = fragment;
                        } else {
                          this.hasRendered = true;
                        }
                      }
                      if (this.cachedFragment) {
                        fragment = dom.cloneNode(this.cachedFragment, true);
                      }
                    } else {
                      fragment = this.build(dom);
                    }
                    var element4 = dom.childAt(fragment, [1]);
                    var morph0 = dom.createMorphAt(element4,0,0);
                    var morph1 = dom.createMorphAt(element4,2,2);
                    content(env, morph0, context, "ext.type");
                    content(env, morph1, context, "ext.label");
                    return fragment;
                  }
                };
              }());
              return {
                isHTMLBars: true,
                revision: "Ember@1.11.3",
                blockParams: 0,
                cachedFragment: null,
                hasRendered: false,
                build: function build(dom) {
                  var el0 = dom.createDocumentFragment();
                  var el1 = dom.createTextNode("							");
                  dom.appendChild(el0, el1);
                  var el1 = dom.createElement("div");
                  dom.setAttribute(el1,"style","margin:4px 0px 4px 0px");
                  var el2 = dom.createTextNode("\n");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createComment("");
                  dom.appendChild(el1, el2);
                  var el2 = dom.createTextNode("							");
                  dom.appendChild(el1, el2);
                  dom.appendChild(el0, el1);
                  var el1 = dom.createTextNode("\n");
                  dom.appendChild(el0, el1);
                  return el0;
                },
                render: function render(context, env, contextualElement) {
                  var dom = env.dom;
                  var hooks = env.hooks, get = hooks.get, block = hooks.block;
                  dom.detectNamespace(contextualElement);
                  var fragment;
                  if (env.useFragmentCache && dom.canClone) {
                    if (this.cachedFragment === null) {
                      fragment = this.build(dom);
                      if (this.hasRendered) {
                        this.cachedFragment = fragment;
                      } else {
                        this.hasRendered = true;
                      }
                    }
                    if (this.cachedFragment) {
                      fragment = dom.cloneNode(this.cachedFragment, true);
                    }
                  } else {
                    fragment = this.build(dom);
                  }
                  var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
                  block(env, morph0, context, "draggable-button", [], {"content": get(env, context, "ext.extractor.id"), "clicked": "removeAppliedExtractor", "clickedParam": get(env, context, "ext"), "class": "draggable"}, child0, null);
                  return fragment;
                }
              };
            }());
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("					");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("div");
                dom.setAttribute(el1,"class","target-container btn btn-light droppable");
                var el2 = dom.createTextNode("\n						");
                dom.appendChild(el1, el2);
                var el2 = dom.createElement("span");
                dom.setAttribute(el2,"class","target");
                var el3 = dom.createElement("b");
                dom.setAttribute(el3,"style","margin-right:10px");
                var el4 = dom.createComment("");
                dom.appendChild(el3, el4);
                dom.appendChild(el2, el3);
                var el3 = dom.createTextNode("[+Drop here]");
                dom.appendChild(el2, el3);
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("\n");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode("					");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, content = hooks.content, get = hooks.get, block = hooks.block;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var element5 = dom.childAt(fragment, [1]);
                var morph0 = dom.createMorphAt(dom.childAt(element5, [1, 0]),0,0);
                var morph1 = dom.createMorphAt(element5,3,3);
                var morph2 = dom.createMorphAt(element5,4,4);
                content(env, morph0, context, "field.fieldName");
                block(env, morph1, context, "if", [get(env, context, "field.extractors")], {}, child0, null);
                block(env, morph2, context, "each", [get(env, context, "field.extractors")], {"keyword": "ext"}, child1, null);
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createComment("");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
              dom.insertBoundary(fragment, null);
              dom.insertBoundary(fragment, 0);
              block(env, morph0, context, "extractor-dropzone", [], {"content": get(env, context, "field.fieldName"), "action": "applyExtractor"}, child0, null);
              return fragment;
            }
          };
        }());
        var child1 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("				");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h5");
              var el2 = dom.createTextNode("No field mappings have been defined yet.");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        var child2 = (function() {
          var child0 = (function() {
            return {
              isHTMLBars: true,
              revision: "Ember@1.11.3",
              blockParams: 0,
              cachedFragment: null,
              hasRendered: false,
              build: function build(dom) {
                var el0 = dom.createDocumentFragment();
                var el1 = dom.createTextNode("						");
                dom.appendChild(el0, el1);
                var el1 = dom.createElement("span");
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                var el2 = dom.createTextNode(" ");
                dom.appendChild(el1, el2);
                var el2 = dom.createComment("");
                dom.appendChild(el1, el2);
                dom.appendChild(el0, el1);
                var el1 = dom.createTextNode("\n");
                dom.appendChild(el0, el1);
                return el0;
              },
              render: function render(context, env, contextualElement) {
                var dom = env.dom;
                var hooks = env.hooks, content = hooks.content;
                dom.detectNamespace(contextualElement);
                var fragment;
                if (env.useFragmentCache && dom.canClone) {
                  if (this.cachedFragment === null) {
                    fragment = this.build(dom);
                    if (this.hasRendered) {
                      this.cachedFragment = fragment;
                    } else {
                      this.hasRendered = true;
                    }
                  }
                  if (this.cachedFragment) {
                    fragment = dom.cloneNode(this.cachedFragment, true);
                  }
                } else {
                  fragment = this.build(dom);
                }
                var element2 = dom.childAt(fragment, [1]);
                var morph0 = dom.createMorphAt(element2,0,0);
                var morph1 = dom.createMorphAt(element2,2,2);
                content(env, morph0, context, "ext.type");
                content(env, morph1, context, "ext.label");
                return fragment;
              }
            };
          }());
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("				");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"style","margin:4px 0px 4px 0px");
              var el2 = dom.createTextNode("\n");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("					");
              dom.appendChild(el1, el2);
              var el2 = dom.createComment("");
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n				");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, get = hooks.get, block = hooks.block, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element3 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(element3,1,1);
              var morph1 = dom.createMorphAt(element3,3,3);
              block(env, morph0, context, "draggable-button", [], {"content": get(env, context, "ext.extractor.id"), "class": "draggable"}, child0, null);
              inline(env, morph1, context, "bs-button", [], {"clicked": "deleteExtractor", "type": "danger", "size": "xs", "clickedParam": get(env, context, "ext"), "icon": "fa fa-icon fa-trash"});
              return fragment;
            }
          };
        }());
        var child3 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("				");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("h5");
              var el2 = dom.createTextNode("No extractors have been created yet.");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","scrolling-container");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("		");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"style","margin-top:10px");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("h4");
            var el2 = dom.createTextNode("Drag extractors to the fields above");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","scrolling-container ui-corner-all");
            dom.setAttribute(el1,"style","max-height:100px;");
            var el2 = dom.createTextNode("\n");
            dom.appendChild(el1, el2);
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("		");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, element = hooks.element, get = hooks.get, block = hooks.block, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element6 = dom.childAt(fragment, [1]);
            var morph0 = dom.createMorphAt(element6,1,1);
            var morph1 = dom.createMorphAt(fragment,7,7,contextualElement);
            var morph2 = dom.createMorphAt(dom.childAt(fragment, [9]),1,1);
            var morph3 = dom.createMorphAt(fragment,11,11,contextualElement);
            element(env, element6, context, "bind-attr", [], {"style": "ex_tiny_box_style"});
            block(env, morph0, context, "each", [get(env, context, "mappedFieldsData")], {"keyword": "field"}, child0, child1);
            inline(env, morph1, context, "inline-help", [], {"message": "extractors"});
            block(env, morph2, context, "each", [get(env, context, "displayExtractors")], {"keyword": "ext"}, child2, child3);
            inline(env, morph3, context, "text-field-dropdown-button", [], {"options": get(env, context, "extractionTypes"), "default": get(env, context, "newTypeExtractor"), "placeholder": "Enter a RegEx", "action": "createExtractor", "class": "create-extractor-container"});
            return fragment;
          }
        };
      }());
      var child3 = (function() {
        var child0 = (function() {
          return {
            isHTMLBars: true,
            revision: "Ember@1.11.3",
            blockParams: 0,
            cachedFragment: null,
            hasRendered: false,
            build: function build(dom) {
              var el0 = dom.createDocumentFragment();
              var el1 = dom.createTextNode("					");
              dom.appendChild(el0, el1);
              var el1 = dom.createElement("div");
              dom.setAttribute(el1,"class","row");
              var el2 = dom.createTextNode("\n						");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-5 top-div");
              var el3 = dom.createTextNode("\n							");
              dom.appendChild(el2, el3);
              var el3 = dom.createElement("div");
              dom.setAttribute(el3,"class","field-name");
              var el4 = dom.createTextNode("\n								");
              dom.appendChild(el3, el4);
              var el4 = dom.createElement("span");
              dom.setAttribute(el4,"class","important-label");
              var el5 = dom.createComment("");
              dom.appendChild(el4, el5);
              dom.appendChild(el3, el4);
              var el4 = dom.createTextNode("\n							");
              dom.appendChild(el3, el4);
              dom.appendChild(el2, el3);
              var el3 = dom.createTextNode("\n						");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n						");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-3");
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n						");
              dom.appendChild(el1, el2);
              var el2 = dom.createElement("div");
              dom.setAttribute(el2,"class","col-xs-3");
              var el3 = dom.createComment("");
              dom.appendChild(el2, el3);
              dom.appendChild(el1, el2);
              var el2 = dom.createTextNode("\n					");
              dom.appendChild(el1, el2);
              dom.appendChild(el0, el1);
              var el1 = dom.createTextNode("\n");
              dom.appendChild(el0, el1);
              return el0;
            },
            render: function render(context, env, contextualElement) {
              var dom = env.dom;
              var hooks = env.hooks, content = hooks.content, get = hooks.get, inline = hooks.inline;
              dom.detectNamespace(contextualElement);
              var fragment;
              if (env.useFragmentCache && dom.canClone) {
                if (this.cachedFragment === null) {
                  fragment = this.build(dom);
                  if (this.hasRendered) {
                    this.cachedFragment = fragment;
                  } else {
                    this.hasRendered = true;
                  }
                }
                if (this.cachedFragment) {
                  fragment = dom.cloneNode(this.cachedFragment, true);
                }
              } else {
                fragment = this.build(dom);
              }
              var element0 = dom.childAt(fragment, [1]);
              var morph0 = dom.createMorphAt(dom.childAt(element0, [1, 1, 1]),0,0);
              var morph1 = dom.createMorphAt(dom.childAt(element0, [3]),0,0);
              var morph2 = dom.createMorphAt(dom.childAt(element0, [5]),0,0);
              content(env, morph0, context, "field.fieldName");
              inline(env, morph1, context, "check-box", [], {"checked": get(env, context, "field.required"), "value": get(env, context, "field.fieldName"), "disabled": get(env, context, "field.disabled"), "action": "setRequired"});
              inline(env, morph2, context, "check-box", [], {"checked": get(env, context, "field.extracted"), "value": "extracted", "disabled": true, "action": "setRequired"});
              return fragment;
            }
          };
        }());
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("span");
            dom.setAttribute(el1,"style","float:right");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("h4");
            dom.setAttribute(el1,"style","width:92%");
            var el2 = dom.createTextNode("Check the fields you want to make required for this template:");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n		");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("div");
            dom.setAttribute(el1,"class","scrolling-container");
            var el2 = dom.createTextNode("\n			");
            dom.appendChild(el1, el2);
            var el2 = dom.createElement("div");
            dom.setAttribute(el2,"style","margin:15px auto;width: 100%;");
            var el3 = dom.createTextNode("\n				");
            dom.appendChild(el2, el3);
            var el3 = dom.createElement("div");
            dom.setAttribute(el3,"class","row important-label");
            var el4 = dom.createTextNode("\n					");
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("div");
            dom.setAttribute(el4,"class","col-xs-5");
            var el5 = dom.createTextNode("Name");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("div");
            dom.setAttribute(el4,"class","col-xs-3");
            var el5 = dom.createTextNode("Required");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            var el4 = dom.createElement("div");
            dom.setAttribute(el4,"class","col-xs-3");
            var el5 = dom.createTextNode("Extracted");
            dom.appendChild(el4, el5);
            dom.appendChild(el3, el4);
            var el4 = dom.createTextNode("\n				");
            dom.appendChild(el3, el4);
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("\n");
            dom.appendChild(el2, el3);
            var el3 = dom.createComment("");
            dom.appendChild(el2, el3);
            var el3 = dom.createTextNode("			");
            dom.appendChild(el2, el3);
            dom.appendChild(el1, el2);
            var el2 = dom.createTextNode("\n		");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, inline = hooks.inline, element = hooks.element, get = hooks.get, block = hooks.block;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element1 = dom.childAt(fragment, [5]);
            var morph0 = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
            var morph1 = dom.createMorphAt(dom.childAt(element1, [1]),3,3);
            inline(env, morph0, context, "inline-help", [], {"message": "template_required"});
            element(env, element1, context, "bind-attr", [], {"style": "mid_box_style"});
            block(env, morph1, context, "each", [get(env, context, "mappedFieldsData")], {"keyword": "field"}, child0, null);
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
          var morph2 = dom.createMorphAt(fragment,4,4,contextualElement);
          var morph3 = dom.createMorphAt(fragment,6,6,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "accordion-item", [], {"title": "Annotations"}, child0, null);
          block(env, morph1, context, "accordion-item", [], {"title": "Extracted item"}, child1, null);
          block(env, morph2, context, "accordion-item", [], {"title": "Extractors"}, child2, null);
          block(env, morph3, context, "accordion-item", [], {"title": "Extracted fields"}, child3, null);
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("	");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "component", [get(env, context, "activeExtractionTool.component")], {"data": get(env, context, "floatingAnnotation"), "mappedElement": get(env, context, "floatingElement"), "alldata": get(env, context, "activeExtractionTool.data.extracts"), "item": get(env, context, "scrapedItem"), "createField": "createField", "close": "hideFloatingAnnotationWidget", "edit": "editAnnotation", "document": get(env, context, "document"), "pluginState": get(env, context, "activeExtractionTool.pluginState"), "sprites": get(env, context, "activeExtractionTool.sprites"), "extractionFieldTypes": get(env, context, "extractionTypes"), "inDoc": true, "pos": get(env, context, "showFloatingAnnotationWidgetAt"), "updatePluginData": "updatePluginField"});
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"style","text-align:center;font-size:1.1em;margin:10px 0px 10px 0px");
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0]),1,1);
        var morph1 = dom.createMorphAt(fragment,2,2,contextualElement);
        var morph2 = dom.createMorphAt(fragment,4,4,contextualElement);
        dom.insertBoundary(fragment, null);
        block(env, morph0, context, "if", [get(env, context, "capabilities.rename_templates")], {}, child0, child1);
        block(env, morph1, context, "closable-accordion", [], {"configName": "bs", "selected-idx": 0}, child2, null);
        block(env, morph2, context, "if", [get(env, context, "showFloatingAnnotationWidgetAt")], {}, child3, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/templates/template/topbar', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("			");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          content(env, morph0, context, "model.url");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("				Save Sample\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "bs-button", [], {"type": "primary", "size": "sm", "clicked": "continueBrowsing"}, child0, null);
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("				Discard Changes\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "bs-button", [], {"type": "danger", "size": "sm", "clicked": "discardChanges"}, child0, null);
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.3",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("				CSS\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.3",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "bs-button", [], {"clicked": "toggleCSS", "icon": "fa fa-icon fa-file-code-o", "activeType": "danger", "size": "sm", "title": "Toggle CSS"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.3",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","nav-container");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"class","url");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","nav-container");
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("	");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [2, 1]);
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [0, 1]),1,1);
        var morph1 = dom.createMorphAt(element0,1,1);
        var morph2 = dom.createMorphAt(element0,2,2);
        var morph3 = dom.createMorphAt(element0,3,3);
        block(env, morph0, context, "label-with-tooltip", [], {"title": get(env, context, "model.url")}, child0, null);
        block(env, morph1, context, "if", [get(env, context, "showContinueBrowsing")], {}, child1, null);
        block(env, morph2, context, "if", [get(env, context, "showDiscardButton")], {}, child2, null);
        block(env, morph3, context, "if", [get(env, context, "showToggleCSS")], {}, child3, null);
        return fragment;
      }
    };
  }()));

});
define('portia-web/utils/annotation-store', ['exports', 'ember', 'portia-web/mixins/application-utils', 'portia-web/models/annotation'], function (exports, Ember, ApplicationUtils, Annotation) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend(ApplicationUtils['default'], {

        iframe: (function () {
            return this.get('document.iframe');
        }).property('document.iframe'),

        findAll: function findAll() {
            var annotatedElements = this.get('iframe').findAnnotatedElements();
            var annotationJSONs = [];
            annotatedElements.each((function (i, element) {
                var jqElem = Ember['default'].$(element),
                    annotationJSON = Ember['default'].$.parseJSON(jqElem.attr('data-scrapy-annotate'));
                if (!annotationJSON['id']) {
                    // This looks like an old Austoscraping project annotation as it doesn't have
                    // an assigned id. Create one for it.
                    annotationJSON['id'] = this.shortGuid();
                    jqElem.attr('data-scrapy-annotate', JSON.stringify(annotationJSON));
                }
                annotationJSON['tagid'] = jqElem.data('tagid');
                annotationJSONs.pushObject(annotationJSON);
            }).bind(this));
            this._findIgnoresParentAnnotation();
            return annotationJSONs.map(function (annotationJSON) {
                return Annotation['default'].create(annotationJSON);
            });
        },

        _findIgnoresParentAnnotation: function _findIgnoresParentAnnotation() {
            var ignoredElements = this.get('iframe').findIgnoredElements();
            ignoredElements.each(function (index, ignoredElement) {
                var ignore;
                var attributeName;
                if (Ember['default'].$(ignoredElement).attr('data-scrapy-ignore')) {
                    attributeName = 'data-scrapy-ignore';
                } else {
                    attributeName = 'data-scrapy-ignore-beneath';
                }
                ignore = Ember['default'].$.parseJSON(Ember['default'].$(ignoredElement).attr(attributeName));
                if (!ignore['id']) {
                    ignore = {};
                    Ember['default'].$(ignoredElement).parents().each(function (index, parent) {
                        if (Ember['default'].$(parent).attr('data-scrapy-annotate')) {
                            ignore['id'] = Ember['default'].$.parseJSON(Ember['default'].$(parent).attr('data-scrapy-annotate'))['id'];
                            Ember['default'].$(ignoredElement).attr(attributeName, JSON.stringify(ignore));
                            return false;
                        }
                    });
                }
            });
        },

        _prepareToSave: function _prepareToSave() {
            var ignoredElements = this.get('iframe').findIgnoredElements();
            ignoredElements.removeAttr('data-scrapy-ignore');
            ignoredElements.removeAttr('data-scrapy-ignore-beneath');
            var annotatedElements = this.get('iframe').findAnnotatedElements();
            annotatedElements.each((function (i, element) {
                Ember['default'].$(element).attr('data-scrapy-annotate', null);
            }).bind(this));
        },

        saveAll: function saveAll(annotations) {
            this._prepareToSave();
            annotations.forEach((function (annotation) {
                annotation.get('ignores').forEach(function (ignore) {
                    var attrName = ignore.get('ignoreBeneath') ? 'data-scrapy-ignore-beneath' : 'data-scrapy-ignore';
                    Ember['default'].$(ignore.get('element')).attr(attrName, 'true');
                });
                Ember['default'].$(annotation.get('element')).attr('data-scrapy-annotate', JSON.stringify(annotation.serialize()));
            }).bind(this));
        }
    });

});
define('portia-web/utils/canvas', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    var Canvas = Ember['default'].Object.extend({

        canvasId: null,

        canvas: null,

        context: null,

        init: function init() {
            this.set('canvas', Ember['default'].$('#' + this.get('canvasId')).get(0));
            this.set('context', this.get('canvas').getContext('2d'));
        },

        /**
            Clears the canvas.
        */
        clear: function clear() {
            var canvas = this.get('canvas');
            var context = this.get('context');
            context.clearRect(0, 0, canvas.width, canvas.height);
        },

        /**
            Draws the given sprites translating the context by (xOffset, yOffset)
            to compensate for the iframe current scroll position.
        */
        draw: function draw(sprites, xOffset, yOffset) {
            var canvas = this.get('canvas');
            var context = this.get('context');

            // Match intrinsic and extrinsic dimensions.
            canvas.width = Ember['default'].$(canvas).outerWidth();
            canvas.height = Ember['default'].$(canvas).outerHeight();

            context.translate(-xOffset, -yOffset);
            context.clearRect(0, 0, canvas.width, canvas.height);
            var sortedSprites = sprites.sort(function (a, b) {
                return a.get('zPosition') - b.get('zPosition');
            });
            sortedSprites.forEach(function (sprite) {
                sprite.draw(context);
            });
        },

        _interactionsBlocked: false,

        /**
            By default the canvas is configured to let all events pass through.
            Set this attribute to true to block interactions with the underlaying
            layers.
        */
        interactionsBlocked: (function (key, interactionsBlocked) {
            if (arguments.length > 1) {
                this.set('_interactionsBlocked', interactionsBlocked);
                var canvas = Ember['default'].$('#' + this.get('canvasId'));
                if (interactionsBlocked) {
                    canvas.css('pointer-events', 'auto');
                    canvas.css('background-color', 'rgba(0,0,30,0.2)');
                    canvas.css('background', '-webkit-radial-gradient(circle, rgba(0,0,0,0.0), rgba(0,0,0,0.6)');
                    canvas.css('background', '-moz-radial-gradient(circle, rgba(0,0,0,0.0), rgba(0,0,0,0.6)');
                } else {
                    canvas.css('pointer-events', 'none');
                    canvas.css('background-color', 'rgba(0,0,0,0)');
                    canvas.css('background', 'rgba(0,0,0,0)');
                }
            } else {
                return this.get('_interactionsBlocked');
            }
        }).property('_interactionsBlocked')

    });

    var Sprite = Ember['default'].Object.extend({

        /**
            Sprites with lower zPosition are drawn below sprites with
            higher zPosition.
        */
        zPosition: 0,

        draw: function draw() {
            throw 'You must implement this method.';
        }
    });

    var RECT_ZERO = { left: 0, top: 0, width: 0, height: 0 };

    var RectSprite = Sprite.extend({
        fillColor: 'blue',
        boderWidth: 1,
        strokeColor: 'white',
        hasShadow: false,
        shadowColor: 'black',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 10,
        text: null,
        textColor: 'black',
        rect: null,
        blend: null,
        highlighted: null,
        textBackgroundColor: 'orange',

        draw: function draw(context) {
            this.drawRect(context, this.getBoundingBox());
        },

        drawRect: function drawRect(context, rect) {
            context.save();
            if (this.get('blend')) {
                context.globalCompositeOperation = this.get('blend');
            }
            if (this.get('hasShadow')) {
                context.shadowColor = this.get('shadowColor');
                context.shadowOffsetX = this.get('shadowOffsetX');
                context.shadowOffsetY = this.get('shadowOffsetY');
                context.shadowBlur = this.get('shadowBlur');
            }

            context.fillStyle = this.get('fillColor');
            context.fillRect(rect.left, rect.top, rect.width, rect.height);
            context.restore();

            context.lineWidth = this.get('boderWidth');
            context.strokeStyle = this.get('strokeColor');
            if (this.get('highlighted')) {
                context.shadowColor = 'orange';
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.shadowBlur = 5;
                context.lineWidth = 2;
                context.strokeStyle = 'orange';
            }
            context.strokeRect(rect.left, rect.top, rect.width, rect.height);
            context.shadowColor = 'transparent';

            if (this.get('text')) {
                context.font = '12px sans-serif';
                var textWidth = context.measureText(this.get('text')).width;
                context.fillStyle = this.get('textBackgroundColor');
                if (!this.get('highlighted')) {
                    context.globalAlpha = 0.5;
                }
                context.fillRect(rect.left, rect.top - 18, textWidth + 11, 18);
                context.fillRect(rect.left, rect.top - 1, rect.width, 2);
                context.fillStyle = this.get('textColor');
                context.globalAlpha = 1;
                context.fillText(this.get('text'), rect.left + 6, rect.top - 4);
            }
            context.restore();
        }
    });

    var AnnotationSprite = RectSprite.extend({
        annotation: null,
        fillColor: 'rgba(88,150,220,0.4)',
        strokeColor: 'rgba(88,150,220,0.4)',
        hasShadow: false,
        textColor: 'white',
        _zPosition: 0,

        text: (function () {
            return this.get('annotation.name');
        }).property('annotation.name'),

        highlighted: (function () {
            return this.get('annotation.highlighted');
        }).property('annotation.highlighted'),

        getBoundingBox: function getBoundingBox() {
            if (this.get('annotation.element')) {
                return Ember['default'].$(this.get('annotation.element')).boundingBox();
            } else {
                return RECT_ZERO;
            }
        },

        zPosition: (function (key, zPos) {
            if (arguments.length > 1) {
                this.set('_zPosition', zPos);
            }
            if (this.get('annotation.highlighted')) {
                return 1000;
            } else {
                return this.get('_zPosition');
            }
        }).property('annotation.highlighted')
    });

    var IgnoreSprite = RectSprite.extend({
        ignore: null,
        fillColor: 'black',
        strokeColor: 'rgba(255, 0, 0, 0.4)',
        textColor: 'rgba(255,150,150,1)',
        blend: 'destination-out',

        ignoreBeneath: (function () {
            return this.get('ignore.ignoreBeneath');
        }).property('ignore.ignoreBeneath'),

        text: (function () {
            return this.get('ignore.name');
        }).property('ignore.name'),

        highlighted: (function () {
            return this.get('ignore.highlighted');
        }).property('ignore.highlighted'),

        draw: function draw(context) {
            var element = Ember['default'].$(this.get('ignore.element'));
            if (this.get('ignoreBeneath')) {
                var elementsBeneath = element.nextAll();
                elementsBeneath.each((function (i, element) {
                    this.drawRect(context, Ember['default'].$(element).boundingBox());
                }).bind(this));
            }
            this.drawRect(context, element.boundingBox());
        }
    });

    var ElementSprite = RectSprite.extend({
        element: null,
        fillColor: 'rgba(103,175,255,0.4)',
        strokeColor: 'white',
        hasShadow: false,
        boderWidth: 2,
        zPosition: 10,

        getBoundingBox: function getBoundingBox() {
            return Ember['default'].$(this.get('element')).boundingBox();
        }
    });

    exports.Canvas = Canvas;
    exports.Sprite = Sprite;
    exports.RECT_ZERO = RECT_ZERO;
    exports.RectSprite = RectSprite;
    exports.AnnotationSprite = AnnotationSprite;
    exports.IgnoreSprite = IgnoreSprite;
    exports.ElementSprite = ElementSprite;

});
define('portia-web/utils/messages', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Object.create({
        // Inline help messages.
        overlay_blocked_links: 'Enable this options to highlight links not followed at crawl time in red and followed links in green.',
        follow_links: 'Links that match any of the regular expressions in this list will be followed (they should also be in the same domain of one of the start pages).',
        exclude_links: 'Links that match any of the regular expressions in this list will be excluded.',
        perform_login: 'Select this option if the site you are crawling requires login credentials.',
        template_required: 'This setting is equivalent to marking the fields as required in the item definition, but limiting the scope to this sample only. <div class="alert alert-info"><span class="fa fa-icon fa-info-circle"></span> Only extracted fields can be set as required.</div>',
        extractors: 'With <b>regular expression extractors</b>, the extracted data is matched against the specified expression and replaced by the match group enclosed between parentheses. If there is no match, the field is not extracted.<br/><br/><b>Type extractors</b> override the type specified in the item definition.',
        select_item: 'You can choose what item type is extracted by this sample using the combobox. You can also create and modify items by clicking on the Edit Items button.',
        variant: 'By selecting a different variant than <b>Base(0)</b> in your annotation, the resulting extracted data will be assigned to the base item special field variants, which is a list of objects similar to an item.',
        ignored_subregions: 'Allows you to define subregions that should be excluded from the extraction process.',
        selected_region_ancestors: 'Refine your selection by navigating its ancestors.',
        selected_region_children: 'Refine your selection by navigating its children.',
        sticky_fields: 'Required attributes are not extracted, but they must be present for a page to match the sample.',
        annotation_widget: 'Select the attribute you want to extract and an item field to map it. <br/><br/>Choose <b>-just required-</b> to indicate that the sample must match a particular feature without generating any extracted data. <br/><br/> You can create new fields by clicking the <b>+ field button</b> or by seleting the <b>-create new-</b> option from the <b>field</b> combobox.',

        // Other messages.
        confirm_change_selection: 'If you select a different region you will lose all current attribute mappings and ignored subregions, proceed anyway?',
        no_items_extracted: 'No items were extracted',
        publish_ok: 'The project was successfully published.',
        publish_ok_schedule: 'The project was successfully published. Do you want to be redirected to the schedule page?',
        deploy_ok: 'The project was successfully deployed.',
        deploy_ok_schedule: 'The project was successfully deployed. Do you want to be redirected to the schedule page?',
        publish_conflict: 'There was a conflict that could not be automatically resolved. You will have to resolve the conflict manually.',
        conflicts_solved: 'You have resolved all conflicts, your changes have been published.'
    });

});
define('portia-web/utils/modal-manager', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Object.extend({
    add: function add(_, modalInstance) {
      return this.set('name', modalInstance);
    },

    remove: function remove() {
      return this.set('name', null);
    },

    open: function open(name, title, footerButtons, content, component, componentData, controller, fade) {
      if (this.get('name')) {
        return;
      }
      var cl = controller.container.lookup('component-lookup:main'),
          modalComponent = cl.lookupFactory('bs-modal', controller.get('container')).create();
      modalComponent.setProperties({
        name: name,
        title: title,
        manual: true,
        footerButtons: footerButtons,
        targetObject: controller,
        fade: fade,
        body: content,
        component: component,
        componentData: componentData,
        templateName: 'components/bs-modal'
      });
      this.add(name, modalComponent);
      return modalComponent.appendTo(Ember['default'].$('body'));
    }
  });

});
define('portia-web/utils/notification-manager', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    var NotificationManager = Ember['default'].Object.create({
        content: Ember['default'].A(),

        add: function add(options) {
            /*
                properties:
                    title (optional),
                    message,
                    type (optional): info (default), warning, success, danger
            */
            var notification = Ember['default'].Object.create(options);
            return this.get('content').pushObject(notification);
        }
    });

    exports['default'] = NotificationManager;

});
define('portia-web/utils/slyd-api', ['exports', 'ember', 'ic-ajax', 'portia-web/mixins/application-utils', 'portia-web/models/spider', 'portia-web/models/template', 'portia-web/models/item', 'portia-web/models/item-field', 'portia-web/models/extractor', 'portia-web/config/environment'], function (exports, Ember, ajax, ApplicationUtils, Spider, Template, Item, ItemField, Extractor, config) {

    'use strict';

    var SlydApi = Ember['default'].Object.extend(ApplicationUtils['default'], {
        getApiUrl: function getApiUrl() {
            return (config['default'].SLYD_URL || window.location.protocol + '//' + window.location.host) + '/projects';
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

        projectSpecUrl: (function () {
            return this.getApiUrl() + '/' + this.project + '/spec/';
        }).property('project'),

        botUrl: (function () {
            return this.getApiUrl() + '/' + this.project + '/bot/';
        }).property('project'),

        /**
        @public
         Fetches project names.
         @method getProjectNames
        @for this
        @return {Promise} a promise that fulfills with an {Array} of project names.
        */
        getProjectNames: function getProjectNames() {
            var hash = {};
            hash.type = 'GET';
            hash.url = this.getApiUrl();
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        createProject: function createProject(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'create', args: [projectName] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        deleteProject: function deleteProject(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'rm', args: [projectName] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        renameProject: function renameProject(oldProjectName, newProjectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'mv', args: [oldProjectName, newProjectName] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        getSpiderNames: function getSpiderNames() {
            var hash = {};
            hash.type = 'GET';
            hash.url = this.get('projectSpecUrl') + 'spiders';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        loadSpider: function loadSpider(spiderName) {
            var hash = {};
            hash.type = 'GET';
            hash.url = this.get('projectSpecUrl') + 'spiders/' + (spiderName || this.get('spider'));
            return this.makeAjaxCall(hash).then(function (spiderData) {
                spiderData['name'] = spiderName || this.get('spider');
                spiderData['templates'] = spiderData['templates'].map(function (template) {
                    // Assign a name to templates. This is needed as Autoscraping templates
                    // are not named.
                    if (Ember['default'].isEmpty(template['name'])) {
                        template['name'] = this.shortGuid();
                    }
                    return Template['default'].create(template);
                });
                return Spider['default'].create(spiderData);
            }, function (err) {
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
        loadTemplate: function loadTemplate(spiderName, templateName) {
            var hash = {};
            hash.type = 'GET';
            hash.url = this.get('projectSpecUrl') + 'spiders/' + (spiderName || this.get('spider')) + '/' + templateName;
            return this.makeAjaxCall(hash).then(function (templateData) {
                return Template['default'].create(templateData);
            }, function (err) {
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
        renameSpider: function renameSpider(oldSpiderName, newSpiderName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.get('projectSpecUrl') + 'spiders';
            hash.data = { cmd: 'mv', args: [oldSpiderName || this.get('spider'), newSpiderName] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        renameTemplate: function renameTemplate(spiderName, oldTemplateName, newTemplateName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.get('projectSpecUrl') + 'spiders';
            hash.data = { cmd: 'mvt', args: [spiderName || this.get('spiderName'), oldTemplateName, newTemplateName] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        saveSpider: function saveSpider(spider, excludeTemplates) {
            var hash = {};
            hash.type = 'POST';
            var spiderName = spider.get('name'),
                serialized = spider.serialize();
            if (excludeTemplates) {
                delete serialized['templates'];
            }
            hash.data = serialized;
            hash.dataType = 'text';
            hash.url = this.get('projectSpecUrl') + 'spiders/' + spiderName;
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        saveTemplate: function saveTemplate(spiderName, template) {
            var hash = {};
            hash.type = 'POST';
            var templateName = template.get('name'),
                serialized = template.serialize();
            if (template.get('_new')) {
                serialized['original_body'] = template.get('original_body');
                template.set('_new', false);
            }
            hash.data = serialized;
            hash.dataType = 'text';
            hash.url = this.get('projectSpecUrl') + 'spiders/' + (spiderName || this.get('spider')) + '/' + templateName;
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        deleteSpider: function deleteSpider(spiderName) {
            var hash = {};
            hash.type = 'POST';
            hash.dataType = 'text';
            hash.url = this.get('projectSpecUrl') + 'spiders';
            hash.data = { cmd: 'rm', args: [spiderName || this.get('spider')] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to delete spider';
                throw err;
            });
        },

        /**
        @public
         Copies existing spiders and/or items.
         @method copySpider
        @for this
        @param {String} [srcProjectId] The id of the project to copy from.
        @param {String} [dstProjectId] The id of the project to copy to.
        @param {Array} [spiderNames] An array of {String} names of the spiders to copy.
        @param {Array} [itemNames]  An array of {String} names of the items to copy.
        @return {Promise} a promise that fulfills when the server responds.
        */
        copySpider: function copySpider(srcProjectId, dstProjectId, spiderNames, itemNames) {
            var hash = {};
            hash.type = 'POST';
            hash.dataType = 'json';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'copy', args: [srcProjectId, dstProjectId, spiderNames, itemNames] };
            return this.makeAjaxCall(hash);
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
        deleteTemplate: function deleteTemplate(spiderName, templateName) {
            var hash = {};
            hash.type = 'POST';
            hash.dataType = 'text';
            hash.url = this.get('projectSpecUrl') + 'spiders';
            hash.data = { cmd: 'rmt', args: [spiderName || this.get('spider'), templateName] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        loadItems: function loadItems() {
            var hash = {};
            hash.type = 'GET';
            hash.url = this.get('projectSpecUrl') + 'items';
            return this.makeAjaxCall(hash).then((function (items) {
                items = this.dictToList(items, Item['default']);
                items.forEach((function (item) {
                    if (item.fields) {
                        item.fields = this.dictToList(item.fields, ItemField['default']);
                    }
                }).bind(this));
                return items;
            }).bind(this), function (err) {
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
        saveItems: function saveItems(items) {
            items = items.map((function (item) {
                item = item.serialize();
                if (item.fields) {
                    item.fields = this.listToDict(item.fields);
                }
                return item;
            }).bind(this));
            items = this.listToDict(items);
            var hash = {};
            hash.type = 'POST';
            hash.data = items;
            hash.dataType = 'text';
            hash.url = this.get('projectSpecUrl') + 'items';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        loadExtractors: function loadExtractors() {
            var hash = {};
            hash.type = 'GET';
            hash.url = this.get('projectSpecUrl') + 'extractors';
            return this.makeAjaxCall(hash).then((function (extractors) {
                return this.dictToList(extractors, Extractor['default']);
            }).bind(this), function (err) {
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
        saveExtractors: function saveExtractors(extractors) {
            extractors = extractors.map(function (extractor) {
                return extractor.serialize();
            });
            extractors = this.listToDict(extractors);
            var hash = {};
            hash.type = 'POST';
            hash.data = extractors;
            hash.dataType = 'text';
            hash.url = this.get('projectSpecUrl') + 'extractors';
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to save extractors';
                throw err;
            });
        },

        editProject: function editProject(project_name, revision) {
            if (!this.get('serverCapabilities.version_control')) {
                // if the server does not support version control, do
                // nothing.
                return new Ember['default'].RSVP.Promise(function (resolve) {
                    resolve();
                });
            } else {
                revision = revision ? revision : 'master';
                var hash = {};
                hash.type = 'POST';
                hash.url = this.getApiUrl();
                hash.data = { cmd: 'edit', args: [project_name, revision] };
                hash.dataType = 'text';
                return this.makeAjaxCall(hash)['catch'](function (err) {
                    err.title = 'Failed to load project';
                    throw err;
                });
            }
        },

        projectRevisions: function projectRevisions(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'revisions', args: [projectName] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to load project revisions';
                throw err;
            });
        },

        conflictedFiles: function conflictedFiles(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'conflicts', args: [projectName] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to load conflicted files';
                throw err;
            });
        },

        changedFiles: function changedFiles(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'changes', args: [projectName] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to load changed files';
                throw err;
            });
        },

        publishProject: function publishProject(projectName, force) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'publish', args: [projectName, !!force] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to publish project';
                throw err;
            });
        },

        deployProject: function deployProject(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'deploy', args: [projectName] };
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to deploy project';
                throw err;
            });
        },

        discardChanges: function discardChanges(projectName) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'discard', args: [projectName] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
                err.title = 'Failed to discard changes';
                throw err;
            });
        },

        saveFile: function saveFile(projectName, fileName, contents) {
            var hash = {};
            hash.type = 'POST';
            hash.url = this.getApiUrl();
            hash.data = { cmd: 'save', args: [projectName, fileName, contents] };
            hash.dataType = 'text';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        fetchDocument: function fetchDocument(pageUrl, spiderName, parentFp, baseurl) {
            var hash = {};
            hash.type = 'POST';
            var data = { spider: spiderName || this.get('spider'),
                request: { url: pageUrl } };
            if (baseurl) {
                data.baseurl = baseurl;
            }
            if (parentFp) {
                data['parent_fp'] = parentFp;
            }
            hash.data = data;
            hash.url = this.get('botUrl') + 'fetch';
            return this.makeAjaxCall(hash)['catch'](function (err) {
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
        listToDict: function listToDict(list) {
            var dict = {};
            list.forEach(function (element) {
                // Don't modify the original object.
                element = Ember['default'].copy(element);
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
        dictToList: function dictToList(dict, wrappingType) {
            var entries = [];
            var keys = Object.keys(dict);
            keys.forEach(function (key) {
                var entry = dict[key];
                entry['name'] = key;
                if (wrappingType) {
                    entry = wrappingType.create(entry);
                }
                entries.pushObject(entry);
            });
            return entries;
        },

        makeAjaxCall: function makeAjaxCall(hash) {
            var headers = hash.headers || {},
                data = hash.data || {},
                cmd;
            try {
                cmd = data.cmd;
            } catch (_) {
                cmd = '-';
            }
            headers['x-portia'] = [this.get('sessionid'), this.get('timer').totalTime(), this.get('username'), cmd].join(':');
            hash.data = JSON.stringify(hash.data);
            hash.headers = headers;
            return ajax['default'](hash)['catch'](function (reason) {
                var msg = 'Error processing ' + hash.type + ' to ' + hash.url;
                if (hash.data) {
                    msg += '\nwith data ' + hash.data;
                }
                msg += '\n\nThe server returned ' + reason.textStatus + '(' + reason.errorThrown + ')' + '\n\n' + reason.jqXHR.responseText;
                var err = new Error(msg);
                err.name = 'HTTPError';
                err.status = reason.jqXHR.status;
                err.reason = reason;
                if (reason.jqXHR.getResponseHeader('Content-Type') === 'application/json') {
                    err.data = Ember['default'].$.parseJSON(reason.jqXHR.responseText);
                }
                throw err;
            });
        }
    });

    exports['default'] = SlydApi;

    exports.SlydApi = SlydApi;

});
define('portia-web/utils/sprite-store', ['exports', 'ember', 'portia-web/utils/canvas'], function (exports, Ember, canvas) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend({

        init: function init(options) {
            options = options || this.getWithDefault('options', {});
            var fillColor = options.fillColor || 'rgba(88,150,220,0.4)',
                strokeColor = options.strokeColor || 'rgba(88,150,220,0.4)',
                textColor = options.textColor || 'white';
            this.set('fillColor', fillColor);
            this.set('strokeColor', strokeColor);
            this.set('textColor', textColor);
            this.set('_sprites', []);
            this.set('_ignores', []);
            this.set('_elements', []);
        },

        sprites: (function () {
            var arr = this.get('_sprites').map(function (s) {
                if (s.element) {
                    return canvas.AnnotationSprite.create({
                        annotation: s,
                        fillColor: s.fillColor,
                        strokeColor: s.strokeColor,
                        textColor: s.textColor
                    });
                } else {
                    return null;
                }
            }).concat(this.get('_ignores').map(function (s) {
                if (s.element) {
                    return canvas.IgnoreSprite.create({
                        ignore: s,
                        fillColor: s.fillColor,
                        strokeColor: s.strokeColor,
                        textColor: s.textColor
                    });
                } else {
                    return null;
                }
            }));
            return arr.filter(function (s) {
                if (s) {
                    return true;
                }
            });
        }).property('_sprites.@each', '_ignores.@each'),

        addSprite: function addSprite(element, text) {
            var updated = false;
            this.get('_sprites').forEach(function (sprite) {
                if (Ember['default'].$(sprite.element).get(0) === element) {
                    sprite.set('name', text);
                    updated = true;
                }
            });
            if (updated) {
                this.notifyPropertyChange('_sprites');
            } else {
                this.get('_sprites').pushObject(Ember['default'].Object.create({
                    name: text,
                    element: element,
                    highlight: false,
                    fillColor: this.get('fillColor'),
                    strokeColor: this.get('strokeColor'),
                    textColor: this.get('textColor')
                }));
            }
        },

        addIgnore: function addIgnore(element, ignoreBeneath) {
            var updated = false;
            this.get('_ignores').forEach(function (sprite) {
                if (Ember['default'].$(sprite.element).get(0) === element) {
                    sprite.set('ignoreBeneath', ignoreBeneath);
                    updated = true;
                }
            });
            if (updated) {
                this.notifyPropertyChange('_ignores');
            } else {
                this.get('_ignores').pushObject(Ember['default'].Object.create({
                    element: element,
                    highlight: false,
                    ignoreBeneath: ignoreBeneath,
                    fillColor: this.get('fillColor'),
                    strokeColor: this.get('strokeColor'),
                    textColor: this.get('textColor')
                }));
            }
        },

        highlight: function highlight(element) {
            this.get('_sprites').forEach(function (sprite) {
                if (Ember['default'].$(sprite.element).get(0) === element) {
                    sprite.set('highlighted', true);
                }
            });
            this.notifyPropertyChange('_sprites');
        },

        removeHighlight: function removeHighlight(element) {
            this.get('_sprites').forEach(function (sprite) {
                if (Ember['default'].$(sprite.element).get(0) === element) {
                    sprite.set('highlighted', false);
                }
            });
            this.notifyPropertyChange('_sprites');
        },

        removeSprite: function removeSprite(element) {
            this.set('_sprites', this.get('_sprites').filter(function (sprite) {
                if (sprite.element !== element) {
                    return true;
                }
            }));
        },

        removeIgnore: function removeIgnore(element) {
            this.set('_ignores', this.get('_ignores').filter(function (ignore) {
                if (ignore.element !== element) {
                    return true;
                }
            }));
        }
    });

});
define('portia-web/utils/timer', ['exports', 'ember'], function (exports, Ember) {

    'use strict';

    exports['default'] = Ember['default'].Object.extend({
        init: function init() {
            this.set('_startTime', new Date());
        },

        totalTime: function totalTime() {
            return parseInt((new Date() - this.get('_startTime') - this.getWithDefault('_pausedTime', 0)) / 1000);
        },

        pause: function pause() {
            if (this.get('paused')) {
                // Avoid overwriting pause if called twice without resume
                return;
            }
            this.set('paused', new Date());
        },

        resume: function resume() {
            if (!this.get('paused')) {
                return;
            }
            var paused = this.getWithDefault('_pausedTime', 0),
                pausedAt = this.get('paused');
            paused = paused + (new Date() - pausedAt);
            this.set('_pausedTime', paused);
            this.set('paused', null);
        }
    });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('portia-web/config/environment', ['ember'], function(Ember) {
  var prefix = 'portia-web';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("portia-web/tests/test-helper");
} else {
  require("portia-web/app")["default"].create({});
}

/* jshint ignore:end */
