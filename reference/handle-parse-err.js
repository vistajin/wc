function handleParseError(err) {
  switch (err.code) {
    case Parse.Error.INVALID_SESSION_TOKEN:
      Parse.User.logOut();
      ... // If web browser, render a log in screen
      ... // If Express.js, redirect the user to the log in route
      break;

    ... // Other Parse API errors that you want to explicitly handle
  }
}

// For each API request, call the global error handler
query.find().then(function() {
  ...
}, function(err) {
  handleParseError(err);
});
