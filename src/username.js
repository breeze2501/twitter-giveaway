import fs from "fs";
import needle from "needle";

async function fetchNameOfId(id) {
  const res = await needle("get", `https://api.twitter.com/2/users/${id}`, {}, {
    headers: {
      authorization: `Bearer ${process.env["BEARER_TOKEN"]}`
    },
  });
  if (res.statusCode !== 200) {
    throw new Error(res.statusCode);
  } else {
    return res.body.data.username;
  }
}

export async function fetchIdToName(tweetId) {
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

  const ids = new Set(Object.keys(authorIdToText));

  const path = `./cache/${tweetId}/id_to_name.txt`;
  const idToName = fs.existsSync(path) ?
    JSON.parse(fs.readFileSync(path, "utf-8")):
    {};
  for (const id of ids) {
    if (id in idToName === false) {
      idToName[id] = await fetchNameOfId(id);
      console.log(idToName[id]);
      fs.writeFileSync(path, JSON.stringify(idToName, null, 2));
    }
  }
}
