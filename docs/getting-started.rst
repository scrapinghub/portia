.. _getting-started:

Getting started
===============

If you don't have Portia running yet, please read the :ref:`Installation guide <installation>` first.

Creating a project and spider
-----------------------------

To create a new project, begin by entering the site's URL in the navigation bar at the top of the page and clicking ``Start``. Portia can be used as a web browser, and you can navigate to pages you want to extract data from and create new samples. Clicking ``Start`` should create a new project along with a spider for the website, and you should see the loaded web page:

.. image:: _static/portia-new-project.png
    :alt: Newly created project

The spider can be configured on the right. The start pages are the URLs the spider will visit when beginning a new crawl. To define the data you wish to extract from the page, click the ``Annotate this page`` button, which will create a new sample and allow you to annotate the page.

Annotating a page
-----------------

.. image:: _static/portia-annotation.png
    :alt: Annotating the page

You will now be able to define annotations by highlighting or clicking elements on the page. When annotating, a context menu will appear allowing you to map an element's attribute or content to a particular item field. Should you want to add a new item field without having to go into the item editor, you can use the ``-create new-`` option in the field drop down to create a new field. If you want to mark an element as having to exist on the page without storing its data, you can select ``-just required-`` instead of a field. It's important to note when using ``-just required-``, only the existence of the element will be checked rather than its content.

.. image:: _static/portia-item-editor.png
    :alt: Items editor

Once you are finished annotating, you can then mark any fields that are required by going into the item editor under ``Extracted item``. As mentioned earlier, if the item appears in several locations and some fields differ despite being the same item, you can also tick ``Vary`` on any relevant fields to exclude them from being used to detect duplicate items.

.. image:: _static/portia-extracted-items.png
    :alt: Extracted items will be shown on the page

You can now confirm that your sample works by clicking ``Continue browsing``. The page should reload and a pop-up should appear showing you the items extracted from the page. When visiting a page in Portia, the whole extraction process is performed with the spider with the set of currently defined samples. This allows you to check that data will be extracted from the page before running the spider against the whole website.

If you have created a sample around one page where the data extracts successfully, but you visit a similar page and no item is extracted, then it's likely that particular page has a different layout or some fields missing. In this case you would simply click ``Annotate this page`` again to create a new sample for the page, and then annotate it the same way you had done with the other page. See :ref:`Multiple samples <multiple-samples>` for more details on how multiple samples are used within a single spider.

Once you've confirmed that your spider works and extracts data properly, your project is now ready to :ref:`run <running-spider>` or :ref:`deploy <project-deployment>`.

