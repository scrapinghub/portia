from urlparse import urlparse


def iter_unique_scheme_netloc(urls):
    """Return an iterator of tuples (scheme, netloc) over the given urls,
    filtering dupes
    """
    scheme_netloc = [tuple(urlparse(x)[:2]) for x in urls]
    return list(set(scheme_netloc))


