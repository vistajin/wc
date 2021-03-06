const HOST = 'localhost';
const PORT = 1337;
const APP_ID = 'wc880101';
const MASTER_KEY = 'vj880101';

const express = require('express');
const app = express();
const bodyParser= require('body-parser');

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json()); // for parsing application/json

var Parse = require('parse/node');
Parse.initialize(APP_ID, null, MASTER_KEY);
Parse.serverURL = 'http://' + HOST + ':' + PORT + '/parse';

// https://github.com/expressjs/session
var session = require('express-session');
//app.set('trust proxy', 1); // trust first proxy
app.use(session({ resave: true ,secret: 'session88010!' , saveUninitialized: true}));

var https = require('http');


app.listen(3000, function() {
  console.log('listening on 3000');
});

/*
app.get('/home', (req, res) => {
  if (!checkLogin(req, res)) {
    return;
  }
  res.send('Welcome to WC');
});

app.get('/error', (req, res) => {
  res.send('ERROR!!');
});

app.get('/create-input', (req, res) => {
  if (!checkLogin(req, res)) {
    return;
  }
  res.sendFile(__dirname + '/views/create/create-input.html');
});

app.get('/login-input', (req, res) => {
  res.sendFile(__dirname + '/views/login/login-input.html');
});*/

/* create new class without data
   sample requst:
    {
      "className": "Class008",
      "columns": [
        {"columnName": "col01", "columnType": "Boolean"},
        {"columnName": "col02", "columnType": "String"},
        {"columnName": "col03", "columnType": "Number"},
        {"columnName": "col04", "columnType": "Date"}
      ]
    }*/
app.post('/model', (req, res) => {
  console.log("create model input:", req.body);
  checkAdmin(req, res, function(isAdmin) {
    if (!isAdmin) {
      return;
    }
    var NewObj = Parse.Object.extend(req.body.className);
    var newObj = new NewObj();
    //newObj.fromJson(req.body);
    for (var i in req.body.columns) {
      var columnName = req.body.columns[i].columnName;
      var columnType = req.body.columns[i].columnType;
      switch (columnType) {
        case 'Boolean':
          newObj.set(columnName, true);
          break;
        case 'String':
          newObj.set(columnName, 'DUMMY');
          break;
        case 'Number':
          newObj.set(columnName, 100);
          break;
        case 'Date':
          newObj.set(columnName, new Date());
          break;
      }
    }

    // disable public read & write, must call before save object
    postApi("schemas/" + req.body.className, {
      "className": req.body.className,
      "fields": {
        "name": {
          "type": "String"
        }
      },
      "classLevelPermissions": {
        "get": {
          "requiresAuthentication": true
        }
      }
    }, function(success) {
      if (success) {
        newObj.save(null, {useMasterKey: true})
        .then(
          function(newObj) {
            console.log('New object created with objectId: ' + newObj.id);
            return newObj;
          })
        .then(
          function(newObj) {
            // remove the temp dummy data
            return newObj.destroy({
              useMasterKey: true,
              success: function(myObject) {
                res.status(200).json(
                  {
                    code: 0,
                    msg: "model created: " + req.body.className
                  }
                );
              }
            });
          })
        .catch(
          function(error) {
            res.status(400).json(
              {
                code: 10007,
                msg: "create model failed: " + error
              }
            );
            console.error('Failed to create new object ' + req.body.className, error);
          });
      } else {
        res.status(400).json(
          {
            code: 10008,
            msg: 'disable public read & write of model: ' + req.body.className
          }
        );
        console.error('error when disable public read & write of model: ' + req.body.className);
      }
    });

    
    /*
    Parse.Cloud.httpRequest({
      url: 'localhost:1337/parse/schemas/' + req.body.objName,
      headers: {
        'Content-Type' : 'application/json',
        //'Content-Length' : Buffer.byteLength(jsonObject, 'utf8'),
        'X-Parse-Application-Id': 'wc880101',
        'X-Parse-Master-Key': 'vj880101'
      },
      method: "POST",
      body: JSON.stringify({
        "className": req.body.objName,
        "fields": {
          "name": {
            "type": "String"
          }
        },
        "classLevelPermissions": {
          "get": {
            "requiresAuthentication": true
          }
        } 
      })
    }).then(function(httpResponse) {
      // success
      console.log(">>>>>>>>>Updated CLP successfully!");
      console.log(httpResponse.text);
    },function(httpResponse) {
      // error
      console.error('Request failed with response code ' + httpResponse.status);
    });
    */    
  });
});

/*
insert data to object, sample request:
{
  "className": "Class009",
  "data": [
    {"columnName": "col01", "value": true},
    {"columnName": "col02", "value": "Hello world!"},
    {"columnName": "col03", "value": 123.45}
  ]
}
*/
app.post('/model-data', (req, res) => {
  console.log("insert data to model input:", req.body);
  checkAdmin(req, res, function(isAdmin) {
    if (!isAdmin) {
      return;
    }
    // TODO: to check if the class exists or not
    var NewObj = Parse.Object.extend(req.body.className);
    var newObj = new NewObj();
    //newObj.fromJson(req.body);
    for (var i in req.body.data) {
      var columnName = req.body.data[i].columnName;
      var columnValue= req.body.data[i].value;
      newObj.set(columnName, columnValue);
    }

    // disable public read/write
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    newObj.setACL(acl);

    newObj.save(null, {useMasterKey: true}).then(
      function(newObj) {
        console.log('Insert into ' + req.body.className + ', objectId: ' + newObj.id);
        res.status(200).json(
          {
            code: 0,
            msg: "insert into: " + req.body.className + ", objectId: " + newObj.id
          }
        );
      },
      function(error) {
        res.status(400).json(
          {
            code: 10008,
            msg: 'Failed to insert into ' + req.body.className + '.' + error
          }
        );
        console.error('Failed to insert into ' + req.body.className, error);
      });      
  });
});

function postApi(uriParam, json, callback) {
  jsonObject = JSON.stringify(json);
  var postheaders = {
    'Content-Type' : 'application/json',
    'Content-Length' : Buffer.byteLength(jsonObject, 'utf8'),
    'X-Parse-Application-Id': APP_ID,
    'X-Parse-Master-Key': MASTER_KEY
  };
  var optionspost = {
    host : HOST,
    port : PORT,
    path : '/parse/' + uriParam,
    method : 'POST',
    headers : postheaders
  };

  var reqPost = https.request(optionspost, function(res) {
    console.log("api call " + uriParam + " statusCode: ", res.statusCode);
    callback(res.statusCode == 200);
 
    res.on('data', function(d) {
      console.info("api call " + uriParam + " result: ");
      process.stdout.write(d);
    });
  });
   
  // write the json data
  reqPost.write(jsonObject);
  reqPost.end();
  reqPost.on('error', function(e) {
    console.error("api call " + uriParam, e);
    callback(false);
  });
}

app.get('/model/:className', (req, res) => {
  if (!checkLogin(req, res)) {
    return;
  }

  var query = new Parse.Query(req.params.className);
  query.find({
    useMasterKey: true,
    success: function(object) {      
      res.status(200).json({
        code: 0,
        msg: object
      });
    },
    error: function(error) {
      console.error("Failed to query " + req.params.className, error);
      res.status(400).json({
        code: error.code,
        msg: error.message
      });
    }
  });
});

/*
var optionsget = {
    host : 'localhost', // here only the domain name(no http/https !)
    port : 1337,
    path : '/schemas', // the rest of the url with parameters if needed
    method : 'POST', // do GET
    headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': 'wc880101',
        'X-Parse-Master-Key': 'vj880101'
  }
};


console.info('Options prepared:');
console.info(optionsget);
console.info('Do the POST call');



// do the GET request
var reqPost = http.request(optionsget, function(res) {
    console.log("statusCode: ", res.statusCode);
    // uncomment it for header details
//    console.log("headers: ", res.headers);


    res.on('data', function(d) {
        console.info('Post result:\n');
        process.stdout.write(d);
        console.info('\n\nCall completed');
    });

});

reqPost.end();
reqPost.on('error', function(e) {
    console.error(e);
});
*/

app.post("/role", (req, res) => {
  checkAdmin(req, res, function(isAdmin) {
    if (!isAdmin) {
      return;
    }
    console.log("start to create role: ", req.body);
    var roleACL = new Parse.ACL();
    roleACL.setPublicReadAccess(false);
    roleACL.setPublicWriteAccess(false);
    var role = new Parse.Role(req.body.rolename, roleACL);
    role.save(null, {
      useMasterKey: true,
      success: function(role) {
        console.log('Create role successfully: ', role);
        res.status(200).json(
        {
          code: 0,
          msg: "Create role successfully"
        });

      },
      error: function(role, error) {
        console.log('Failed to create role', error);
        res.status(400).json(
        {
          code: 10003,
          msg: "Failed to create role: " + error
        });
      }
    });
  });
});

app.post('/roles/append', (req, res) => {
  checkAdmin(req, res, function(isAdmin) {
    if (isAdmin) {
      // check if parent role exists
      getRoleByName(req.body.parentRoleName, function(error, parentRole) {
        if (error) {
          res.status(400).json({
            code: error.code,
            msg: error.message
          });
          return;
        }
        // parent role exists, check if child role exists
        getRoleByName(req.body.childRoleName, function(error, childRole) {
          if (error) {
            res.status(400).json({
              code: error.code,
              msg: error.message
            });
            return;
          }
          console.log("ParentRole=", parentRole);
          console.log("childRole=", childRole);
          parentRole.getRoles().add(childRole);
          parentRole.save(null, {
            useMasterKey: true,
            success: function(obj) {
              res.status(200).json({
                code: 0,
                msg: "add role successfully"
              });
              console.log("add role " + childRole + " to " + parentRole + "successfully.");
            },
            error: function(err) {
              console.log("failed to add role " + childRole + " to " + parentRole, err);
            }
          });
        });
      });
    }
  });
});

// deprecated
function addChildRole(parentRoleName, chileRoleName) {
  var query = new Parse.Query(Parse.Role);
  query.equalTo("name", req.params.name);
  query.first({
    useMasterKey: true,
    success: function(object) {
      object.getRoles().add();
      res.status(200).json({
        code: 0,
        msg: object
      });
    },
    error: function(error) {
      console.error("Error: " + error.code + " " + error.message);
      res.status(400).json({
        code: error.code,
        msg: error.message
      });
    }
  });
  var parentRole = new Parse.Role(parentRoleName);
  parentRole.getRoles().add(chileRoleName);
  parentRole.save(null, {
    useMasterKey: true
  });
}

// https://stackoverflow.com/questions/40381294/how-to-make-parse-find-save-operations-synchronous
/*function getRoleByName(roleName) {
  return new Promise(function(resolve, reject) {
    var query = new Parse.Query(Parse.Role);
    query.equalTo("name", roleName);
    query.first({useMasterKey: true}).then(
      function(object) {
        if (object) {
          resolve(object);
        } else {
          var error = new Parse.Error(10004, "Role not found");
          console.error("getRoleByName: " + roleName + ", Error: " + error.code + " " + error.message);
          reject(error);
        }        
      },
      function(error) {
        console.error("getRoleByName: " + roleName + ", Error: " + error.code + " " + error.message);
        reject(error);
      });  
  });
}*/
function getRoleByName(roleName, callback) {
  var query = new Parse.Query(Parse.Role);
  query.equalTo("name", roleName);
  query.first({useMasterKey: true}).then(
    function(object) {
      if (object) {
        callback(null, object);
      } else {
        var error = new Parse.Error(10004, "Role not found");
        console.error("getRoleByName: " + roleName + ", Error: " + error.code + " " + error.message);
        callback(error);
      }
    },
    function(error) {
      console.error("getRoleByName: " + roleName + ", Error: " + error.code + " " + error.message);
      callback(error);
    });
}

app.get('/roles/:name', (req, res) => {
  if (!checkLogin(req, res)) {
    return;
  }
  
  getRoleByName(req.params.name, function(error, role) {
    if (error) {
      res.status(400).json({
        code: error.code,
        msg: error.message
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: role
      });
    }
  });
  /*getRoleByName(req.params.name)
    .then(
      function(role) {
        res.status(200).json({
          code: 0,
          msg: role
        });
      })
    .catch(
      function(error) {
        res.status(400).json({
          code: error.code,
          msg: error.message
        });
      });*/
});

app.post('/user/add-to-role', (req, res) => {
  console.log("call /user/add-to-role: ", req.body);
  checkAdmin(req, res, function(isAdmin) {
    if (isAdmin) {
      // check if role exists
      getRoleByName(req.body.roleName, function(error, role) {
        if (error) {
          res.status(400).json({
            code: error.code,
            msg: error.message
          });
          return;
        }
        // role exists, check if user exists
        getUserById(req.body.userId, function(error, user) {
          if (error) {
            res.status(400).json({
              code: error.code,
              msg: error.message
            });
            return;
          }
          // user exists, add user to role
          role.getUsers().add(user);
          role.save(null, {useMasterKey: true}).then(
            function(obj) {
              res.status(200).json({
                code: 0,
                msg: "add user " + req.body.userId + " to role " + req.body.roleName + " successfully"
              });
              console.log("add user " + req.body.userId + " to role " + req.body.roleName + " successfully");
            },
            function(err) {
              res.status(400).json({
                code: 10007,
                msg: "failed to add user " + req.body.userId + " to role " + req.body.roleName
              });
              console.error("failed to add user " + req.body.userId + " to role " + req.body.roleName, err);
            }
          );
        });
      });
    }
  });
});

function getUserById(userId, callback) {
  var query = new Parse.Query(Parse.User);
  query.equalTo("objectId", userId);
  query.first({useMasterKey: true}).then(
    function(object) {
      if (object) {
        callback(null, object);
      } else {
        var error = new Parse.Error(10006, "User not found by ID: " + userId);
        console.error("getUserById: " + userId + ", Error: " + error.code + " " + error.message);
        callback(error);
      }
    },
    function(error) {
      console.error("getUserById: " + userId + ", Error: " + error.code + " " + error.message);
      callback(error);
    });
}

app.post('/user', (req, res) => {
  checkAdmin(req, res, function(isAdmin) {
    if (isAdmin) {
      console.log("start to register user: ", req.body);
      var user = new Parse.User();
      user.set("username", req.body.username);
      user.set("password", req.body.password);
      user.set("email", req.body.email);
      user.set("phone", req.body.phone);

      user.signUp(null, {
        useMasterKey: true,
        success: function(user) {
          console.log("register user successfully: ", req.body);
          res.status(200).json(
          {
            code: 0,
            msg: "register user successfully"
          });
        },
        error: function(user, error) {
          // Show the error message somewhere and let the user try again.
          console.error("Error: " + error.code + " " + error.message);
          res.status(400).json(
          {
            code: 10002,
            msg: "Failed to register user: " + error
          });
        }
      });
    }
  });  
});

app.delete('/user', (req, res) => {
  checkAdmin(req, res, function(isAdmin) {
    if (isAdmin) {
      res.status(200).json(
      {
        code: 0,
        msg: "Is admin: " + req.session.user
      });
    }
  });
});

app.post('/login', (req, res) => {
  // console.log(">>>>>>" + req.session.user);
  if (req.session.user) {
    console.log(req.session.user.name, "has logoned at", req.session.user.logonTime);
    res.json(
      {
        code: 1,
        msg: "Duplicate logon"
      }
    );
  } else {
    console.log("Try to logon: user=", req.body.username,", password=", req.body.password);
    Parse.User.logIn(req.body.username, req.body.password, {
      useMasterKey: true,
      success: function(user) {
        console.log("logon successfully!", user);
        req.session.user = user;
        /*{
          name: user.getUsername(),
          logonTime: new Date(),
          sessionId: user.getSessionToken()
          // TODO: to add more valuable fields
        };*/
        console.log("save to session:", req.session.user);

        //res.redirect("/home");
        res.status(200).json(
          {
            code: 0,
            msg: "logon successfully"
          }
        );
      },
      error: function(user, error) {
        console.error("Failed to logon", user.getUsername(), ":" , error);
        //res.redirect("/error");
        res.status(400).json(
          {
            code: 999,
            msg: error
          }
        );
      }
    });
  }
});

app.delete('/logout', (req, res) => {
  if (req.session.user) {
    req.session.destroy(function(err) {
      if (err) {
        console.error("Failed to destroy session", err);
      } else {
        console.info("User logout successfully.");
      }      
    });
    //res.redirect("/home");
    res.status(200).json(
      {
        code: 0,
        msg: "logout successfully"
      }
    );
  } else {
    console.log("User not yet login.");
    res.status(400).json(
      {
        code: 999,
        msg: "User not yet login."
      }
    );
  }
});

function checkLogin(req, res) {  
  if (!req.session.user) {
    res.status(400).json(
      {
        code: 10001,
        msg: "User not yet login."
      }
    );
    return false;
  }
  return true;
}

function isUserInRole(roleName, userId, callback) {
  getRoleByName(roleName, function(error, role) {
    if (error) {      
      return false;
    } else {
      var relation = new Parse.Relation(role, 'users');
      var query = relation.query();

      query.equalTo('objectId', userId);
      query.first({useMasterKey: true}).then(
        function(result) {
          if (result) {
            console.log("User " + userId + " is in role " + roleName);
            callback(true);
          } else {
            console.log("User " + userId + " is NOT in role " + roleName);
            callback(false);
          }
        },
        function(err) {
          console.log("isUserInRole error.", err);
          callback(false, err);
        }
      );
    }
  });
}

function checkAdmin(req, res, callback) {
  if (!req.session.user) {
    res.status(400).json(
      {
        code: 10001,
        msg: "User not yet login."
      }
    );
    return false;
  }
  isUserInRole("admin", req.session.user.objectId, function(result, err) {
    if (!result) {
      if (err) {
        res.status(400).json(
          {
            code: err.code,
            msg: err.message
          }
        );
      } else {
        res.status(400).json(
          {
            code: 10005,
            msg: "User not admin."
          }
        );
      }
    }
    callback(result);
  });
}