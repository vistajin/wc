const express = require('express');
const app = express();
const bodyParser= require('body-parser');

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json()); // for parsing application/json

var Parse = require('parse/node');
Parse.initialize("wc880101", null, "vj880101");
Parse.serverURL = 'http://localhost:1337/parse';

// https://github.com/expressjs/session
var session = require('express-session');
//app.set('trust proxy', 1); // trust first proxy
app.use(session({ resave: true ,secret: 'session88010!' , saveUninitialized: true}));

////////////////INITIALIZATION/////////////////
app.listen(3000, function() {
  console.log('listening on 3000');
});

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
});

app.post('/create', (req, res) => {
  if (!checkLogin(req, res)) {
    return;
  }
  console.log("create object input:", req.body);
  // Simple syntax to create a new subclass of Parse.Object.
  var NewObj = Parse.Object.extend(req.body.objName);

  // Create a new instance of that class.
  var newObj = new NewObj();

  newObj.set(req.body.field1, "Hello");
  newObj.set(req.body.field2, "WORLD");

  newObj.save(null, {
    useMasterKey: true,
    success: function(newObj) {
      // Execute any logic that should take place after the object is saved.
      console.log('New object created with objectId: ' + newObj.id);
    },
    error: function(newObj, error) {
      // Execute any logic that should take place if the save fails.
      // error is a Parse.Error with an error code and message.
      console.log('Failed to create new object, with error code: ' + error.message);
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


  // disable public read & write
  var https = require('http');
  jsonObject = JSON.stringify({
      "className": req.body.objName,
      "fields": {
        "name": {
          "type": "String"
        }
      },
      "classLevelPermissions":
          {
            "get": {
              "requiresAuthentication": true
            }
          } 
  });
   
  // prepare the header
  var postheaders = {
    'Content-Type' : 'application/json',
    'Content-Length' : Buffer.byteLength(jsonObject, 'utf8'),
    'X-Parse-Application-Id': 'wc880101',
    'X-Parse-Master-Key': 'vj880101'
  };
   
  // the post options
  var optionspost = {
    host : 'localhost',
    port : 1337,
    path : '/parse/schemas/' + req.body.objName,
    method : 'POST',
    headers : postheaders
  };
   
  // do the POST call
  var reqPost = https.request(optionspost, function(res) {
    console.log("statusCode: ", res.statusCode);
 
    res.on('data', function(d) {
      console.info('POST result:\n');
      process.stdout.write(d);
    });
  });
   
  // write the json data
  reqPost.write(jsonObject);
  reqPost.end();
  reqPost.on('error', function(e) {
    console.error(e);
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

app.post('/user', (req, res) => {
  if (!checkLogin(req, res)) {
    return;
  }

  var user = new Parse.User();
  user.set("username", req.body.username);
  user.set("password", req.body.password);
  user.set("email", req.body.email);
  user.set("phone", req.body.phone);

  user.signUp(null, {
    useMasterKey: true,
    success: function(user) {
      console.log("register user successfully: ", req.body);
      res.json(
      {
        code: 0,
        msg: "register user successfully"
      });
    },
    error: function(user, error) {
      // Show the error message somewhere and let the user try again.
      console.error("Error: " + error.code + " " + error.message);
      res.json(
      {
        code: 10002,
        msg: "Failed to register user: " + error
      });
    }
  });
});

app.delete('/user', (req, res) => {
  checkLogin(req, res);
  
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
        req.session.user = {
          name: user.getUsername(),
          logonTime: new Date(),
          sessionId: user.getSessionToken()
          // TODO: to add more valuable fields
        };
        console.log("save to session:", req.session.user);

        //res.redirect("/home");
        res.json(
          {
            code: 0,
            msg: "logon successfully"
          }
        );
      },
      error: function(user, error) {
        console.error("Failed to logon", user.getUsername(), ":" , error);
        //res.redirect("/error");
        res.json(
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
    res.json(
      {
        code: 0,
        msg: "logout successfully"
      }
    );
  } else {
    console.log("User not yet login.");
    res.json(
      {
        code: 999,
        msg: "User not yet login."
      }
    );
  }
});

function checkLogin(req, res) {
  if (!req.session.user) {
    res.json(
      {
        code: 10001,
        msg: "User not yet login."
      }
    );
    return false;
  }
  return true;
}


app.post("/role/create", (req, res) => {
  res.json(
    {
      user: req.body.username,
      password: req.body.password
    }
  );
});