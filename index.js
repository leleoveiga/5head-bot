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

	if (args[1] === "ajuda") {
		client.reply(
			"só escrever: pomodoro x y z\n onde x: minutos trabalhando\n y: minutos descansando \n z: rounds"
		);
	}

	if (args[1] === "sai") {
		for (let [key, guildMember] of members) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(false);
			}
		}
		voiceChannel.leave();
	}

	if (parseInt(args[1]) > 0 && parseInt(args[2]) > 0 && parseInt(args[3]) > 0) {
		msg.reply(
			`partiu dxar de ser vagabundo. \n${args[1]} minutos trabalhando\n${args[2]} minutos descansando\n${args[3]} rounds`
		);
		const workingTime = args[1] * 60000;
		const restTime = args[2] * 60000;
		const rounds = args[3];
		const ytLink = args[4];
		voiceChannel.join().then((connection) => {
			muteLoop(connection, members, workingTime, restTime, rounds, ytLink);
		});
	}
}

async function muteLoop(
	connection,
	members,
	workingTime,
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
		await sleep(workingTime);
		await connection.play(await ytdl(ytLink), { type: "opus" });
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
