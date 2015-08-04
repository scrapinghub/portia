import unittest
from json import dumps

from slyd.gitstorage.repoman import Repoman

import mysql.connector


def j(json):
    return dumps(json, sort_keys=True, indent=4)


@unittest.skip("No DB in CI, hardcoded connection credentials") # TODO
class RepomanTest(unittest.TestCase):

    def setUp(self):
        self._connection = mysql.connector.connect(
            host='33.33.33.51',
            user='portia',
            password='portia',
            database='portia')


    def tearDown(self):
        self._connection.close()

    def test_create(self):
        repoman = Repoman.open_repo('new_project_5', self._connection)
        print(repoman.list_files_for_branch('marcos'))
        print(repoman.get_branch_changed_files('marcos'))
