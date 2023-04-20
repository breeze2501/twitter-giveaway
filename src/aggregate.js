import fs from "fs";
import needle from "needle";
import { pick } from "./pick.js";

function getFollowers(userId) {
  const followers = new Set();
  const lines = fs.readFileSync(`./cache/${userId}/Follower/result.txt`, 'utf-8').split(/\r?\n/);
  console.log(lines[lines.length - 1]);
  lines.pop();
  for (const line of lines) {
    const body = JSON.parse(line);
    if (body.meta.result_count > 0) {
      for (const item of body.data) {
        followers.add(item.username);
      }
    }
  }
  return followers;
}

function getRetweets(tweetId) {
  const followers = new Set();
  const lines = fs.readFileSync(`./cache/${tweetId}/Retweet/result.txt`, 'utf-8').split(/\r?\n/);
  console.log(lines[lines.length - 1]);
  lines.pop();
  for (const line of lines) {
    const body = JSON.parse(line);
    if (body.meta.result_count > 0) {
      for (const item of body.data) {
        followers.add(item.username);
      }
    }
  }
  return followers;
}

function getLikes(tweetId) {
  const followers = new Set();
  const lines = fs.readFileSync(`./cache/${tweetId}/Like/result.txt`, 'utf-8').split(/\r?\n/);
  console.log(lines[lines.length - 1]);
  lines.pop();
  for (const line of lines) {
    const body = JSON.parse(line);
    if (body.meta.result_count > 0) {
      for (const item of body.data) {
        followers.add(item.username);
      }
    }
  }
  return followers;
}

function matchTag3(text) {
  const re = /@(\w){1,15}.*@(\w){1,15}.*@(\w){1,15}/;
  const t = text.replace(/(\r\n|\n|\r)/gm, " ");
  const m = re.exec(t);
  return m !== null;
}

function matchNear(text) {
  return fetchNear(text) !== null;
}

function fetchNear(text) {
  const t = text.toLowerCase();
  const re = /((([a-z|\d]+[\-_])*[a-z|\d]+\.)+near)/;
  // Include implicit accounts
  // const re = /((([a-z|\d]+[\-_])*[a-z|\d]+\.)+near)|([a-z|\d]{64})/;
  const m = re.exec(t);
  if (m !== null) {
    return m[0];
  } else {
    return null;
  }
}

async function fetchNameOfId(id) {
  const res = await needle("get", `https://api.twitter.com/2/users/${id}`, {}, {
    headers: {
      authorization: `Bearer ${process.env["BEARER_TOKEN"]}`
    },
  });
  console.log(res.body);
  return res.body.content;
}

async function getNameToText(tweetId) {
  const authorIdToText = {};

  const lines = fs.readFileSync(`./cache/${tweetId}/Reply/result.txt`, 'utf-8').split(/\r?\n/);
  console.log(lines[lines.length - 1]);
  lines.pop();
  for (const line of lines) {
    const body = JSON.parse(line);
    if (body.meta.result_count > 0) {
      for (const item of body.data) {
        authorIdToText[item.author_id] = item.text;
      }
    }
  }

  const idToName = JSON.parse(fs.readFileSync(`./cache/${tweetId}/id_to_name.txt`, "utf-8"));

  const nameToText = {};
  for (const [id, text] of Object.entries(authorIdToText)) {
    nameToText[idToName[id]] = text;
  }

  return nameToText;
}

export async function aggregate(tweetId, userIds, outputFile) {
  const sets = [];

  userIds.forEach(
    userId => {
      const followers = getFollowers(userId);
      console.log(userId, followers.size, "followers");
      sets.push(followers);
    }
  );

  const retweets = getRetweets(tweetId);
  console.log(retweets.size, "retweets");
  sets.push(retweets);

  const likes = getLikes(tweetId);
  console.log(likes.size, "likes");
  sets.push(likes);

  const candidates = new Set();

  const nameToText = await getNameToText(tweetId);

  for (const u of likes) {
    if (sets.every(x => x.has(u))) {
      if (u in nameToText) {
        const text = nameToText[u];
        if (matchNear(text) && matchTag3(text)) {
          candidates.add(u);
        }
      }
    }
  }

  console.log(candidates.size, "candidates");

  // const pickeds = shuffle(Array.from(candidates)).slice(0, 200);
  const pickeds = pick(candidates);
  for (const picked of pickeds) {
    const s = `${picked},${fetchNear(nameToText[picked])}`;
    console.log(s);
    fs.appendFileSync(outputFile, s, "utf-8");
  }
}
