# -*- coding: utf-8 -*-
from unittest import TestCase

from scrapy.settings import Settings
from slybot.spidermanager import SlybotSpiderManager
from slybot.meta import DropMetaPipeline

from .utils import PATH


class DropMetaTest(TestCase):

    def test_dupefilter(self):
        smanager = SlybotSpiderManager("%s/data/SampleProject" % PATH)
        name = 'books.toscrape.com'
        spider = smanager.create(name)
        spec = smanager._specs["spiders"][name]
        dropmeta = DropMetaPipeline(Settings({"SLYDROPMETA_ENABLED": True}))
        result = {
            "breadcrumbs": ["Home", "Books", "Mystery"],
            "description": [
                u"WICKED above her hipbone, GIRL across her heart Words are "
                u"like a road map to reporter Camille Preaker’s troubled past."
                u" Fresh from a brief stay at a psych hospital, Camille’s "
                u"first assignment from the second-rate daily paper where she "
                u"works brings her reluctantly back to her hometown to cover "
                u"the murders of two preteen girls. NASTY on her kneecap, "
                u"BABYDOLL on her leg Since WICKED above her hipbone, GIRL "
                u"across her heart Words are like a road map to reporter "
                u"Camille Preaker’s troubled past. Fresh from a brief stay at "
                u"a psych hospital, Camille’s first assignment from the "
                u"second-rate daily paper where she works brings her "
                u"reluctantly back to her hometown to cover the murders of "
                u"two preteen girls. NASTY on her kneecap, BABYDOLL on her leg"
                u" Since she left town eight years ago, Camille has hardly "
                u"spoken to her neurotic, hypochondriac mother or to the "
                u"half-sister she barely knows: a beautiful thirteen-year-old "
                u"with an eerie grip on the town. Now, installed again in her "
                u"family’s Victorian mansion, Camille is haunted by the "
                u"childhood tragedy she has spent her whole life trying to cut"
                u" from her memory. HARMFUL on her wrist, WHORE on her ankle "
                u"As Camille works to uncover the truth about these violent "
                u"crimes, she finds herself identifying with the young "
                u"victims—a bit too strongly. Clues keep leading to dead ends,"
                u" forcing Camille to unravel the psychological puzzle of her "
                u"own past to get at the story. Dogged by her own demons, "
                u"Camille will have to confront what happened to her years "
                u"before if she wants to survive this homecoming.With its "
                u"taut, crafted writing, Sharp Objects is addictive, haunting,"
                u" and unforgettable. ...more"
            ],
            "image": [
                "http://books.toscrape.com/media/cache/c0/59/c05972805aa720117"
                "1b8fc71a5b00292.jpg"
            ],
            "info": {
                "price": ["47.82"],
                "stock": ["20"],
                "tax": ["0.00"],
                "type": ["Books"],
                "upc": ["e00eb4fd7b871a48"]},
            "url": ("http://books.toscrape.com/catalogue/"
                    "sharp-objects_997/index.html")
        }
        tid = '3617-44af-a2f0'
        extracted = next(t for t in spec["templates"] if t['page_id'] == tid)
        processed = dropmeta.process_item(extracted['results'][0], spider)
        self.assertEqual(result, processed)
