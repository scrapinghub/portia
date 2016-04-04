from scrapy.http import Response
from scrapy.link import Link

from page_finder import LinkAnnotation
from .html import HtmlLinkExtractor


class PaginationExtractor(HtmlLinkExtractor):
    def __init__(self, **specs):
        self.link_annotation = LinkAnnotation()
        self.visited = set()
        self.url_to_link = {}
        start_urls = specs.get('start_urls')
        if start_urls:
            self.link_annotation.load(start_urls)
            for url in start_urls:
                self.url_to_link[url] = Link(url)
                self.visited.add(url)
                self.link_annotation.mark_link(url, follow=True)
        super(PaginationExtractor, self).__init__()

    def _extract_links(self, response_or_htmlpage, n_links=3):
        self.visited.add(response_or_htmlpage.url)
        new_links = list(
            super(PaginationExtractor, self)._extract_links(response_or_htmlpage))
        for link in new_links:
            self.url_to_link[link.url] = link
        self.link_annotation.load(link.url for link in new_links)
        if isinstance(response_or_htmlpage, Response):
            n_items = response_or_htmlpage.meta.get('n_items')
        else:
            n_items = response_or_htmlpage.headers.get('n_items')
        if n_items is not None:
            self.link_annotation.mark_link(
                response_or_htmlpage.url, follow=(n_items > 0))
        best = self.link_annotation.best_links_to_follow()
        if best:
            pages = []
            for url in best:
                if url not in self.visited:
                    pages.append(self.url_to_link[url]) # TODO: extract only the best link?
                    if len(pages) == n_links:
                        return pages
        return new_links
