
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




var query = new Parse.Query("Comments");
query.equalTo("post", post);

query.find().then(function(results) {
  // Collect one promise for each delete into an array.
  var promises = [];
  _.each(results, function(result) {
    // Start this delete immediately and add its promise to the list.
    promises.push(result.destroy());
  });
  // Return a new promise that is resolved when all of the deletes are finished.
  return Parse.Promise.when(promises);

}).then(function() {
  // Every comment was deleted.
});
