from scrapy.http import Response

from page_finder import LinkAnnotation
from .html import HtmlLinkExtractor


class PaginationExtractor(HtmlLinkExtractor):
    def __init__(self):
        self.link_annotation = LinkAnnotation()
        self.visited = set()
        super(PaginationExtractor, self).__init__()

    def _extract_links(self, response_or_htmlpage):
        self.visited.add(response_or_htmlpage.url)
        url_to_link = {
            link.url: link
            for link in super(PaginationExtractor, self)._extract_links(response_or_htmlpage)
        }
        self.link_annotation.load(url_to_link)
        if isinstance(response_or_htmlpage, Response):
            n_items = response_or_htmlpage.meta.get('n_items')
        else:
            n_items = response_or_htmlpage.headers.get('n_items')
        if n_items is not None:
            self.link_annotation.mark_link(
                response_or_htmlpage.url, follow=(n_items > 0))
        best = self.link_annotation.best_links_to_follow()
        if best:
            for url in best:
                if url not in self.visited:
                    return [url_to_link[url]] # TODO: extract only the best link?
        else:
            return url_to_link.values()
