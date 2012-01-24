from unittest import TestCase

from slybot.utils import create_regex_extractor
from slybot.fieldtypes import TextFieldTypeProcessor

class ExtractorTest(TestCase):
    def test_regex_extractor(self):
        extractor = create_regex_extractor("(\d+).*(\.\d+)")
        extracted = extractor(u"The price of this product is <div>45</div> </div class='small'>.50</div> pounds")
        self.assertEqual(extracted, u"45.50")
        processor = TextFieldTypeProcessor()
        self.assertEqual(processor.adapt(extracted), u"45.50")
