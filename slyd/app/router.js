import Ember from "ember";
import config from "./config/environment";

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.resource("projects", function() {
    this.resource("project", {
      path: ":project_id"
    }, function() {
      this.resource("spider", {
        path: ":spider_id"
      }, function() {
        this.resource("template", {
          path: ":template_id"
        }, function() {
          this.resource("items");
        });
      });
      this.resource("conflicts");
    });
  });
  this.route("base-route");
});

export default Router;