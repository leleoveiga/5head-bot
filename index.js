const discord = require("discord.js");
require("dotenv/config");
const client = new discord.Client();

const token = process.env.TOKEN;

client.on("ready", () => {
	console.log(`bot ta rodando como ${client.user.tag}`);
});

client.on("message", (msg) => {
	const args = msg.content.split(" ");
	if (args[0] === "pomodoro") {
		// const args = msg.content.substring(PREFIX.length).split(" ");
		console.log(args);
		const voiceChannel = msg.member.voice.channel;
		const members = voiceChannel.members;

		if (args[1] === "sai") {
			for (let [key, guildMember] of members) {
				if (!guildMember.user.bot) {
					guildMember.voice.setMute(false);
				}
			}
			voiceChannel.leave();
		} else {
			msg.reply("partiu dxar de ser vagabundo");
			const workingTime = args[1] * 60000;
			const restTime = args[2] * 60000;
			// const workingTime = args[1];
			// const restTime = args[2];

			voiceChannel.join().then((connection) => {
				const rounds = args[3];
				muteLoop(members, workingTime, restTime, rounds);
			});
		}
	}
});

async function muteLoop(members, workingTime, restTime, rounds) {
	for (let i = 0; i < rounds; i++) {
		// const dispatcher = connection.play('./startAudio.mp3');
		console.log("começou o tempo");
		for (let [key, guildMember] of members) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(true);
			}
		}
		await sleep(workingTime);
		console.log("terminou o tempo");
		for (let [key, guildMember] of members) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(false);
			}
		}
		await sleep(restTime);

		// const dispatcher = connection.play('./startAudio.mp3');
		// dispatcher.on("end", end => {
		// 	voiceChannel.leave();
		// });
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

client.login(token);
