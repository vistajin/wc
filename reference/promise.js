
var query = new Parse.Query("Comments");
query.equalTo("post", post);

query.find().then(function(results) {
  // Create a trivial resolved promise as a base case.
  var promise = Parse.Promise.as();
  _.each(results, function(result) {
    // For each item, extend the promise with a function to delete it.
    promise = promise.then(function() {
      // Return a promise that will be resolved when the delete is finished.
      return result.destroy();
    });
  });
  return promise;

}).then(function() {
  // Every comment was deleted.
});
