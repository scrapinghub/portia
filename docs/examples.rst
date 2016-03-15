.. _examples:

========
Examples
========

Crawling paginated listings
===========================

Most e-commerce sites use pagination to spread results across multiple pages.

When crawling these sites with Portia, there are some best practices you should follow:

	* Use the target categories as start pages.
	* Use follow patterns to limit Portia to only visit category and article pages.

This will prevent Portia from visiting unnecessary pages so you can crawl the items a lot faster.

Let's use `timberlandonline.co.uk <http://www.timberlandonline.co.uk>`_ as an example. Say you want to only scrape products from the `boots <http://www.timberlandonline.co.uk/en/men-footwear-boots>`_ and `shoes <http://www.timberlandonline.co.uk/en/men-footwear-shoes>`_ categories. You can `create a spider <getting-started>`_ and add the categories to its start URLs:

.. image:: _static/portia-start-urls.png
	:alt: Start URLs

To ensure the spider only visits relevant pages, you'll need to limit crawling to the target categories and product pages. You can accomplish this defining URL follow patterns in the Link Crawling configuration of your spider:

.. image:: _static/portia-follow-patterns.png
	:alt: Follow patterns

You can use follow patterns to filter URLs with `regular expressions <https://en.wikipedia.org/Regular_expressions>`_. You can see which links will be followed by clicking the |icon-toggle-links| button (toggle highlighting) to the right of Portia's URL bar. Followed links will be highlighted in green and excluded links in red.

.. |icon-toggle-links| image:: _static/portia-icon-add-repeat.png
    :width: 16px
    :height: 16px

As you can see above, the spider will now only visit the boots and shoes category pages and their product listings. To ensure that only products belonging to the target categories are visited, we filter against the ``catID`` parameter value in the URL.

Crawling listings in this manner is much more efficient. You avoid visiting tons of unwanted pages on the site and instead crawl only those you need.

Selecting elements with CSS and XPath
=====================================

You can select elements with CSS or XPath by changing the selection mode of an annotation. You can do it clicking the |cog-symbol| symbol right to the annotation name in the ``ITEMS`` section of the left sidebar.

.. image:: _static/portia-change-selection-mode.png
    :alt: Changing the selection mode of an annotation.

This way, you can tweak your selections, making them more or less specific, for example.

.. |cog-symbol| unicode:: 0x2699

Extracting a single attribute to multiple fields
================================================

Portia supports multiple annotations for the same attribute. You can take advantage of this to extract an attribute to multiple fields by simply creating an annotation for each field.

Scraping multiple items from a single page
==========================================

You'll often need to retrieve several items from a single page. You can do this using either the repeating element tool or with the wand by annotating the first item's element and then clicking the second item's element. Portia will detect all similar items on the page and create annotations for each of them.

Let's revisit the `timerberlandonline.co.uk <http://www.timberlandonline.co.uk>`_ spider and demonstrate this process by annotating a couple of pairs of shoes.

Click the tiles icon to select the repeating element tool and then click an element, and Portia will find all similar elements and link them to the same field:

.. image:: _static/portia-multi-preview.png
	:alt: Start URLs

Now you just need to do same for the other fields, and you're done!