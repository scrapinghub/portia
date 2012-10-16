=====================
Slybot project format
=====================

This document describes the format used by slybot to store the configuration of
a project and its spiders.

* The format consists of a set of JSON files, laid out in a specific directory
  structure
* All JSON files are encoded in UTF-8 format
* Unless specified as "optional", all attributes are required

Files and structure
===================

The project consists of the following files and structure::

    project.json
    items.json
    extractors.json
    fieldtypes.json
    spiders/spider1.json
    spiders/spider2.json
    spiders/...

project.json
------------

A project object.

items.json
----------

An items object.

extractors.json
---------------

A mapping from extractor ids to extractor objects.

fieldtypes.json
---------------

A mapping from field type name to field type objects.

spiders/NAME.json
-----------------

A spider object.

Object types
============

Summary of object types:

* `Project`_
* `Items`_
* `Item`_
* `Field`_
* `Field Type`_
* `Extractor`_
* `Template`_
* `Spider`_

Project
-------

The project object contains the global project metadata::

	"project": {
	  "name": "Slybot Test Project",
	  "version": "1.0",
	  "comment": ""
	}

Attributes:

name : string
  The project name.

version : string
  Version number of the format.
  
comment : string : optional
  A comment provided by the user.

Items
-----

The items object contains all the item object used in the project, it is
represented as a list of item object::

    "items": [
        item object 1,
        item object 2,
        ...
      ],
    }

Item
----

An item object represents a individual object to be extracted by the
system, i.e: person, job, category, etc.::

    {
      name: "person",
      fields: [
        field object 1,
        field object 2,
      ]
    },

Attributes:

name : string
  The item name.

fields: mapping
  This is a mapping of the field names to the field objects representing
  the properties of this item.

Field
-----

The field represents a property of an object.::

    {
      "name": "first_name",
      "type": "string",
      "required": "true",
      "vary": "true",
    },

Attributes:

type : string
  The field type. It can reference a field type defined in `fieldtypes.json`
  or be one of the following built-in types:

  * safe html
  * string
  * url
  * text
  * image
  * geopoint
  * number
  * raw html
  * raw
  * html page
  * string_markup
  * price

required : boolean
  Whether the field is required to produce a successful match. All required
  fields must extract data, otherwise the extraction is considered to have
  failed and the data is discarded.

vary : boolean
  Whether to ignore this field for duplicate detection. For example, sometimes
  the same product is available under many urls, in which case you would want
  to enable this attribute for the ``url`` field, if you want to drop
  duplicates.

description : string : optional
  Field description.

Field Type
----------

Attributes:

extractor : string?
  The extractor used for this field type. TODO: define how to specify extractor.

adaptor : string?
  The adaptor used for this field types. Unlike extractors, adaptors are applied after extraction has occurred and hence cannot affect the matching process. TODO: how to specify the adaptor (python func, etc).

Spider
------

Attributes:

start_urls : list of strings
  The list of URLs the spider will start crawling from

links_to_follow : string
  Either one of these values:
  
  * ``none``: no links will be followed (only the start urls will be visited)
  * ``patterns``: links will be followed according to the regular expressions in ``follow_patterns`` and ``exclude_patterns`` attributes

follow_patterns : list of strings : optional
  A list of regular expressions that define urls to follow. If empty, it will follow all links. This field is ignored if ``links_to_follow`` is other than ``patterns``.

exclude_patterns : list of strings : optional
  A list of regular expressions that define urls to avoid following. It has
  precedence over ``follow_patterns``.

respect_nofollow : boolean
  Whether to respect `rel=nofollow`_. Defaults to false.
  
templates : list of objects
  A list of templates objects.

Template
--------

Attributes:

page_id : string
  An identifier for the template

page_type : string
  Either one of these values:

  * ``links``: indicates this template contains "links to follow" annotations
  * ``item``: indicates this template contains field annotations. It can also contain "links to follow" annotations.

scrapes : string
  The name of the item this template annotates. It must be defined in `items.json`.

extractors : mapping
  A mapping from field names to extractor ids (which must be defined in `extractors.json`)

url : string
  The URL of the page from which the template was generated from.

annotated_body : string
  The annotated body.

original_body : string
  The original body (without annotations).

Extractor
---------

type_extractor : string : optional
  If defined, it will override the default extractor for the field. For allowed
  values, see the ``type`` attribute in `Field object`.

regular_expression : string : optional
  A regular expression that will be applied to the extracted data, to refine
  its result. It will be applied after the base extractor (either defined in
  the field type or through the ``type_extractor`` attribute).

  The regex must extract at least one group (parenthesis enclosed part), in
  order to be considered a match. The groups matched will be concatenated for
  generating the final result.

Examples
========

This is complete example of an items.json file::

    {
      "items": [
        {
          "name": "person",
          "fields": [
            {
              "name": "first_name", 
              "required": "true", 
              "type": "string", 
              "vary": "true"
            }, 
            {
              "name": "last_name", 
              "required": "true", 
              "type": "string", 
              "vary": "true"
            }
          ]
        },
        {
          "name": "job",
          "fields": [
            {
              "name": "company", 
              "required": "true", 
              "type": "string", 
              "vary": "true"
            }, 
            {
              "name": "position", 
              "required": "true", 
              "type": "string", 
              "vary": "true"
            }
          ]
        }
      ]
    }

TODO
====

* should we combine everything into a single JSON file (like HAR format). It
  could still support excluding certain spiders.

* what about global project metadata, like name or application (and version)
  used to generate the project?

* cleanup built-in field types?

* Template object: change ``page_id`` attribute to ``id``, or ``template_id``?.
  Same for ``page_type``.

* Template page_type: why do we need both ``item`` and ``links``?. What happens
  if a field is required and not extracted, but there are links to follow?

* Template: ``scrapes`` should only be set if page_type=item?

* Extractor: ``type_extractor`` redundant?

* Extractor: refactor to support other extractor types (xpath, python, css) and
  integrate with field types.

* Field type: finish spec and integrate with extractors (after refactoring)

.. _rel=nofollow: http://en.wikipedia.org/wiki/Nofollow
