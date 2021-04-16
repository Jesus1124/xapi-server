let fs = require("fs"),
  unzip = require("unzipper");

let express = require("express");
let cors = require("cors");
let os = require("os");
let path = require("path");
let request = require("request");
let xmldoc = require("xmldoc");
let app = express();
app.use(cors());

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/contents", { dotFiles: "allow" }));

app.get("/xapi", (req, res) => {
  let zipURL = req.query.url;
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log(fullUrl);
  zipURL = fullUrl.split("?");
  zipURL.shift();
  zipURL = zipURL.join("?").substr(4);
  let idx1 = zipURL.indexOf("%2F") + 3,
    idx2 = zipURL.indexOf(".zip");
  let extractedDirName = zipURL.substr(idx1, idx2 - idx1);
  let unzipPipe = unzip.Extract({
    path: __dirname + `/contents/${extractedDirName}`,
  });

  function returnTo() {
    let file = __dirname + `/contents/${extractedDirName}/tincan.xml`;

    fs.readFile(file, function (err, data) {
      let document = new xmldoc.XmlDocument(data);
      let url = "";
      document
        .childNamed("activities")
        .childrenNamed("activity")
        .forEach((activityElement) => {
          url = activityElement.childNamed("launch").val;
        });
      return res.redirect(`/player.html?url=${url}`);
    });
  }
  if (fs.existsSync(__dirname + `/contents/${extractedDirName}`)) {
    console.log("Already Exist");
    return returnTo();
  }

  unzipPipe.on("close", function () {
    return returnTo();
  });

  request(zipURL).pipe(unzipPipe);
});

app.listen(8000, function () {
  console.log("SCORM server is running on port 8000!");
});
