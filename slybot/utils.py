from urlparse import urlparse


def iter_unique_scheme_hostname(urls):
    """Return an iterator of tuples (scheme, hostname) over the given urls,
    filtering dupes
    """
    scheme_hostname = set()
    for x in urls:
        p = urlparse(x)
        scheme_hostname.add((p.scheme, p.hostname))
    return list(scheme_hostname)


