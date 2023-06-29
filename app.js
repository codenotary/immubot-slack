const { App } = require('@slack/bolt');
const axios = require('axios');

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // add this
  appToken: process.env.SLACK_APP_TOKEN // add this
});

const send_to_vault = async function(data) {
	const resp = await axios.put("https://vault.immudb.io/ics/api/v1/ledger/default/collection/default/document", data, {
			headers: {
				"accept": "application/json",
				"Content-Type": "application/json",
				"X-API-Key": process.env.IMMUDB_VAULT_TOKEN
			}
		});
 
		console.log("immu resp:", resp['status']);
};

app.event('message', async ({ event, say }) => {
	Object.keys(event).forEach((prop)=> console.log(prop));
	/*
	// Object.keys(event).forEach((prop)=> console.log(prop));
	client_msg_id
	type
	text
	user
	ts
	blocks
	team
	channel
	event_ts
	channel_type
	*/

	if ('subtype' in event && event.subtype == 'message_deleted') {

		json = {
			"type": event.subtype,
			"author": event.previous_message.user,
			"channel": event.channel,
			"previous_message": event.previous_message.text
        }

		send_to_vault(json);

		await say(`Seems like <@${event.previous_message.user}> deleted a message with content "${event.previous_message.text}"`);
	}

	if ('subtype' in event && event.subtype == 'message_changed') {

		json = {
			"type": event.subtype,
			"author": event.message.user,
			"channel": event.channel,
			"message": event.message.text,
			"previous_message": event.previous_message.text
        }

		send_to_vault(json);

		const result = await app.client.chat.postMessage({
			channel: event.channel,
			thread_ts: event.message.ts,
      		text: `easy tiger <@${event.message.user}>, this is immutable: text "${event.message.text}" previously was "${event.previous_message.text}"`
    	});

		//	await say(`Event type is ${event.subtype} and text is ${event.message.text} and previous is ${event.previous_message.text} and ts of event is ${event.message.ts}`, thread_ts=event.ts);
	}
});


(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

