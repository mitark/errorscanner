import { isEqual } from "lodash";
import { results, servers } from "./useErrorScanner";
import { isMorning } from "./utils.js";

let sentServerNotFoundMessage = false; // Flag to track if server not found message has been sent
let yesterdaysErrors = {}; // Object to store previous errors to detect new errors
let serversWithNewErrors = [];
let newErrorCountObject = {};

export function sendToSlack() {
  var unreachableServers = []; //this is used in sendServerNotFoundMessage and serverIsOutOfReach functions
  if (isMorning()) {
    for (const server of servers) {
      findServersWithNewErrors(server);
    }
    sendMorningMessage();
    serversWithNewErrors = [];
  }

  if (serverIsOutOfReach(unreachableServers) && !sentServerNotFoundMessage) {
    sendServerNotFoundMessage(unreachableServers);
    sentServerNotFoundMessage = true;
    setTimeout(() => {
      sentServerNotFoundMessage = false;
    }, 5 * 60 * 1000);
  }
}

function findServersWithNewErrors(server) {
  const errors = Object.values(results[server].relevantErrorsObject).flat();
  const newErrors = errors.filter((error) => !yesterdaysErrors[server]?.some((e) => isEqual(error, e)));
  if (newErrors.length > 0) {
    serversWithNewErrors.push(server);
  }
  newErrorCountObject[server] = newErrors.length;
  yesterdaysErrors[server] = errors;
}

function sendMorningMessage() {
  const fields = servers.map((server) => ({
    type: "mrkdwn",
    text: `*${server}:*\n ${results[server].diskSpace.join("\n")}`,
  }));

  const serverLinkList = serversWithNewErrors.map(
    (server) => `<http://10.0.0.34/#${server}|${server} (${newErrorCountObject[server]})>`
  );

  fetch("https://hooks.slack.com/workplace_link", {
    method: "POST",
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Huomenta! Tarkistin palvelimesi",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${servers.join(", ")}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Näillä palvelimilla esiintyi uusia ongelmia. Tutki ongelmia klikkaamalla nimeä. Suluissa näet jo tämän vuorokauden aikana ilmenneet ongelmat.\n${serverLinkList.join(
              ", "
            )}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Palvelimien levyistä on käytetty:*`,
          },
        },
        {
          type: "section",
          fields: fields,
        },
      ],
    }),
  });
}

function serverIsOutOfReach(unreachableServers) {
  let flag = false;
  for (const server of servers) {
    if (results[server].connectionSuccess === false) {
      flag = true;
      unreachableServers.push(server);
    }
  }
  return flag;
}

// Function to send server not found message to Slack
function sendServerNotFoundMessage(unreachableServers) {
  const serverLinkList = unreachableServers.map((server) => {
    if (server === "jateasemat") {
      `<https://jateasemat.fi/kirjautuminen|jateasemat.fi>`;
    } else {
      return `<https://${server}.protieto.com/kirjaudu|${server}.protieto.com>`;
    }
  });

  fetch("https://hooks.slack.com/workplace_link", {
    method: "POST",
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "En saanut näihin palvelimiin yhteyttä:",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\n${unreachableServers.join(
              ", "
            )}\n\nYritin kolmesti ja jatkan vielä yrittämistä. Kyseessä voi olla vain hetkellinen yhteyshäiriö. Voit tarkistaa sivuilta ${serverLinkList.join(
              ", "
            )} ovatko palvelimet pystyssä. Jos en saa palvelimiin yhteyttä, muistutan pian uudelleen.`,
          },
        },
      ],
    }),
  });
}
