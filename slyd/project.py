"""
Project Resource

Manages access to project specific settings.
"""
from twisted.web.resource import Resource, NoResource


class Project(Resource):
    """Project resource

    Adds a project name to the request path, checking that the
    project is present and setting the project as an attribute on the
    response
    """

    def getChildWithDefault(self, project_path_element, request):
        # TODO: check exists, user has access, etc.
        # rely on the CrawlerSpec for this as storage and auth
        # can be customized
        request.project = project_path_element
        try:
            next_path_element = request.postpath.pop(0)
        except IndexError:
            next_path_element = None
        if next_path_element not in self.children:
            raise NoResource("No such child resource.")
        request.prepath.append(project_path_element)
        return self.children[next_path_element]
