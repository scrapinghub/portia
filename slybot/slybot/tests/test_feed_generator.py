import scrapy

from unittest import TestCase

from slybot.starturls import FeedGenerator


class FeedGeneratorTest(TestCase):
    def assertEqualUrls(self, url, test_url):
        generator = FeedGenerator(lambda x: x)

        request = generator(url)
        self.assertEqual(request.url, test_url)

    def test_request(self):
        url = 'http://feed_domain.com'
        callback = lambda x: x
        generator = FeedGenerator(callback)

        request = generator(url)
        self.assertTrue(isinstance(request, scrapy.Request))
        self.assertEqual(request.url, url)

    def test_github_nonraw_gist(self):
        self.assertEqualUrls(
            'https://gist.github.com/user/gist_id',
            'https://gist.github.com/user/gist_id/raw'
        )

    def test_github_nonraw_trailing_gist(self):
        self.assertEqualUrls(
            'https://gist.github.com/user/gist_id/',
            'https://gist.github.com/user/gist_id/raw'
        )

    def test_github_raw_gist(self):
        gist_url = 'https://gist.github.com/user/gist_id/raw'
        self.assertEqualUrls(gist_url, gist_url)

    def test_dropbox_shareable_link(self):
        self.assertEqualUrls(
            'https://www.dropbox.com/s/dropbox-id/urls.txt?dl=0',
            'https://www.dropbox.com/s/dropbox-id/urls.txt?dl=0&raw=1'
        )

    def test_google_shareable_link(self):
        self.assertEqualUrls(
            'https://docs.google.com/document/d/drive-id/edit?usp=sharing',
            'https://docs.google.com/document/d/drive-id/export?format=txt'
        )
