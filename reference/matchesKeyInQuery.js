var Team = Parse.Object.extend("Team");
var teamQuery = new Parse.Query(Team);
teamQuery.greaterThan("winPct", 0.5);
var userQuery = new Parse.Query(Parse.User);
userQuery.matchesKeyInQuery("hometown", "city", teamQuery);
userQuery.find({
  success: function(results) {
    // results has the list of users with a hometown team with a winning record
  }
});
