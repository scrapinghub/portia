"""Simple validation of specifications passed to slybot"""
from __future__ import absolute_import
from os.path import dirname, join
import json
import re
import socket

from six.moves.urllib.parse import (
    urlsplit, urlunsplit
)

from jsonschema import (Draft3Validator, RefResolver, FormatChecker,
                        ValidationError)
import six


_PATH = dirname(__file__)


def load_schemas():
    filename = join(_PATH, "schemas.json")
    return dict((s["id"], s) for s in json.load(open(filename)))

_SCHEMAS = load_schemas()


class SlybotJsonSchemaValidator(Draft3Validator):
    DEFAULT_TYPES = Draft3Validator.DEFAULT_TYPES.copy()
    DEFAULT_TYPES.update({
        "mapping": dict,
    })

def is_valid_ipv6_address(address):
    try:
        socket.inet_pton(socket.AF_INET6, address)
    except socket.error:  # not a valid address
        return False
    return True

def get_url_re():
    """
    Generate a URI validation regexp.
    Slightly modified from Django's URL validation
    https://github.com/django/django/blob/master/django/core/validators.py
    """
    ul = '\u00a1-\uffff'  # unicode letters range (must be a unicode string, not a raw string)
    # IP patterns
    ipv4_re = r'(?:25[0-5]|2[0-4]\d|[0-1]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}'
    ipv6_re = r'\[[0-9a-f:\.]+\]' # Simple RE, validated later

    # Host patterns
    hostname_re = r'[a-z' + ul + r'0-9](?:[a-z' + ul + r'0-9-]{0,61}[a-z' + ul + r'0-9])?'
    # Max length for domain name labels is 63 characters per RFC 1034 sec. 3.1
    domain_re = r'(?:\.(?!-)[a-z' + ul + r'0-9-]{1,63}(?<!-))*'
    tld_re = r'\.(?:[a-z' + ul + r']{2,63}|xn--[a-z0-9]{1,59})\.?'
    host_re = '(' + hostname_re + domain_re + tld_re + '|localhost)'

    return re.compile(
        r'^(?:https?)://'  # Only http or https links allowed
        r'(?:\S+(?::\S*)?@)?'  # user:pass authentication
        r'(?:' + ipv4_re + '|' + ipv6_re + '|' + host_re + ')'
        r'(?::\d{2,5})?'  # port
        r'(?:[/?#][^\s]*)?'  # resource path
        r'\Z',
        re.IGNORECASE
    )

URL_RE = get_url_re()

def get_schema_validator(schema):
    resolver = RefResolver("", schema, _SCHEMAS)

    @FormatChecker.cls_checks('url', (ValueError, UnicodeError))
    def is_valid_uri(url):
        if not isinstance(url, six.string_types):
            return False
        if isinstance(url, six.binary_type):
            url = url.decode('utf-8')

        scheme, netloc, path, query, fragment = urlsplit(url)
        netloc = netloc.encode('idna').decode('ascii')  # IDN -> ACE
        url = urlunsplit((scheme, netloc, path, query, fragment))

        if not URL_RE.match(url):
            return False

        # Validate IPv6
        ipv6_match = re.search(r'^\[(.+)\](?::\d{2,5})?$', netloc)
        if ipv6_match:
            potential_ip = ipv6_match.groups()[0]
            if not is_valid_ipv6_address(potential_ip):
                return False
        return True

    # Workaround for https://github.com/Julian/jsonschema/pull/272
    @FormatChecker.cls_checks('regex', (Exception))
    def is_valid_re(re_source):
        if not isinstance(re_source, six.string_types):
            return False
        if isinstance(re_source, six.binary_type):
            re_source = re_source.decode('utf-8')

        re.compile(re_source)
        return True

    return SlybotJsonSchemaValidator(_SCHEMAS[schema], resolver=resolver,
                                     format_checker=FormatChecker())


def validate_project_schema(specs):

    project = specs["project"]
    get_schema_validator("project").validate(project)

    items = specs["items"]
    get_schema_validator("items").validate(items)

    extractors = specs["extractors"]
    get_schema_validator("extractors").validate(extractors)

    spider_schema_validator = get_schema_validator("spider")
    for spider in specs["spiders"].values():
        spider_schema_validator.validate(spider)

    return True
