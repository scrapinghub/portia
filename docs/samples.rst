.. _samples:

Samples
=========

What are samples?
-------------------

When the crawler visits a page, the page is matched against each sample and samples with more annotations take precedence over those with less. If the page matches a sample, data will be extracted using the sample's annotations to yield an item (assuming all required fields are filled). Samples exist within the context of a spider and are made up of annotations which define the elements you wish to extract from a page. Within the sample you define the item you want to extract as well as mark any fields that are required for that item.

What are annotations?
---------------------

An annotation defines the location of a piece of data on the web page and how it should be used by the spider. Typically an annotation maps some element on the page to a particular field of an item, but there is also the option to mark the data as being required without storing the data in an item. It's possible to map attributes of a particular element instead of the content if this is required, for example you can map the ``href`` attribute of an anchor link rather than the text.

Extractors
----------

.. image:: _static/portia-extractors.png
    :alt: Field extractors

You can also add extractors to item fields. Extractors allow you to further refine information extracted from a page using either regexes or a predefined type. For example, let's say there's an element on the page that contains a phone number, but it also contains some other text that you don't need. You could use a regular expression that matches phone numbers and add it as an extractor to the relevant field; upon extracting that field only the phone number would be stored.

You may need to use more than one sample even if you're only extracting a single item type. For example, an e-commerce site may have a different layout for books than it does for audio CDs, so you would need to create a sample for each layout. See :ref:`Multiple samples <multiple-samples>` for more info.

Multiple fields
---------------

It's possible to extract multiple fields using a single annotation if there are several properties you want to extract from an element. For example, if there was an anchor link on the page, you could map the ``href`` attribute containing the URL to one field, and you could map the text to another. You can view a particular annotation's settings by either clicking the cog in the annotation pop-up window or by clicking the cog beside the annotation in the ``Annotations`` section of the sample configuration. Within this context there is an ``Attribute mappings`` section where you can define additional mappings for the selected annotation should you want to map other attributes.

.. _samples-variants:

Variants
--------

It’s common for there to be a single item with a number of variations e.g. different sizes such as small, medium and large. It’s likely that each variation will have its own annotation for one or more fields and you want to keep each variation’s value. In situations like this you can use variants to make sure each value is stored. Each annotation you define has a variant selected, the default being ``Base`` referring to the base item. To assign an annotation to a variant, you simply select the variant you want the annotation to use in its options or under the ``Annotations`` section in the sample settings.

Consider the following scenario where variants would be useful:

You are wanting to scrape an e-commerce website that sells beds, and some beds come in multiple sizes e.g. ``Single``, ``Double``, ``Queen``, ``King``. The product page for each bed has a table of prices for each size, like so:

.. code-block:: html

    <table>
        <tbody>
            <tr>
                <td>Single</td>
                <td>$300</td>
            </tr>
            <tr>
                <td>Double</td>
                <td>$500</td>
            </tr>
            <tr>
                <td>Queen</td>
                <td>$650</td>
            </tr>
            <tr>
                <td>King</td>
                <td>$800</td>
            </tr>
        </tbody>
    </table>

The rest of the data you want to extract (product name, description etc.) is common across all sizes. In this case, you would annotate the common data to the base item and create the fields ``size`` and ``price``. You would then annotate the ``Single`` cell as variant 1 of ``size``, and the ``$300`` cell as variant 1 of ``price``, followed by annotating ``Double`` as variant 2 of ``size``, ``$500`` as variant 2 of ``price`` and so on. It's worth noting that in this case, it wouldn't be necessary to create a variant for each row; usually it is enough to annotate only the first and last row of the table as Portia will automatically create variants for rows in between.

Partial annotations
-------------------

Partial annotations can be used to extract some part of text which exists as part of a common pattern. For example, if an element contained the text ``Price: $5.00``, you could highlight the ``5.00`` part and map it to a field. The ``Price: $`` part would be matched but removed before extracting the field. In order to create a partial annotation, all you need to do is highlight the text the way you would normally, by clicking and dragging the mouse. The annotation window will pop up and you will be able to map it to a field the same way you would with a normal annotation.

There are some limitations to partial annotations. As mentioned in the previous paragraph, the text must be part of a pattern. For example, let's say an element contains the following text::

    Veris in temporibus sub Aprilis idibus habuit concilium Romarici montium

One of the pages visited by the crawler contains the following text in the same element::

    Cui dono lepidum novum libellum arido modo pumice expolitum?

If you had annotated ``Aprilis`` in the sample, nothing would have matched because the surrounding text differs from the content being matched against. However, if the following text had instead appeared in the same element::

    Veris in temporibus sub Januarii idibus habuit concilium Romarici montium

The word ``Januarii`` would have been extracted, because its surrounding text matches the text surrounding the text that was annotated in the sample.

.. _multiple-samples:

Multiple samples
------------------

It's often necessary to use multiple samples within one spider, even if you're only extracting one item type. Some pages containing the same item type may have a different layout or fields missing, and you will need to accommodate those pages by creating a sample for each layout variation.

The more annotations a sample has, the more specific the data being extracted and therefore less chance of a false positive. For this reason, samples with more annotations take precedence over those with less annotations. If a subset of samples contains equal number of annotations per sample, then within that subset samples will be tried in the order they were created from first to last. In other words, samples are tried sequentially in order of number of annotations first, and age second.

If you are working with a large number of samples, it may be difficult to ensure the correct sample is applied to the right page. It's best to keep samples as strict as possible to avoid any false matches. It's useful to take advantage of the ``-just required-`` option and annotate elements that will always appear on matching pages to reduce the number of false positives.

Consider the following example:

We have an item type with the fields ``name``, ``price``, ``description`` and ``manufacturer``, where ``name`` and ``price`` are required fields. We have created a sample with annotations for each of those fields. Upon running the spider, many items are correctly scraped; however, there are a large number of items where the manufacturer field contains the description, and the description field is empty. This has been caused by some pages having a different layout:

Layout A:

.. code-block:: html

    <table>
        <tbody>
            <tr>
                <td>name</td>
                <td>price</td>
            </tr>
            <tr>
                <td colspan="2">manufacturer</td>
            <tr>
            <tr>
                <td colspan="2">description</td>
            </tr>
        </tbody>
    </table>

Layout B:

.. code-block:: html

    <table>
        <tbody>
            <tr>
                <td>name</td>
                <td>price</td>
            </tr>
            <tr>
                <td colspan="2">description</td>
            </tr>
        </tbody>
    </table>

As you can see, the problem lies with the fact that in layout B the description is where manufacturer would be, and with ``description`` not being a required field it means that the sample created for layout A will match layout B. Creating a new sample for layout B won't be enough to fix the problem, as layout A's sample would contain more annotation and be matched against first.

Instead we need to modify layout A's sample, and mark the ``description`` annotation as **Required**. With this added constraint, items displayed with layout B will not be matched against with layout A's sample due to the missing ``description`` field, so the spider will proceed onto layout B's sample which will extract the data successfully.

