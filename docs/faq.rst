.. _faq:

FAQ
===

How do I use Crawlera with Portia?
----------------------------------

Portia spiders are standard Scrapy spiders, so you can enable the `middleware <https://github.com/scrapy-plugins/scrapy-crawlera>`_ in your project's `settings.py`.

Does Portia support AJAX based websites?
----------------------------------------

Yes.

Does Portia work with large JavaScript frameworks like Ember?
-------------------------------------------------------------

Backbone, Angular, and Ember have all been thoroughly tested using Portia, and in most cases should work fine. React based websites aren't supported yet but we're working on it.

Does Portia support sites that require you to log in?
-----------------------------------------------------

Yes, you can set credentials in your spider's crawling configuration.

Does Portia support content behind search forms?
------------------------------------------------

No, but we plan on adding support in the near future.

