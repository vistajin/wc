// Create the roles while creating the account.
Parse.Cloud.afterSave("account", function(request) {

    var accountName = request.object.get("name");
    //create admin role
    var adminRoleACL = new Parse.ACL();
    adminRoleACL.setPublicReadAccess(false);
    adminRoleACL.setPublicWriteAccess(false);
    var adminRole = new Parse.Role(accountName + "_Administrator", adminRoleACL);
    adminRole.save();

    //create user role
    var userRoleACL = new Parse.ACL();
    userRoleACL.setPublicReadAccess(false);
    userRoleACL.setPublicWriteAccess(false);
    var userRole = new Parse.Role(accountName + "_User", userRoleACL);
    userRole.save();
});

// Then add the users to the created role
Parse.Cloud.define("addUsersToRole", function(request, response) {

    Parse.Cloud.useMasterKey();
    var currentUser = request.user;
    var accountName = request.params.accountname;
    var isAdmin = request.params.admin;

    var query = new Parse.Query(Parse.Role);
    query.contains("name", accountName);
    query.find({
        success : function(roles) {
            console.log("roles: " + roles.length);
            for (var i = 0; i < roles.length; i++) {

                if ( isAdmin = false && roles[i].get("name").search("_Administrator") >= 0)
                    continue;

                roles[i].getUsers().add(currentUser);
                roles[i].save();
            }
            response.success();
        },
        error : function(error) {
            response.error("error adding to admin role " + error);
        }
    });
});
