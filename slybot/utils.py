import re
from urlparse import urlparse

from scrapely.extractors import htmlregion

def iter_unique_scheme_netloc(urls):
    """Return an iterator of tuples (scheme, netloc) over the given urls,
    filtering dupes
    """
    scheme_netloc = [tuple(urlparse(x)[:2]) for x in urls]
    return list(set(scheme_netloc))

def create_regex_extractor(pattern):
    """Create extractor from a regular expression.
    Only groups from match are extracted and concatenated, so it
    is required to define at least one group. Ex:
    >>> extractor = create_regex_extractor("(\d+).*(\.\d+)")
    >>> extractor(u"The price of this product is <div>45</div> </div class='small'>.50</div> pounds")
    u'45.50'
    """
    ereg = re.compile(pattern, re.S)
    def _extractor(txt):
        m = ereg.search(txt)
        if m:
            return htmlregion("".join(filter(None, m.groups())))
    
    return _extractor

 
