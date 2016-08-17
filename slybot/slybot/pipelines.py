from datetime import datetime
from hashlib import md5
from scrapy import log
from scrapy.exceptions import DropItem
from twisted.enterprise import adbapi
from urlparse import urlparse
import boto3
import csv
from botocore.exceptions import ClientError
import json


class DynamoDBPipeline(object):
    def __init__(self):
      dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
      self.table = dynamodb.Table('parsed_data')

    def process_item(self, item, spider):
      url = ''
      url_hash = ''
      client_id = int(spider.client_id)
      client_page_id = int(spider.client_page_id)

      try:
        url = item['url']
        url_hash = self._get_id(url)
      except:
        print "Error while processing URLs"

      parsed_items = dict((k, v) for k, v in item.iteritems() if v)
      now = datetime.utcnow().replace(microsecond=0).isoformat(' ')

      try:
        response = self.table.update_item(
          Key={
            'url_hash': url_hash,
            ':client_id': client_id
          },
          UpdateExpression="set client_page_id = :client_page_id, extracted_data = :val, updated_at = :updated_at",
          ConditionExpression="url_hash = :url_hash",
          ExpressionAttributeValues={
            ':val': parsed_items,
            ':updated_at': now,
            ':client_page_id': client_page_id,
            ':url_hash': url_hash
          },
          ReturnValues="UPDATED_NEW"
        )

      except ClientError as e:
        if e.response['Error']['Code'] == "ConditionalCheckFailedException":
          response = self.table.put_item(
            Item={
              'client_page_id' : client_page_id,
              'client_id' : client_id,
              'url_hash': url_hash,
              'url': url,
              'extracted_data': parsed_items,
              'template_found': True,
              'created_at': now,
              'updated_at': now
            }
          )
        else:
          raise


    def _get_id(self, url):
      return md5(url).hexdigest()
