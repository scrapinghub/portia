from page_finder import LinkAnnotation
from .html import HtmlLinkExtractor


class PaginationExtractor(HtmlLinkExtractor):
    def __init__(self):
        self.link_annotation = LinkAnnotation()
        self.visited = set()
        super(PaginationExtractor, self).__init__()

    def _extract_links(self, response):
        self.visited.add(response.url)
        url_to_link = {
            link.url: link
            for link in super(PaginationExtractor, self)._extract_links(response)
        }
        self.link_annotation.load(url_to_link)
        n_items = response.meta.get('n_items')
        if n_items is not None:
            self.link_annotation.mark_link(response.url, follow=(n_items > 0))
        best = self.link_annotation.best_links_to_follow()
        if best:
            for url in best:
                if url not in self.visited:
                    return url_to_link[url] # TODO: extract only the best link?
        else:
            return url_to_link.values()
