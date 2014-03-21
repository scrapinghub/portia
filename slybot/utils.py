from urlparse import urlparse
import os
import json

from scrapely.htmlpage import HtmlPage

def iter_unique_scheme_hostname(urls):
    """Return an iterator of tuples (scheme, hostname) over the given urls,
    filtering dupes
    """
    scheme_hostname = set()
    for x in urls:
        p = urlparse(x)
        scheme_hostname.add((p.scheme, p.hostname))
    return list(scheme_hostname)

def open_project_from_dir(project_dir):
    specs = {"spiders": {}}
    with open(os.path.join(project_dir, "project.json")) as f:
        specs["project"] = json.load(f)
    with open(os.path.join(project_dir, "items.json")) as f:
        specs["items"] = json.load(f)
    with open(os.path.join(project_dir, "extractors.json")) as f:
        specs["extractors"] = json.load(f)
    for fname in os.listdir(os.path.join(project_dir, "spiders")):
        if fname.endswith(".json"):
            spider_name = os.path.splitext(fname)[0]
            with open(os.path.join(project_dir, "spiders", fname)) as f:
                try:
                    specs["spiders"][spider_name] = json.load(f)
                except ValueError, e:
                    raise ValueError("Error parsing spider (invalid JSON): %s: %s" % (fname, e))
    return specs

def htmlpage_from_response(response):
    return HtmlPage(response.url, response.headers, \
            response.body_as_unicode(), encoding=response.encoding)
