.. _getting-started:

Getting Started
===============

.. note:: If you don't have Portia running yet, please read the :ref:`Installation guide <installation>` first. If you're using a hosted version of Portia on a platform like `Scrapinghub <http://scrapinghub.com>`_, you don't need to install anything.

This tutorial will briefly cover how to create a new spider and begin extracting data with Portia.

Creating a project and spider
-----------------------------

Let's start by creating a project. Enter a URL in the navigation bar and click ``New Spider``. This will create a new project and add a new spider for the website. We should see the page rendered, like below:

.. image:: _static/portia-new-project.png
    :alt: Newly created project

We can configure the spider in the toolbox the right. You may notice the URL we entered has been added as a start page. These start pages act as seeds for the crawl and the spider will visit these first. If the site we're using requires JavaScript, we can enable it under the Crawling section.

Now that we've created our spider, we need to define the data we want to extract. We do this using :ref:`samples <samples>`.

Creating a sample
-----------------

Portia acts like a web browser, so we can navigate between pages as we would normally. Let's navigate to a page we want to extract data from and click ``Annotate this page`` to create a sample.

.. image:: _static/portia-annotation.png
    :alt: Annotating the page

A sample is a template of a page made up of annotations. Annotations define what data should be extracted and where to.

We'll come back to annotations in a moment, but first we need to create our item.

Items
-----

An :ref:`item <items>` in Portia is a record of data e.g. a product, a location that's extracted during the crawl. We want to define the schema for the item we're going to be extracting. A field is simply an item's attribute, so for example a book would have a `title` field, an `author` field etc.

Let's define the fields for data we want to extract before annotating. We can do this through the item editor.

.. image:: _static/portia-item-editor.png
    :alt: Items editor

We need to think about the data we want to extract, and add the relevant fields. We can mark fields as required and any items extracted that are missing them will be discarded. Marking fields as vary means they won't be taken into account when checking for duplicates, more on that :ref:`here <items>`.

Now that we've defined the item we want to extract, let's get back to annotating.

Annotating
----------

We create an annotation by clicking an element on the page. We can also highlight text if we only want to extract a portion of text.

A context menu will appear, and here we can map an element's attribute or content to an item field. There are already some fields to choose from as Portia adds a default item when we create a project. We can also create new fields if necessary.

We can select the attribute on the left, in most cases we'll want the ``content``, but for images the ``src`` attribute is selected by default. We can preview the value that'll be extracted to the right.

If we want to extract data that isn't visible in the body, such as data within the ``head`` element, we can click the ``CSS`` button located in the top bar to toggle styling. This will usually force the data to be displayed on the page. If not we can click the grey cog icon to the open the settings and navigate to parent or child elements manually.

Should we want to delete an annotation, we simply click the red trash can icon.

Once we've defined our annotations, we then need to test them.

Testing
-------

.. image:: _static/portia-extracted-items.png
    :alt: Extracted items will be shown on the page

We're done annotating, so let's click ``Continue browsing`` to confirm our sample works. The page will reload and a pop-up will appear showing us what was extracted. Whenever we visit a page, Portia will run the extraction process using the samples we've created. This means we can visit similar pages to ensure that data is being extracted correctly before running the spider against the whole website.

Sometimes our sample will work on one page, but not on similar pages. If this is the case, it's likely the other pages have a different layout or fields missing. For these sites, we should create several samples. Take a look at :ref:`Multiple samples <multiple-samples>` for more details.

Once we've confirmed our spider works and extracts data properly, it's now ready to :ref:`run <running-spider>`.

