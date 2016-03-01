.. _getting-started:

===============
Getting Started
===============

.. note:: If you don't have Portia running yet, please read the :ref:`Installation guide <installation>` first. If you're using a hosted version of Portia on a platform like `Scrapinghub <http://scrapinghub.com>`_, you don't need to install anything.

This tutorial will briefly cover how to create a new spider and begin extracting data with Portia.

Creating a spider
=================

Let's start by creating a project. Enter a URL in the navigation bar and click ``New Spider``. We should see the page rendered like below:

.. image:: _static/portia-new-project.png
    :alt: Newly created project

We can configure the spider on the left. You may notice the URL we entered has been added as a start page. Start pages act as seeds for the crawl and the spider will visit these first. If the site we're using requires JavaScript, we can enable by clicking the cog to the right of the spider in the list and then ticking 'Enable JavaScript'.

Now that we've created our spider, we need to define the data we want to extract. We do this using :ref:`samples <samples>`.

Creating a sample
=================

Portia acts like a web browser, so we can navigate between pages as we would normally. Let's navigate to a page we want to extract data from and click ``New sample`` to create a sample.

.. image:: _static/portia-annotation.png
    :alt: Annotating the page

A sample is a template of a page that consists of :ref:`annotations <what-are-annotations>`. An annotation links a piece of data on the page (an element) to one or more item fields. We'll come back to annotations in a moment, but first we need to create our item.

Items
=====

An :ref:`item <items>` in Portia is a record of data e.g. a product or a listing that's extracted during the crawl. We want to define the schema for the item we're going to be extracting. A field is simply an item's attribute, so for example a book would have a `title` field, an `author` field etc.

Let's define the fields for data we want to extract before annotating. We can do this through the item editor.

.. image:: _static/portia-item-editor.png
    :alt: Items editor

We need to think about the data we want to extract, and add the relevant fields. We can mark fields as required and Portia will discard any items that are missing them. Marking fields as vary means they won't be taken into account when checking for duplicates, more on that :ref:`here <items>`.

Now that we've defined the item we want to extract, let's get back to annotating.

Annotating
==========

To create an annotation, use the wand (|icon-wand|) or select the appropriate tool and click an element on the page. We can access the annotation settings by clicking the gear icon right of the mapped field. Here we can change the attribute we want to extract in the ``Source`` field. Most of the time we'll want the ``content``, but for images the ``src`` attribute is selected by default. We can preview the value that'll be extracted to the right.

If we want to extract data that isn't visible in the body, such as data within the ``head`` element, we can click the ``CSS`` button located in the top bar to toggle styling. This will usually force the data to be displayed on the page. If not we can click the grey cog icon to the open the settings and navigate to parent or child elements manually. We can delete an annotation by clicking the red minus button next to it.

We can ensure our annotations work by making sure the correct data is shown in the ``Extracted items`` list on the right. We may want to visit similar pages to ensure those work too. If our sample works on a few pages but not others, it's likely the other pages have a different layout or fields missing. For these sites, we should create several samples. Take a look at :ref:`Multiple samples <multiple-samples>` for more details.

Once we've confirmed our spider works and extracts data properly, it's now ready to :ref:`run <running-spider>`.
