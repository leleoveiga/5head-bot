const discord = require("discord.js");
const ytdl = require("ytdl-core-discord");
require("dotenv/config");
const client = new discord.Client();

const token = process.env.TOKEN;

const serversWorkers = [];

function addGuildsToList() {
	const guilds = client.guilds.cache.values();
	for (let guild of guilds) {
		serversWorkers.push({
			guildId: guild.id,
			guildName: guild.name,
			working: false,
		});
	}
	console.log(serversWorkers);
}

client.on("ready", () => {
	console.log(`bot ta rodando como ${client.user.tag}`);
	addGuildsToList();
});

client.on("guildCreate", (guild) => {
	console.log(`bot entrou no: ${guild.name}`);
	serversWorkers.push({
		guildId: guild.id,
		guildName: guild.name,
		working: false,
	});
	console.log(serversWorkers);
});

function isWorking(guildId) {
	return serversWorkers.find((guild) => guild.guildId === guildId).working;
}

function switchGuildWorkingState(guildId, state) {
	const guild = serversWorkers.find((guild) => guild.guildId === guildId);
	guild.working = state || !guild.working;
}

client.on("message", (msg) => {
	const guildId = msg.guild.id;
	const args = msg.content.split(" ");
	if (args[0] === "pomodoro") {
		console.log("pomodoro");
		pomodoro(guildId, args, msg);
	}
	if (args[0] === "wimhof") {
		console.log("wimhof");
		wimhof(guildId, msg);
	}
});

async function wimhof(guildId, msg) {
	if (!isWorking(guildId)) {
		switchGuildWorkingState(guildId, true);
		msg.channel.send("hora de transcender");
		const ytLink = "https://www.youtube.com/watch?v=tybOi4hjZFQ&t";
		const voiceChannel = msg.member.voice.channel;
		await voiceChannel.join().then(async (connection) => {
			connection.play(await ytdl(ytLink), {
				type: "opus",
			});

			const seconds = await videoLength(ytLink);
			await sleep(seconds * 1000);
		});
		switchGuildWorkingState(guildId, false);
	} else {
		pomodoroMsg(msg);
	}
}

async function pomodoro(guildId, args, msg) {
	console.log(args);
	const voiceChannel = msg.member.voice.channel;
	const members = voiceChannel.members;

	const workTime = args[1] * 60000 || 1500000; // 25 minutes
	const restTime = args[2] * 60000 || 300000; // 5 minutes
	const rounds = args[3] || 4;
	const ytLink = args[4] || "https://www.youtube.com/watch?v=dxi61ckiSnU";

	if (args[1] === "sai") {
		console.log("deve ter saído");
		voiceChannel.leave(); // bot continua no pomodoroLoop msm dps de sair. consertar dps
		switchGuildWorkingState(guildId, false);
	} else if (args[1] === "ajuda") {
		msg.reply(
			"só escrever: pomodoro x y z linkProAudio\n onde x: minutos trabalhando\n y: minutos descansando \n z: rounds " +
				"\n ou vc pode só passar os x y z" +
				"\n ou vc pode só passar o linkProAudio" +
				"\n ou vc pode só escrever pomodoro"
		);
	} else if (!isWorking(guildId)) {
		if (ytdl.validateURL(args[1])) {
			pomodoroMsg(msg, workTime, restTime, rounds);

			await voiceChannel.join().then(async (connection) => {
				switchGuildWorkingState(guildId, true);
				await pomodoroLoop(
					guildId,
					connection,
					msg.channel,
					workTime,
					restTime,
					rounds,
					args[1]
				);
				voiceChannel.leave();
				switchGuildWorkingState(guildId, false);
			});
		} else {
			pomodoroMsg(msg, workTime, restTime, rounds);

			voiceChannel.join().then(async (connection) => {
				switchGuildWorkingState(guildId, true);
				await pomodoroLoop(
					guildId,
					connection,
					msg.channel,
					workTime,
					restTime,
					rounds,
					ytLink
				);
				voiceChannel.leave();
				switchGuildWorkingState(guildId, false);
			});
		}
	} else {
		pomodoroMsg(msg);
	}
}

async function pomodoroLoop(
	guildId,
	connection,
	channel,
	workTime,
	restTime,
	rounds,
	ytLink
) {
	for (let i = 0; i < rounds; i++) {
		// so pra n ficar rodando caso n esteja trabalhando
		if (!isWorking(guildId)) break;
		if (i !== 0) channel.send("começou o trabalho");

		await connection.play(await ytdl(ytLink), { type: "opus" });
		await sleep(workTime);

		if (i !== rounds - 1)
			channel.send(`começou o descanso\nainda faltam ${rounds - i - 1} rounds`);
		else channel.send(`sessão do pomodoro cabou`);

		await connection.play(await ytdl(ytLink), { type: "opus" });
		if (i !== rounds - 1) await sleep(restTime);
		else {
			//caso seja o último round, ele só descansa a duração do áudio
			const seconds = await videoLength(ytLink);
			await sleep(seconds * 2000);
		}
	}
}

async function videoLength(ytLink) {
	await ytdl.getInfo(ytLink, (info) => {
		return info.length_seconds;
	});
}

function pomodoroMsg(msg, workTime, restTime, rounds) {
	if (!workTime) {
		msg.channel.send(
			"o bot já está tocando algo! digite 'pomodoro sai' pra dar outro comando à ele"
		);
	} else {
		msg.reply(
			`partiu dxar de ser vagabundo. \n${
				workTime / 60000
			} minutos trabalhando\n${
				restTime / 60000
			} minutos descansando\n${rounds} rounds`
		);
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

client.login(token);

// funcões possivelmente úteis dps
// for (let guildMember of members.values()) {
// 	if (!guildMember.user.bot) {
// 		guildMember.voice.setMute(false);
// 	}
// }
