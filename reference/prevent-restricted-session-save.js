// If you want to prevent restricted Sessions from modifying classes other than User, Session, or Role, you can write a Cloud Code beforeSave handler for that class:

Parse.Cloud.beforeSave("MyClass", function(request, response) {
  Parse.Session.current().then(function(session) {
    if (session.get('restricted')) {
      response.error('write operation not allowed');
    }
    response.success();
  });
});
