.. _items:

=====
Items
=====

An item refers to a single item of data scraped from the target website. A common example of an item would be a product for sale on an e-commerce website. It's important to differentiate **item** and **item definition**. In Portia, an item definition or item type refers to the schema of an item rather than the item itself. For example, ``book`` would be an item definition, and a specific book scraped from the website would be an item. An item definition consists of multiple fields, so using the example of a product you might have fields named ``name``, ``price``, ``manufacturer`` and so on. We use annotations to extract data from the page into each of these fields.

To ensure certain fields are extracted, you can set the **Required** flag on each required field and Portia will discard an item if any required fields are missing. Portia will also remove any duplicate items by default.

In some cases you may have fields where the value can vary despite being the same item, in which case you can mark them as **Vary**. This will ignore the field when checking for duplicates. It’s important to only use **Vary** when necessary, as misuse could easily lead to duplicate items being stored. The ``url`` field is a good example of where **Vary** is useful, as the same item may have multiple URLs. If the ``url`` field wasn’t marked as **Vary**, each duplicate item would be seen as unique because its URL would be different.

Field types
===========

You can set a field's type to ensure it will only match that kind of data. The following field types are available:

.. raw:: html

    <table>
        <tbody>
            <tr>
                <td>text</td>
                <td>Plain text. Any markup is stripped and text within nested elements is also extracted.</td>
            </tr>
            <tr>
                <td>number</td>
                <td>A numeric value e.g. 7, 9.59</td>
            </tr>
            <tr>
                <td>image</td>
                <td>An image URL. In most cases you will want to map an ``img`` element's ``src`` attribute.</td>
            </tr>
            <tr>
                <td>price</td>
                <td>The same as ``number``, a numeric value.</td>
            </tr>
            <tr>
                <td>raw html</td>
                <td>Non-sanitized HTML.</td>
            </tr>
            <tr>
                <td>safe html</td>
                <td>Sanitized HTML. See below for more details.</td>
            </tr>
            <tr>
                <td>geopoint</td>
                <td>The same as ``text``.</td>
            </tr>
            <tr>
                <td>url</td>
                <td>A URL.</td>
            </tr>
            <tr>
                <td>date</td>
                <td>A date value parsed by [dateparser](https://github.com/scrapinghub/dateparser). This won't work if the annotated element includes non-date text, in which case you should use partial annotations.</td>
            </tr>
        </tbody>
    </table>


The ``safe html`` field type keeps the following elements: ``br``, ``p``, ``big``, ``em``, ``small``, ``strong``, ``sub``, ``sup``, ``ins``, ``del``, ``code``, ``kbd``, ``samp``, ``tt``, ``var``, ``pre``, ``listing``, ``plaintext``, ``abbr``, ``acronym``, ``address``, ``bdo``, ``blockquote``, ``q``, ``cite``, ``dfn``, ``table``, ``tr``, ``th``, ``td``, ``tbody``, ``ul``, ``ol``, ``li``, ``dl``, ``dd``, ``dt``.

All elements are discarded, with the exception of header tags (``h1``, ``h2`` ... ``h6``) and ``b`` which are replaced with ``strong``, and ``i`` which is replaced with ``em``. Whitelisted elements contained within non-whitelisted elements will still be retained, with the exception of elements contained within a ``script``, ``img`` or ``input`` element. For example, ``<div><code>example</code></div>`` would extract to ``<code>example</code>``, whereas ``<script><code>example</code></script>`` would be discarded completely.
