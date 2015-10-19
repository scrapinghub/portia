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
    spiders/
       spider1.json
       spider2.json
       ...

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
* `Request`_

Project
-------

The project object contains the global project metadata::

	{
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

The items object contains all the item objects used in the project, it is
represented as a mapping of item ids to items::

    {
        "person": item object 1,
        "job": item object 2,
        ...
    }

Item
----

An item object represents a individual object to be extracted by the
system, i.e: person, job, category, etc.::

    {
        fields: {
            "first_name": field object 1,
            "last_name": field object 2,
        }
    },

Attributes:

display_name: string : optional
  User-friendly name of the item. If not specified, the item id will be used
  instead.

fields : mapping
  This is a mapping of the field names to the field objects representing
  the properties of this item.

Field
-----

The field describes the properties of an item field::

    {
        "type": "string",
        "required": "true",
        "vary": "true",
    },

Attributes:

type : string
  The field type. It can reference a field type defined in `fieldtypes.json`
  or be one of the following built-in types:

  * safe html
  * url
  * text
  * image
  * geopoint
  * number
  * raw html
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

The Spider object is the top-level object that describes a slybot spider::

    {
        "start_urls": list of strings,
        "allowed_domains": list of strings,
        "links_to_follow": string,
        "follow_patterns": list of strings,
        "exclude_patterns": list of strings,
        "respect_nofollow": boolean,
        "templates": list of template objects,
        "init_requests": list of request objects,
    }

Attributes:

start_urls : list of strings
  The list of URLs the spider will start crawling from. Start urls are expected to point to an HTML page, whose links will be followed according to the url filters
  attributes (``allowed_domains``, ``links_to_follow``, etc.). If you need a custom link extraction behavior (for example, if your starting page is a csv or xml feed)
  consider to include a `Start request`_ in ``init_requests`` array.

allowed_domains : list of strings : optional
  The list of domains that can be crawled. If set to an empty list it will allow any domain. If this variable is not set then the list of allowed domains is extracted from the start urls.

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
  A list of template objects.

init_requests : list of request objects : optional
  A list of requests objects that will be executed (sequentially, in order)
  when the spider is opened and before visiting the start urls.

page_actions : list of page action objects : optional
  A list of page actions (like clicking a button or typing text into a field) that will be executed (sequentially) on the page.

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

selectors : mapping
  A mapping from field names to selector objects. If provided when this
  template extracts an item from a response, the selectors will be run on the
  page and results added to the item.

Selector
--------

Attributes:

type : string
  The type of the selector, can be either ``css`` or ``xpath``.

selector : string
  The selector expression

Extractor
---------

Attributes:

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

This is a complete example of an items.json file::

	{
		"person": {
		    "fields": {
			    "first_name": {
				    "required": "true", 
				    "type": "string", 
				    "vary": "true"
				}, 
			    "last_name": {
				    "required": "true", 
				    "type": "string", 
				    "vary": "true"
				}
		    }
		},
		"job": {
		    "fields": {
			    "company": {
				    "required": "true", 
				    "type": "string", 
				    "vary": "true"
				}, 
			    "position": {
				    "required": "true", 
				    "type": "string", 
				    "vary": "true"
				}
		    }
		}
	}

Request
=======

A request object represents a request that will be made by slybot::

    {
        "type": string,
        # ... type-specific arguments ...
    }

Attributes:

type : string
  The type of the request. This is the only attribute that is present in all request types.

Other attributes are available depending on the request type.

Start request
-------------

Used to represent a plain start url::

    {
        "type": "start",
        "url": string,
        "link_extractor": link extractor object,
    }

Attributes:

type : string
    The type of request, which for start requests must be ``start``.

url: string
    The start page URL.

link_extractor : link extractor : optional
  Allow to associate a link extractor object to the request, in order to be applied to its response. If given, the request callback will be constructed using the
  specified link extractor in order to extract links. If not given, the assigned callback will be the spider ``parse`` method, so request will work as if it were a
  single url inside `Spider`_ ``start_urls``.

Login request
-------------

Used to represent a request to perform login::

    {
        "type": "login",
        "loginurl": string,
        "username": string,
        "password": string,
    }


Attributes:

type : string
  The type of request, which for login requests must be ``login``.

loginurl : string
  The login page URL. This is the page containing the login form, not the URL
  where the form data is POSTed.

username : string
  The login username.

password : string
  The login password.

Generic form request
--------------------

Used to represent a request to a generic form::

    {
        "type": "form",
        "form_url": "http://www.mysite.com/search.php",
        "xpath" : "//form[@name=search_form]",
        "fields" : [
            {
                "xpath": "//*[@name=state]",
                "type": "iterate",
                "value": ".*",
            },
            {
                "xpath": "//*[@name=country]",
                "type": "constants",
                "value": ["US"]
            }
        ]
    }

Attributes:

type : string
  The type of request, which for generic form requests must be ``form``.

form_url : string
  The form page URL. This is the page containing the form, not the URL
  where the form data is POSTed.

xpath : string
  A xpath expression to access the form to be posted.

fields : list
  A list of fields to be posted with the form.

Page Action
-----------

Used to represent an action to be performed on a page::

    {
        "type": "click",
        "selector": "#show_more",
        "accept": "/product/[0-9]+",
        "reject": "/product/(0|999)"
    }

Attributes:

type : string
  Either one of these values:
  * ``wait``: Wait for a specified amount of time before continuing
  * ``click``: Click something on the page
  * ``set``: Set a text field or select box value
  * ``scroll``: Scroll an element

timeout : number
  Only when type is ``wait``: Ammount of time to wait

selector : string
  Only when type is ``click``, ``set`` or ``scroll``: CSS selector of the elements to apply the action to. If the selector matches several elements, action is applied to all.

value : string
  Only when type is ``set``: Value to set the field or select box to.

percent : number
  Only when type is ``scroll``: Scroll vertically this percentage of the  page.

accept : regex (optional)
  Only run the  action in pages which URL matches the regex

reject: regex (optional)
  Don't run the action in pages which URL matches the regex

Generic Form Field
------------------

Used to represent a field in a generic form.

Attributes:

xpath : string
  A xpath expression to access the field to be posted.

type : string
  The type attribute defines how the field will be posted, it supports the following values:

    * "constants": Use a list of values defined in the value field.
    * "iterate": Use the option values defined in a select field. The value for this type is a regex expression used to match the options for the select. If empty it will use all the select options.
    * "inurl": Use a list of values obtained from the URL defined in the "value" attribute. The URL must point to a text file with a value per line.

name : string : optional
  If this field is set then it will be used as the option name sent to the server
  overriding the field name. This can be used to submit values for fields not
  present in the form (this is useful in some cases like when the data submitted
  is modified by javascript, i.e in aspx forms).

value : string : optional
  Define the value(s) to be submitted with this field. The sintax of this attribute depends of the field type (see above).
  This attribute supports the use of spider arguments, using the following sintax: {arg1}, this will use the value of the arg1.

Link Extractor
--------------

Defines a link extractor object. Except in the case of ``module`` type, all types configure a base link extractor class. But all link extractors must have
the same interface (see slybot.linkextractor.BaseLinkExtractor)

Attributes:

type : string
  Defines how to interpret the string in the 'value' attribute. Current supported values for this attribute are:

  * ``csv_column`` - value is an integer index indicating a column number. Link source is regarded as csv formatted ``scrapy.http.TextResponse``.
  * ``xpath`` - value is an xpath. Link source is regarded as a ``scrapy.http.XmlResponse``.
  * ``regex`` - value is a regular expression. Link source is regarded as a ``scrapy.http.TextResponse``.
  * ``module`` - value is a python module path. Link source is a ``scrapy.http.Response`` or subclass, depending on implementation requirements.
  * ``html`` - a shortcut for ``module`` type with value ``slybot.linkextractor.HtmlLinkExtractor``. The content of the value attribute is ignored. Source is a ``scrapely.htmlpage.HtmlPage`` object or a ``scrapy.http.HtmlResponse``.
  * ``rss`` - a shortcut for ``xpath`` type with value ``//item/link/text()``. The content of the value attribute is ignored.
  * ``sitemap`` - shortcut for ``xpath`` type with value ``//urlset/url/loc/text()`` and removed namespaces. The content of the value attribute is ignored.
  * ``atom`` - shortcut for ``xpath`` type with value ``//link/@href`` and removed namespaces. The content of the value attribute is ignored.

value : any
  The content is specific to the defined type.

Additional attributes can be given. They are passed as extra keyword argument for the link extractor class constructor. Check ``slybot.linkextractor`` module.

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
