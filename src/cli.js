#!/usr/bin/env node
import { Follower } from "./follower.js";
import { Reply } from "./reply.js";
import { Like } from "./like.js";
import { Retweet } from "./retweet.js";
import { fetchIdToName } from "./username.js";
import yargs from "yargs";
import { aggregate } from "./aggregate.js";

const args = yargs(process.argv.slice(2))
  .usage("Usage: $0 --follow user0 user1 --tweet tweetId --outputFile outputFile")
  .option(
    "follow", {
      demand: true,
      array: true,
      describe: "IDs of users who should be followed",
    },
  )
  .option(
    "tweet", {
      demand: true,
      string: true,
      describe: "ID of tweet which should be liked/retweeted/replied",
    },
  )
  .option(
    "outputFile", {
      demand: true,
      string: true,
      describe: "Which file to write picked up winners into",
    },
  )
  .help("h")
  .parseSync();

async function runTasks() {
  const userIds = args.follow;
  const tweetId = args.tweet;

  for (const userId of userIds) {
    await (new Follower(userId)).fetchAndSaveAll();
  }

  await (new Reply(tweetId)).fetchAndSaveAll();
  await (new Like(tweetId)).fetchAndSaveAll();
  await (new Retweet(tweetId)).fetchAndSaveAll();

  await fetchIdToName(tweetId);

  await aggregate(tweetId, userIds, args.outputFile);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop() {
  for(;;) {
    try {
      await runTasks();
      break;
    } catch (e) {
      console.log(e.message, e.stack);
      console.log("Wait for 15 minutes...");
      await sleep(1000 * 60 * 15);
    }
  }
}

loop();
