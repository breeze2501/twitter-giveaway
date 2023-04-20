# twitter-giveaway

## Usage

```bash
BEARER_TOKEN="XXXX" ./src/cli.js --tweet tweetId --follow userId0 userId1 --outputFile ./winners.csv
```

--tweet: The giveaway tweet. Participants should like, retweet and reply this tweet.

--follow: IDs of Twitter users that participants should follow. You can convert username to ID using [https://tweeterid.com/](https://tweeterid.com/).

Replace these functions on your demand:

1. `matchTag3` and `matchNear` in `aggregate.js`.
2. `pick` in `pick.js`.
