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
            workingStateList: [],
        });
    }
    console.log(serversWorkers);
}

client.on("ready", () => {
    console.log(`bot ta rodando como ${client.user.tag}`);
    client.user.setActivity("digite: pomodoro ajuda", {
        type: "PLAYING",
        url: "https://github.com/leleoveiga/5head-bot",
    });
    addGuildsToList();
});

client.on("guildCreate", (guild) => {
    console.log(`bot entrou no: ${guild.name}`);
    serversWorkers.push({
        guildId: guild.id,
        guildName: guild.name,
        workingStateList: [],
    });
    console.log(serversWorkers);
});

function isWorking(guildId, workingIndex) {
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    workingIndex = workingIndex || guild.workingStateList.length - 1;

    console.log(guild, `o estado da posição ${workingIndex} foi consultado`);
    return guild.workingStateList[workingIndex];
}

function switchGuildWorkingState(guildId, state, workingIndex) {
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    workingIndex = workingIndex || guild.workingStateList.length - 1;
    if (guild.workingStateList.length != 0) {
        guild.workingStateList[workingIndex] = state;

        console.log(
            guild,
            `mudou o estado na posição ${workingIndex} foi mudado pra ${state}`
        );
    }
}

function addGuildWorkingState(guildId, state) {
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    const index = guild.workingStateList.push(state);
    console.log(
        guild,
        `o estado de trabalho ${state} foi adicionado nessa guild`
    );
    return index;
}

function clearWorkingList(guildId) {
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    guild.workingStateList = [];
    console.log("limpando lista de trabalhos...");
    console.log(guild.workingStateList);
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
        const workingIndex = addGuildWorkingState(guildId, true) - 1;
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
        switchGuildWorkingState(guildId, false, workingIndex);
    } else {
        pomodoroMsg(msg);
    }
}

async function pomodoro(guildId, args, msg) {
    console.log(args);
    const voiceChannel = msg.member.voice.channel;

    const workTime = args[1] * 60000 || 1500000; // 25 minutes
    const restTime = args[2] * 60000 || 300000; // 5 minutes
    const rounds = args[3] || 4;
    const ytLink = args[4] || "https://www.youtube.com/watch?v=2ZIpFytCSVc";

    if (args[1] === "sai") {
        console.log("deve ter saído");
        msg.channel.send("blz, saí");
        voiceChannel.leave(); // bot continua no pomodoroLoop msm dps de sair. consertar dps
        clearWorkingList(guildId);
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
            const ytLink = args[1];
            await voiceChannel.join().then(async (connection) => {
                const workingIndex = addGuildWorkingState(guildId, true) - 1;
                await pomodoroLoop(
                    guildId,
                    workingIndex,
                    connection,
                    msg.channel,
                    workTime,
                    restTime,
                    rounds,
                    ytLink
                );
                voiceChannel.leave();
                switchGuildWorkingState(guildId, false, workingIndex);
            });
        } else {
            pomodoroMsg(msg, workTime, restTime, rounds);

            voiceChannel.join().then(async (connection) => {
                const workingIndex = addGuildWorkingState(guildId, true) - 1;
                await pomodoroLoop(
                    guildId,
                    workingIndex,
                    connection,
                    msg.channel,
                    workTime,
                    restTime,
                    rounds,
                    ytLink
                );
                voiceChannel.leave();
                switchGuildWorkingState(guildId, false, workingIndex);
            });
        }
    } else {
        pomodoroMsg(msg);
    }
}

async function pomodoroLoop(
    guildId,
    workingIndex,
    connection,
    channel,
    workTime,
    restTime,
    rounds,
    ytLink
) {
    let roundsCount = rounds;
    if (rounds == 0) rounds = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < rounds * 2; i++) {
        if (connection.status === 4 || !isWorking(guildId, workingIndex)) break;
        await connection.play(await ytdl(ytLink), { type: "opus" });

        // se for round de trabalhar
        if (i % 2 == 0) {
            channel.send("começou o trabalho");
            await sleep(workTime);
        }
        // se for round de descanso
        else {
            if (i < rounds * 2 - 1) {
                if (rounds != Number.MAX_SAFE_INTEGER) {
                    channel.send(
                        `começou o descanso\nainda faltam ${--roundsCount} rounds`
                    );
                } else if (rounds == Number.MAX_SAFE_INTEGER) {
                    channel.send(`começou o descanso...`);
                }
                await sleep(restTime);
            } else {
                //caso seja o último round, ele só descansa a duração do áudio
                const seconds = await videoLength(ytLink);
                await sleep(seconds * 3000);
                channel.send(`sessão do pomodoro cabou`);
            }
        }
    }
}

async function videoLength(ytLink) {
    const info = await ytdl.getInfo(ytLink);
    // console.log(info.videoDetails.lengthSeconds)
    return info.videoDetails.lengthSeconds;
}

function pomodoroMsg(msg, workTime, restTime, rounds) {
    if (rounds == 0) rounds = "∞";
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
