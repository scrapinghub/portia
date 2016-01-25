# -*- coding: utf-8 -*-
import re

from unittest import TestCase
from os.path import dirname, join

from slybot.validation.schema import get_schema_validator, \
            ValidationError, validate_project_schema
from slybot.utils import open_project_from_dir

_TEST_PROJECT_DIR = join(dirname(__file__), "data/SampleProject")

class JsonSchemaTest(TestCase):

    def test_regex_formatting_wrong(self):
        obj = {
            "0": {
                "regular_expression": "Item: (\d+"
            }
        }
        validator = get_schema_validator("extractors")
        with self.assertRaises(ValidationError):
            validator.validate(obj)

    def test_regex_formatting_ok(self):
        obj = {
            "0": {
                "regular_expression": "Item: (\d+)"
            }
        }
        validator = get_schema_validator("extractors")
        self.assertEqual(validator.validate(obj), None)

    def test_valid_url(self):
        obj = {
            "start_urls": [
                'http://www.example.com/',
                'http://www.example.com/經濟',
                'http://www.example.com/?q=經濟',
                'http://www.example.com/#經濟',
                'http://faß.de',
                'http://例.jp/',
                'http://[2001:0000:1234:0000:0000:C1C0:ABCD:0876]/foo/bar',
                'http://[2001::]/foo/bar',
                'http://8.8.8.8/foo/bar',
                'http://localhost:8080/foo/bar',
                'http://foo@localhost:8080/foo/bar',
                'http://foo:bar@localhost:8080/foo/bar',
                'http://domain.com/path/file.html?param=FOO^111&param2=bar&param3=true&_param4=on', # Anonymized URL form sentry d46840d2457c4042b1b58f2fa40e984b
                'https://domain.com/path/file.htm?param=foo#hash/foo/bar/baz:foo|bar:baz',          # Anonymized URL from sentry 01dd2fa09d9540b69ebd33372b2b3a2d
                'https://domain.com/path/file.htm?param=foo#hash/foo/bar/baz:foo|bar%5B%5D:12345',  # Anonymized URL from sentry 87d49ee751494c90a8941dcbdacea634
                'http://domain.com/path?bar[foo]=baz&foo[bar]=12345',                               # Anonymized URL from sentry 9f6835f5decd4d57b9475f04f0a58bd4

            ],
            "links_to_follow": "none",
            "respect_nofollow": True,
            "templates": [],
        }
        validator = get_schema_validator("spider")
        self.assertEqual(validator.validate(obj), None)

    def test_invalid_url(self):
        for invalid_url in (
                12345, # Not a string
                'example.com', # Lacks protocol
                'http://[:::1]/foo/bar', # Bad IPv6 addr
                'http://http://foo.com/bar', # Double protocol
                'spotify:foobar', # Not http/s protocol
                '/foo', # relative
                '?foo', # relative
                '#foo', # relative
            ):
            obj = {
                "start_urls": [invalid_url],
                "links_to_follow": "none",
                "respect_nofollow": True,
                "templates": [],
            }
            validator = get_schema_validator("spider")
            with self.assertRaises(ValidationError):
                validator.validate(obj)

    def test_test_project(self):
        specs = open_project_from_dir(_TEST_PROJECT_DIR)
        self.assertTrue(validate_project_schema(specs))
