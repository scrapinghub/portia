import Ember from 'ember';

// TODO: Add ids to name fields. Allow for names to be changed them later.

export default Ember.Component.extend({
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

        showCreateField: function() {
            this.setState(true, false, false);
        },

        showAdvanced: function() {
            this.setState(false, true, false);
        },

        showBasic: function() {
            this.setState(false, false, true);
        },

        dismiss: function() {
            this.closeWidget();
        },

        edit: function() {
            this.sendAction('edit', this.get('data'));
        },
        delete: function() {
            this.get('alldata').removeObject(this.get('data'));
            this.get('sprites').removeSprite(this.get('mappedDOMElement'));
            if (this.get('mappedDOMElement').tagName === 'INS') {
                this.get('mappedElement').removePartialAnnotation();
            }
            this.closeWidget();
        },

        updateVariant: function(value) {
            if (value > this.getWithDefault('pluginState.maxVariant', 0)) {
                this.set('pluginState.maxVariant', value);
                this.updateData('pluginState');
            }
            this.set('data.variant', parseInt(value));
        },

        updateField: function(value, index) {
            if (value === '#create') {
                value = null;
                this.set('createNewIndex', index);
                this.setState(true, false, false);
            } else if (value === '#sticky') {
                this.setAttr(index, '#sticky', 'field', true);
            } else {
                this.setAttr(index, value, 'field');
            }
        },

        updateAttribute: function(value, index) {
            this.setAttr(index, value, 'attribute');
        },

        updateRequired: function(value, checked, index) {
            this.setAttr(index, null, null, checked);
        },

        addNewMapping: function() {
            this.addNewMapping();
        },

        removeMapping: function(index) {
            this.removeAnno(index);
        },

        createField: function() {
            var fieldName = this.get('newFieldName'),
                fieldType = this.get('newFieldType');
            if (!fieldName || fieldName.length < 1) {
                return;
            }
            if (!fieldType || fieldType.length < 1) {
                this.set('newFieldType', 'text');
            }
            this.createNewField();
        },

        backToMain: function() {
            this.setState(false, false, true);
            this.set('newFieldName', null);
            this.set('newFieldType', null);
            this.notifyPropertyChange('refreshMapped');
        },

        updateNewFieldName: function(value) {
            if (typeof value === 'string') {
                this.set('newFieldName', value);
            }
        },

        updateNewFieldType: function(value) {
            if (value) {
                this.set('newFieldType', value);
            }
        },

        ignoreElement: function() {
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

        deleteIgnore: function(index) {
            var ignore = this.get('ignores').get(index),
                ignoreData = this.get('alldata').findBy('tagid', ignore.tagid);
            this.get('alldata').removeObject(ignoreData);
            this.get('ignores').removeObject(ignore);
        },

        ignoreBeneath: function(_, value, index) {
            var ignore = this.get('ignores').get(index),
                ignoreData = this.get('alldata').findBy('tagid', ignore.tagid);
            ignore.ignoreBeneath = value;
            ignoreData.ignoreBeneath = value;
        },

        elementHovered: function(data, _, hovered) {
            if (hovered) {
                this.get('document.view').setElementHovered(data.data.element);
            } else {
                this.get('document.view').mouseOutHandler();
            }
        },

        elementClicked: function(data) {
            if (Object.keys(this.get('data.annotations')).length > 0) {
                if (confirm('You have mapped attributes for this Annotation that will be lost if you change this element.\n'+
                            'Do you wish to continue?')) {
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
        elementSelected: function(element) {
            if (this.get('ignoring')) {
                var ignored, jqElem = Ember.$(element),
                    tagid = jqElem.data('tagid'),
                    ignoreData = this.get('alldata').findBy('tagid', tagid);
                if (ignoreData) {
                    ignored = ignoreData;
                } else {
                    ignored = {
                        id: this.s4() + '-' + this.s4() + '-' + this.s4(),
                        tagid,
                        ignore: true,
                        ignore_beneath: false
                    };
                    this.get('alldata').pushObject(ignored);
                }
                this.get('ignores').pushObject({
                    id: ignored.id,
                    tagid: tagid,
                    element: jqElem,
                    ignoreBeneath: ignored.ignore_beneath
                });
                this.get('document.view').config({
                    listener: this.get('previousListener'),
                    partialSelects: true
                });
                this.set('document.view.restrictToDescendants', null);
                this.get('document.view').setInteractionsBlocked(true);
                this.set('ignoring', false);
                this.show();
            }
        },

        elementHovered: function() {
            this.get('document.view').redrawNow();
        },
    },

    //*******************************************************************\\
    //
    //                        Update Annotation
    //
    //*******************************************************************\\

    s4: function() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    },

    createAnnotationData: function(generatedData) {
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
            data.annotations = {content: null};
        }
        return data;
    },

    setAttr: function(index, value, field, required) {
        var annotation = this.getAnnotation(index),
            update = false;
        if (!annotation) {
            return;
        }
        if (field === 'field' && value === '#sticky' &&
                annotation[field] !== '#sticky') {
            var maxSticky = this.getWithDefault('pluginState.maxSticky', 0) + 1,
                sticky = '_sticky' + maxSticky;
            this.set('pluginState.maxSticky', maxSticky);
            this.updateData('pluginState');
            value = sticky;
        }
        if (field && annotation[field] !== value) {
            try {
                annotation.set(field, value);
            } catch(e) {
                annotation[field] = value;
            }
            update = true;
        }
        if (required && !annotation['required']) {
            try {
                annotation.set('required', true);
            } catch(e) {
                annotation['required'] = true;
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

    removeAnno: function(index) {
        var annotation = this.getAnnotation(index);
        if (annotation) {
            this.get('mappings').removeObject(annotation);
            this.updateAnnotations();
        }
    },

    getAttr: function(index, attr) {
        var annotation = this.getAnnotation(index);
        return annotation[attr];
    },

    getAnnotation: function(index) {
        return this.get('mappings').objectAt(index);
    },

    updateAnnotations: function() {
        var annotations = {},
            required = [],
            idMap = this.get('fieldNameIdMap');
        this.get('mappings').forEach(function(annotation) {
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
        this.updateExtractedFields();
        this.notifyPropertyChange('sprite');
    },

    updateExtractedFields: function() {
        var id = this.get('data.id'),
            annotations = this.get('data.annotations'),
            required = this.get('data.required'),
            extracted = this.getWithDefault('pluginState.extracted', [])
                .filter(function(f) {
                    if (f.id && f.id !== id) {
                        return true;
                    }
                });
        for (var key in annotations) {
            var fieldName = annotations[key];
            if (fieldName && fieldName[0] !== '#') {
                extracted.push({
                    id: id,
                    name: fieldName,
                    required: required.indexOf(annotations[key]) > 0
                });
            }
        }
        this.set('pluginState.extracted', extracted);
        this.updateData('pluginState');
    },

    //*******************************************************************\\
    //
    //                    Manage selectboxes fields
    //
    //*******************************************************************\\

    itemFields: function() {
        var fields = this.get('item.fields') || [];
        var options = fields.map(function(field) {
            var name = field.get('name');
            return { value: name, label: name };
        });
        options.pushObject({ value: '#sticky', label: '-just required-' });
        options.pushObject({ value: '#create', label: '-create new-' });
        return options;
    }.property('item.fields.@each'),

    variantList: function() {
        var variants = [{value: 0, label: 'Base'}],
            i = 1,
            maxVariant = this.getWithDefault('pluginState.maxVariant', 0);
        while (i <= maxVariant) {
            variants.push({value: i, label: '#' + i});
            i += 1;
        }
        variants.push({value: i, label: 'Add new: #' + i});
        return variants;
    }.property('pluginState.maxVariant'),

    attributes: function() {
        var mapped = this.get('data.annotations') || {};
        var attrs = (this.get('mappedElement').getAttributeList() || []).mapBy('name');
        return attrs.filter(function(name) {
            if (name in mapped) {
                return false;
            }
            return true;
        });
    }.property('data.annotations'),

    attributeValues: function() {
        var values = {};
        (this.get('mappedElement').getAttributeList() || []).forEach(function(attr) {
            var name = attr.get('name'),
                value = attr.get('value');
            if (('' + attr).length > 0) {
                values[name] = value;
            } else {
                values[name] = '< Empty attribute >';
            }
        });
        return values;
    }.property('data.tagid'),

    parents: function() {
        return this.createHierarchy(this.get('mappedElement').parents(), false);
    }.property('mappedElement'),

    children: function() {
        return this.createHierarchy(this.get('mappedElement').children(), true);
    }.property('mappedElement'),


    //*******************************************************************\\
    //
    //          Highlight and Scroll to elements in document
    //
    //*******************************************************************\\

    mouseEnter: function(event) {
        if (!this.getWithDefault('inDoc', false)) {
            var element = this.get('mappedDOMElement');
            this.get('document.view').scrollToElement(element);
            this.get('sprites').highlight(element);
        }
        event.stopPropagation();
    },

    mouseLeave: function(event) {
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

    hideWidget: function() {
        if (this.get('data') === null ) {
            this.closeWidget();
        }
    }.observes('data'),

    closeWidget: function() {
        this.sendAction('close');
        this.reset();
        this.destroy();
    },

    hide: function() {
        this.$(this.element).css('display', 'none');
    },

    show: function() {
        this.$(this.element).css('display', 'block');
    },

    showAnnotation: function() {
        var data = this.get('data');
        if (data && (data.annotations || data.ignore && this.get('inDoc'))) {
            return true;
        }
        return false;
    }.property('data.ignore', 'data.annotations'),

    updateSprite: function() {
        var text = [],
            data = this.get('data'),
            annotations = this.get('data.annotations');
        if (!data || (data.ignore && !data.annotations)) {
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
    }.observes('sprite'),

    updateIgnore: function() {
        var data = this.get('data');
        if (!data || !data.ignore) {
            return;
        }
        this.get('sprites').addIgnore(this.get('mappedDOMElement'), data.ignore_beneath);
    }.observes('sprite'),

    positionWidget: function() {
        if (this.get('inDoc')) {
            var x = this.get('pos.x'),
                y = this.get('pos.y');
            if (x < 200) {
                x = 100;
            }
            if (x > window.innerWidth - 350) {
                x = window.innerWidth - 350;
            }
            if (y > window.innerHeight - 230) {
                y = window.innerHeight - 230;
            }
            Ember.$(this.get('element')).css({ 'top': Math.max(this.get('pos.y'), 50),
                                         'left': Math.max(this.get('pos.x') - 100, 50)});
            this.get('document.view').setInteractionsBlocked(true);
        }
    },

    //*******************************************************************\\
    //
    //                             Data State
    //
    //*******************************************************************\\

    mappings: function() {
        var mappings = [],
            annotations = this.get('data.annotations'),
            required = this.get('data.required'),
            attributes = this.get('attributeValues'),
            nameMap = this.get('fieldIdNameMap');
        for (var key in annotations) {
            var value = annotations[key],
                annotation = Ember.Object.create({
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
    }.property('data.annotations', 'data.required', 'mappedElement', 'refreshMapped'),

    fieldIdNameMap: function() {
        return this._makeFieldMap('id', 'name');
    }.property('item.fields.@each'),

    fieldNameIdMap: function() {
        return this._makeFieldMap('name', 'id');
    }.property('item.fields.@each'),

    _makeFieldMap: function(from, to) {
        var fields = this.get('item.fields') || [],
            map = {};
        fields.forEach(function(field) {
            map[field.get(from)] = field.get(to);
        });
        return map;
    },

    setData: function() {
        var tagid, annotation, generatedData = {};
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

    mapToElement: function() {
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

    mapToNewElement: function(elem) {
        var jqElem = Ember.$(elem),
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
        this.mapToElement();
        this.get('document.view').scrollToElement(elem);
        this.set('pos', {x: boundingBox.top, y: boundingBox.left});
        this.updateExtractedFields();
        this.positionWidget();
        this.setState(false, false, true);
    },

    //*******************************************************************\\
    //
    //                               Utils
    //
    //*******************************************************************\\

    findGeneratedAnnotation: function() {
        var element = this.get('mappedElement'),
            elem = element.get(0),
            previous_tag = element.prev(),
            insert_after = true, nodes, node;
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
                if (node === null ||
                        (node.nodeType === node.ELEMENT_NODE &&
                         node.tagName !== 'INS')) {
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
        for (var idx=0; idx < nodes.length; idx++) {
            node = nodes[idx];
            if (node.nodeType === node.ELEMENT_NODE &&
                node.tagName === 'INS') {
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

    createHierarchy: function(elements, forward) {
        var elementsArr = [],
            resultArr = [];
        for (var i=0; i < elements.length; i++) {
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
        elementsArr.forEach(function(elem) {
            var jqElem = Ember.$(elem),
                attributes = jqElem.getAttributeList();
            if (attributes.length < 1) {
                return;
            }
            resultArr.push({
                label: jqElem.prop('tagName').toLowerCase(),
                hovered: false,
                separator: Ember.$.inArray(previousElem, jqElem.siblings()) !== -1 ? '' : 'chevron-right',
                data: {
                    element: elem
                }
            });
            previousElem = elem;
        });
        return resultArr;
    },

    topLeftIcon: function() {
        var base = 'fa fa-icon fa-',
            icon = this.get('showingBasic') ? 'cogs' : 'arrow-left';
        return base + icon;
    }.property('showingBasic'),

    topLeftAction: function() {
        return this.get('showingBasic') ? 'showAdvanced' : 'backToMain';
    }.property('showingBasic'),

    createFieldDisabled: function() {
        return (this.get('newFieldName') + '').trim().length < 1;
    }.property('newFieldName'),

    setState: function(field, advanced, basic) {
        this.set('creatingField', field);
        this.set('showingAdvanced', advanced);
        this.set('showingBasic', basic);
    },

    createNewField: function() {
        var fieldName = this.get('newFieldName'),
            fieldType = this.get('newFieldType'),
            attrIndex = this.get('createNewIndex');
        if (fieldName && fieldName.length > 0 && fieldType) {
            this.set('newFieldType', null);
            this.set('newFieldName', null);
            this.set('createNewIndex', null);
            this.sendAction('createField', this.get('item'), fieldName, fieldType);
            this.setAttr(attrIndex, fieldName, 'field');
            this.setState(false, false, true);
        }
    },

    addNewMapping: function() {
        var annotations = this.get('data.annotations'),
            attributes = this.get('attributes');
        if (!annotations || attributes.length < 1) {
            return;
        }
        annotations[attributes.get(0)] = null;
        this.set('data.annotations', annotations);
        this.notifyPropertyChange('data.annotations');
    },

    setPluginStateVariables: function() {
        if (!this.get('pluginState').maxVariant) {
            var maxVariant = 0;
            this.get('alldata').forEach(function(d) {
                var variant = d.variant || 0;
                variant = parseInt(variant);
                maxVariant = variant > maxVariant ? variant : maxVariant;
            });
            this.set('pluginState.maxVariant', maxVariant);
        }
        if (!this.get('pluginState').maxSticky) {
            var maxSticky = 0;
            this.get('alldata').forEach(function(d) {
                for (var key in d.annotations) {
                    var value = d.annotations[key];
                    if (/^_sticky/.test(value)) {
                        var sticky = parseInt(value.substring(7));
                        sticky = sticky < 0 ? 0 : sticky;
                        maxSticky = sticky > maxSticky ? sticky: maxSticky;
                    }
                }
            });
            this.set('pluginState.maxSticky', maxSticky);
        }
        this.updateData('pluginState');
    },

    updateData: function(property) {
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

    setup: function() {
        this.setData();
        this.mapToElement();
        this.updateExtractedFields();
        this.set('ignores', []);
        this.setPluginStateVariables();
        if (this.get('inDoc') && Object.keys(this.get('data.annotations')).length < 1) {
            this.addNewMapping();
        }
    }.on('init'),

    reset: function() {
        this.set('data', null);
        this.set('mappedElement', null);
        this.set('mappedDOMElement', null);
        this.set('ignores', []);
        this.set('fieldName', null);
        this.set('fieldType', null);
        this.set('showingBasic', true);
        this.set('showingAdvanced', false);
        this.set('creatingField', false);
    },

    didInsertElement: function() {
        this.positionWidget();
        this._super();
    },

    willDestroyElement: function() {
        this.get('document.view').setInteractionsBlocked(false);
    },

});
