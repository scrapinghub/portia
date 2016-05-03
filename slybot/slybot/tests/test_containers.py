from unittest import TestCase

from slybot.plugins.scrapely_annotations.builder import (
    merge_containers,
    _clean_annotation_data)


class TestMultipleContainers(TestCase):
    annotations = [
        # Item A
        ################################################################
        {
            'id': 'common-container-A',
            'schema_id': 'item-A',
            'tagid': 2, # shared with common-container-B
            'data': {},
            'item_container': True,
        },
        {
            'id': 'item-A-container',
            'container_id': 'common-container-A',
            'tagid': 3,
            'data': {},
            'item_container': True,
        },
        {
            'id': 'item-A-field-1',
            'container_id': 'item-A-container',
            'tagid': 4,
            'data': {
                1: {
                    'attribute': 'content',
                    'field': 'field-1',
                }
            }
        },
        {
            'id': 'item-A-field-2',
            'container_id': 'item-A-container',
            'tagid': 5,
            'data': {
                1: {
                    'attribute': 'content',
                    'field': 'field-2',
                }
            }
        },
        {
            'id': 'item-A-field-3',
            'container_id': 'item-A-container',
            'tagid': 6,
            'data': {
                1: {
                    'attribute': 'content',
                    'field': 'field-3',
                }
            }
        },
        # Item B
        ################################################################
        {
            'id': 'common-container-B',
            'schema_id': 'item-B',
            'tagid': 2, # shared with common-container-A
            'data': {},
            'item_container': True,
        },
        {
            'id': 'item-B-container',
            'container_id': 'common-container-B',
            'tagid': 19,
            'data': {},
            'item_container': True,
        },
        {
            'id': 'item-B-field-1',
            'container_id': 'item-B-container',
            'tagid': 20,
            'data': {
                1: {
                    'attribute': 'content',
                    'field': 'field-1',
                }
            }
        },
        {
            'id': 'item-B-field-2',
            'container_id': 'item-B-container',
            'tagid': 21,
            'data': {
                1: {
                    'attribute': 'content',
                    'field': 'field-2',
                }
            }
        },
        {
            'id': 'item-B-field-3',
            'container_id': 'item-B-container',
            'tagid': 22,
            'data': {
                1: {
                    'attribute': 'content',
                    'field': 'field-3',
                }
            }
        },
    ]

    def test_merge(self):
        grouped_by_id = {
            annotation['id']: annotation for annotation in
            merge_containers(_clean_annotation_data(self.annotations))
        }

        self.assertEqual(grouped_by_id['item-A-container']['schema_id'], 'item-A')
        self.assertEqual(grouped_by_id['item-B-container']['schema_id'], 'item-B')
        self.assertEqual(grouped_by_id['item-A-container']['container_id'],
                         grouped_by_id['item-B-container']['container_id'])

        self.assertEqual(grouped_by_id['item-A-field-1']['schema_id'], 'item-A')
        self.assertEqual(grouped_by_id['item-A-field-2']['schema_id'], 'item-A')
        self.assertEqual(grouped_by_id['item-A-field-3']['schema_id'], 'item-A')
        self.assertEqual(grouped_by_id['item-B-field-1']['schema_id'], 'item-B')
        self.assertEqual(grouped_by_id['item-B-field-2']['schema_id'], 'item-B')
        self.assertEqual(grouped_by_id['item-B-field-3']['schema_id'], 'item-B')
