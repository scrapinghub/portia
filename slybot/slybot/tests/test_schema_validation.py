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
