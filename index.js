const discord = require("discord.js");
const ytdl = require("ytdl-core-discord");
require("dotenv/config");
const client = new discord.Client();

const token = process.env.TOKEN;

client.on("ready", () => {
	console.log(`bot ta rodando como ${client.user.tag}`);
});

client.on("message", (msg) => {
	let working = null;
	const args = msg.content.split(" ");
	if (args[0] === "pomodoro") {
		console.log(working);
		console.log("pomodoro");
		pomodoro(args, msg);
	}
	if (args[0] === "wimhof") {
		console.log(working);
		console.log("wimhof");
		wimhof(msg);
	}
});

async function wimhof(msg) {
	if (!working) {
		msg.channel.send("hora de transcender");
		const voiceChannel = msg.member.voice.channel;
		await voiceChannel.join().then(async (connection) => {
			console.log("vaidaroplay");
			working = true;

			const dispatcher = connection.play(
				await ytdl("https://www.youtube.com/watch?v=tybOi4hjZFQ&t"),
				{
					type: "opus",
				}
			);

			const totalStreamTime = dispatcher.totalStreamTime;
			sleep(totalStreamTime);
			working = false;
		});
	} else {
		console.log("ta trabalhando já...");
	}
}

async function pomodoro(args, msg) {
	console.log(args);
	const voiceChannel = msg.member.voice.channel;
	const members = voiceChannel.members;

	const workTime = args[1] * 60000 || 1500000; // 25 minutes
	const restTime = args[2] * 60000 || 300000; // 5 minutes
	const rounds = args[3] || 4;
	const ytLink = args[4] || "https://www.youtube.com/watch?v=dxi61ckiSnU";

	if (args[1] === "sai") {
		console.log("deve ter saído");

		for (let guildMember of members.values()) {
			if (!guildMember.user.bot) {
				guildMember.voice.setMute(false);
			}
		}
		working = false;
		voiceChannel.leave();
		// bot continua no muteLoop msm dps de sair. consertar dps
	} else if (args[1] === "ajuda") {
		msg.reply(
			"só escrever: pomodoro x y z linkProAudio\n onde x: minutos trabalhando\n y: minutos descansando \n z: rounds " +
				"\n ou vc pode só passar os x y z" +
				"\n ou vc pode só passar o linkProAudio" +
				"\n ou vc pode só escrever pomodoro"
		);
	} else if (!working) {
		if (ytdl.validateURL(args[1])) {
			pomodoroMsg(msg, workTime, restTime, rounds);

			await voiceChannel.join().then(async (connection) => {
				await muteLoop(
					connection,
					members,
					workTime,
					restTime,
					rounds,
					args[1]
				);
				voiceChannel.leave();
			});
		} else {
			pomodoroMsg(msg, workTime, restTime, rounds);

			await voiceChannel.join().then(async (connection) => {
				await muteLoop(connection, members, workTime, restTime, rounds, ytLink);
				voiceChannel.leave();
			});
		}
	}
}

function pomodoroMsg(msg, workTime, restTime, rounds) {
	msg.reply(
		`partiu dxar de ser vagabundo. \n${workTime / 60000} minutos trabalhando\n${
			restTime / 60000
		} minutos descansando\n${rounds} rounds`
	);
}

async function muteLoop(
	connection,
	members,
	workTime,
	restTime,
	rounds,
	ytLink
) {
	working = true;
	for (let i = 0; i < rounds; i++) {
		console.log("começou o tempo");
		// for (let guildMember of members.values()) {
		// 	if (!guildMember.user.bot) {
		// 		guildMember.voice.setMute(true);
		// 	}
		// }

		await connection.play(await ytdl(ytLink), { type: "opus" });
		await sleep(workTime);

		console.log("terminou o tempo");
		// for (let guildMember of members.values()) {
		// 	if (!guildMember.user.bot) {
		// 		guildMember.voice.setMute(false);
		// 	}
		// }

		await connection.play(await ytdl(ytLink), { type: "opus" });
		await sleep(restTime);
	}
	working = false;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

client.login(token);
