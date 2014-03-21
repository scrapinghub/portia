import re

from unittest import TestCase
from os.path import dirname, join

from slybot.validation.schema import get_schema_validator, \
            ValidationError, validate_project_schema
from slybot.utils import open_project_from_dir

_TEST_PROJECT_DIR = join(dirname(__file__), "data/SampleProject")

class JsonSchemaTest(TestCase):

    def assertRaisesRegexp(self, eclass, pattern, func, *args):
        """assertRaisesRegexp is not provided in python versions below 2.7"""
        try:
            func(*args)
        except eclass, e:
            m = re.search(pattern, e.message)
            if not m:
                raise AssertionError('"%s" does not match "%s"' % (pattern, e.message))
        else:
            raise AssertionError("%s not raised" % eclass.__name__)

    def test_regex_formatting_wrong(self):
        obj = {
            "0": {
                "regular_expression": "Item: (\d+"
            }
        }
        validator = get_schema_validator("extractors")
        self.assertRaisesRegexp(ValidationError, "Invalid regular expression",
                    validator.validate, obj)

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
            "start_urls": ['http://www.example.com/'],
            "links_to_follow": "none",
            "respect_nofollow": True,
            "templates": [],
        }
        validator = get_schema_validator("spider")
        self.assertEqual(validator.validate(obj), None)

    def test_invalid_url(self):
        obj = {
            "start_urls": ['www.example.com'],
            "links_to_follow": "none",
            "respect_nofollow": True,
            "templates": [],
        }
        validator = get_schema_validator("spider")
        self.assertRaisesRegexp(ValidationError, "Invalid url:", validator.validate, obj)

    def test_test_project(self):
        specs = open_project_from_dir(_TEST_PROJECT_DIR)
        self.assertTrue(validate_project_schema(specs))

