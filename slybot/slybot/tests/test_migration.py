import unittest

from slybot.plugins.scrapely_annotations.migration import handle_tables


class MigrationTests(unittest.TestCase):
    def test_table_generalization(self):
        selectors = [
            ('table.mainbg > tr:nth-child(5) > td:nth-child(1) > '
             'table:nth-child(2) > tr:nth-child(3) > td:nth-child(1) > '
             'p:nth-child(1) > strong:nth-child(1)',
             'table.mainbg > tr:nth-child(5) > td:nth-child(1) > '
             'table:nth-child(2) > tr:nth-child(3) > td:nth-child(1) > '
             'p:nth-child(1) > strong:nth-child(1), table.mainbg > * > '
             'tr:nth-child(5) > td:nth-child(1) > table:nth-child(2) > '
             'tr:nth-child(3) > td:nth-child(1) > p:nth-child(1) > '
             'strong:nth-child(1), table.mainbg > tr:nth-child(5) > '
             'td:nth-child(1) > table:nth-child(2) > * > tr:nth-child(3) > '
             'td:nth-child(1) > p:nth-child(1) > strong:nth-child(1), '
             'table.mainbg > * > tr:nth-child(5) > td:nth-child(1) > '
             'table:nth-child(2) > * > tr:nth-child(3) > td:nth-child(1) > '
             'p:nth-child(1) > strong:nth-child(1)'),
            ('div > p > .table > div > span', 'div > p > .table > div > span'),
            ('div > p > #table > div > span', 'div > p > #table > div > span'),
            ('div > p > table > div > span',
             'div > p > table > div > span, div > p > table > * > div > span'),
            ('div > p > table:nth-child(4) > div > span',
             'div > p > table:nth-child(4) > div > span, '
             'div > p > table:nth-child(4) > * > div > span'),
            ('table', 'table')
        ]
        for selector, generalized in selectors:
            self.assertEqual(handle_tables(selector), generalized)
