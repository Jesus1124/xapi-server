/*
 * Make JSON safe for IE6
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/JSON#Browser_compatibility
 */
if (!window.JSON) {
  window.JSON = {
    parse: function (sJSON) {
      /*jslint evil: true */
      return eval("(" + sJSON + ")");
    },
    stringify: function (vContent) {
      var sOutput = "",
        nId,
        sProp;
      if (vContent instanceof Object) {
        if (vContent.constructor === Array) {
          for (nId = 0; nId < vContent.length; nId += 1) {
            sOutput += this.stringify(vContent[nId]) + ",";
          }
          return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
        }
        if (vContent.toString !== Object.prototype.toString) {
          return '"' + vContent.toString().replace(/"/g, "\\$&") + '"';
        }
        for (sProp in vContent) {
          if (vContent.hasOwnProperty(sProp)) {
            sOutput +=
              '"' +
              sProp.replace(/"/g, "\\$&") +
              '":' +
              this.stringify(vContent[sProp]) +
              ",";
          }
        }
        return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
      }
      return typeof vContent === "string"
        ? '"' + vContent.replace(/"/g, "\\$&") + '"'
        : String(vContent);
    },
  };
}

/* Set up TinCanJS */
var tincan = new TinCan({
    recordStores: [
      {
        endpoint: Config.endpoint,
        username: Config.authUser,
        password: Config.authPassword,
        allowFail: false,
      },
    ],
  }),
  PrototypesLauncher = {};

// PrototypesLauncher.Activity = {
//   id: "http://id.tincanapi.com/activity/tincan-prototypes/launcher",
//   definition: {
//     type: "http://id.tincanapi.com/activitytype/lms",
//     name: {
//       "en-US": "Tin Can Prototypes Launcher",
//     },
//     description: {
//       "en-US":
//         "A tool for launching the Tin Can prototypes. Simulates the role of an LMS in launching experiences.",
//     },
//   },
// };
// PrototypesLauncher.context = {
//   contextActivities: {
//     grouping: [
//       {
//         id: "http://id.tincanapi.com/activity/tincan-prototypes",
//       },
//     ],
//     category: [
//       {
//         id: "http://id.tincanapi.com/recipe/tincan-prototypes/launcher/1",
//         definition: {
//           type: "http://id.tincanapi.com/activitytype/recipe",
//         },
//       },
//       {
//         id:
//           "http://id.tincanapi.com/activity/tincan-prototypes/launcher-template",
//         definition: {
//           type: "http://id.tincanapi.com/activitytype/source",
//           name: {
//             "en-US": "Tin Can Launcher Template",
//           },
//           description: {
//             "en-US": "A launch tool based on the Tin Can launch prototypes.",
//           },
//         },
//       },
//     ],
//   },
// };

// tincan.sendStatement(
//   {
//     actor: {
//       name: Config.actor.name,
//       mbox: Config.actor.mbox,
//     },
//     verb: {
//       id: "http://adlnet.gov/expapi/verbs/experienced",
//       display: {
//         "en-US": "experienced",
//       },
//     },
//     object: PrototypesLauncher.Activity,
//     context: {
//       registration: Config.registration,
//       contextActivities: PrototypesLauncher.context.contextActivities,
//     },
//   },
//   function (err, xhr) {
//     console.log("Send state", err);
//     console.log("Send state", xhr);
//   }
// );

$(document).ready(function () {
  var PROTOTYPE_ENDPOINT = Config.endpoint;
  var PROTOTYPE_AUTH =
    "Basic " + Base64.encode(Config.authUser + ":" + Config.authPassword);
  var PROTOTYPE_REGISTRATION = Config.registration || TinCan.Utils.getUUID();
  var actor = { mbox: "mailto:espitaj26@gmail.com", name: "Jesus Espitia" };

  const urlParams = new URLSearchParams(window.location.search);
  const indexFile = urlParams.get("url");
  const ID = urlParams.get("ID");

  sendLaunchedStatement(
    actor,
    "http://id.tincanapi.com/activity/tincan-prototypes/golf-example",
    PROTOTYPE_REGISTRATION
  );

  $("#content").attr(
    "src",
    `/xapi/${ID}/${indexFile}?` +
      "endpoint=" +
      encodeURIComponent(PROTOTYPE_ENDPOINT) +
      "&auth=" +
      encodeURIComponent(PROTOTYPE_AUTH) +
      "&actor=" +
      encodeURIComponent(JSON.stringify(actor)) +
      "&registration=" +
      encodeURIComponent(PROTOTYPE_REGISTRATION)
  );

  var prevResult = null;
  setInterval(function () {
    tincan.getStatements({
      params: {
        limit: 1,
      },
      callback: function (err, res) {
        if (err) {
          console.log(err);
          return;
        }

        if (
          res.statements[0].result &&
          prevResult !== res.statements[0].result
        ) {
          if (!prevResult || prevResult.completion !== res.statements[0].result)
            window.parent.postMessage(
              JSON.stringify({
                type: "completion_status",
                value: res.statements[0].result.completion
                  ? "completed"
                  : "incomplete",
              }),
              "*"
            );
        }

        prevResult = res.statements[0].result;
      },
    });
  }, 1000);
});

function sendLaunchedStatement(actor, activityId, registration) {
  tincan.sendStatement(
    {
      actor: actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/launched",
        display: {
          "en-US": "launched",
        },
      },
      object: {
        id: activityId,
      },
      context: {
        registration: registration,
        contextActivities: {
          grouping: [
            {
              id: "http://id.tincanapi.com/activity/tincan-prototypes",
            },
          ],
          category: [
            {
              id: "http://id.tincanapi.com/recipe/tincan-prototypes/launcher/1",
              definition: {
                type: "http://id.tincanapi.com/activitytype/recipe",
              },
            },
            {
              id:
                "http://id.tincanapi.com/activity/tincan-prototypes/launcher-template",
              definition: {
                type: "http://id.tincanapi.com/activitytype/source",
                name: {
                  "en-US": "Tin Can Launcher Template",
                },
                description: {
                  "en-US":
                    "A launch tool based on the Tin Can launch prototypes.",
                },
              },
            },
          ],
        },
      },
    },
    function (err, xhr) {}
  );
}
