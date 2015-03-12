from urlparse import urlparse
import os
import json

from scrapy.utils.misc import load_object

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

    spec_base = os.path.join(project_dir, "spiders")
    for fname in os.listdir(spec_base):
        if fname.endswith(".json"):
            spider_name = os.path.splitext(fname)[0]
            with open(os.path.join(spec_base, fname)) as f:
                try:
                    spec = json.load(f)
                    template_names = spec.get("template_names")
                    if template_names:
                        templates = load_external_templates(spec_base,
                                                            spider_name,
                                                            template_names)
                        spec.setdefault("templates", []).extend(templates)
                    specs["spiders"][spider_name] = spec
                except ValueError as e:
                    raise ValueError(
                        "Error parsing spider (invalid JSON): %s: %s" %
                        (fname, e)
                    )
    return specs


def load_external_templates(spec_base, spider_name, template_names):
    """A generator yielding the content of all passed `template_names` for
    `spider_name`.
    """
    for name in template_names:
        with open(os.path.join(spec_base, spider_name, name + ".json")) as f:
            yield json.load(f)


def htmlpage_from_response(response):
    return HtmlPage(response.url, response.headers,
                    response.body_as_unicode(), encoding=response.encoding)


def load_plugins(settings):
    if settings['PLUGINS']:
        return [load_object(p) if isinstance(p, str) else p
                for p in settings['PLUGINS']]
    else:
        from slybot.plugins.scrapely_annotations import Annotations
        return [Annotations]
