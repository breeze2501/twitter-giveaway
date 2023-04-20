import fs from "fs";
import needle from "needle";

function cachePath(tweetId) {
  return `./cache/${tweetId}/${Like.name}`;
}

export class Like {
  constructor(tweetId) {
    this.tweetId = tweetId;
    this.resultThisTime = null;

    const path = cachePath(tweetId);
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    const nextTokenPath = `${path}/next_token.txt`;
    this.nextToken = fs.existsSync(nextTokenPath) ?
      fs.readFileSync(nextTokenPath, "utf-8"):
      null;
  }

  save() {
    const path = cachePath(this.tweetId);
  
    const resultPath = `${path}/result.txt`;
    if (this.resultThisTime !== null) {
      fs.appendFileSync(resultPath, `${JSON.stringify(this.resultThisTime)}\n`);
    }

    const nextTokenPath = `${path}/next_token.txt`;
    fs.writeFileSync(nextTokenPath, this.nextToken);
  }

  url() {
    return `https://api.twitter.com/2/tweets/${this.tweetId}/liking_users`;
  }

  hasNext() {
    return this.nextToken === null || this.nextToken !== "";
  }

  async fetch() {
    console.log(this.url());
    console.log(this.nextToken);

    const param = {};
    if (this.nextToken !== null) {
      param.pagination_token = this.nextToken;
    }
    const res = await needle("get", this.url(), param, {
      headers: {
        authorization: `Bearer ${process.env["BEARER_TOKEN"]}`
      },
    });
    this.resultThisTime = res.body;
    if ("next_token" in this.resultThisTime.meta) {
      this.nextToken = this.resultThisTime.meta.next_token;
    } else {
      this.nextToken = "";
    }
  }

  async fetchAndSaveAll() {
    while (this.hasNext()) {
      await this.fetch();
      this.save();
    }
  }
}
