const discord = require("discord.js");
const ytdl = require("ytdl-core-discord");
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
		pomodoro(args, msg);
	}
});

function pomodoro(args, msg) {
	console.log(args);
	const voiceChannel = msg.member.voice.channel;
	const members = voiceChannel.members;

	const workTime = args[1] * 60000 || 1500000; // 25 minutes
	const restTime = args[2] * 60000 || 300000; // 5 minutes
	const rounds = args[3] || 4;
	const ytLink = args[4] || "https://www.youtube.com/watch?v=dxi61ckiSnU";

	if (args[1] === "ajuda") {
		client.reply(
			"só escrever: pomodoro x y z\n onde x: minutos trabalhando\n y: minutos descansando \n z: rounds"
		);
	} else if (args[1] === "sai") {
		console.log("deve ter saído");
		for (let [key, guildMember] of members) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(false);
			}
		}
		voiceChannel.leave();
	} else if (ytdl.validateURL(args[1])) {
		msg.reply(
			`partiu dxar de ser vagabundo. \n${
				workTime / 60000
			} minutos trabalhando\n${
				restTime / 60000
			} minutos descansando\n${rounds} rounds`
		);
		voiceChannel.join().then(async (connection) => {
			await muteLoop(connection, members, workTime, restTime, rounds, args[1]);
			voiceChannel.leave();
		});
	} else {
		msg.reply(
			`partiu dxar de ser vagabundo. \n${
				workTime / 60000
			} minutos trabalhando\n${
				restTime / 60000
			} minutos descansando\n${rounds} rounds`
		);
		voiceChannel.join().then(async (connection) => {
			await muteLoop(connection, members, workTime, restTime, rounds, ytLink);
			voiceChannel.leave();
		});
	}
}

async function muteLoop(
	connection,
	members,
	workTime,
	restTime,
	rounds,
	ytLink
) {
	for (let i = 0; i < rounds; i++) {
		console.log("começou o tempo");
		for (let [key, guildMember] of members) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(true);
			}
		}
		await connection.play(await ytdl(ytLink), { type: "opus" });
		await sleep(workTime);
		console.log("terminou o tempo");
		for (let [key, guildMember] of members) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(false);
			}
		}
		await connection.play(await ytdl(ytLink), { type: "opus" });
		await sleep(restTime);

		// const dispatcher = connection.play('./startAudio.mp3');
		// dispatcher.on("end", end => {
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

client.login(token);
