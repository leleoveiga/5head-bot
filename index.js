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
            workingState: false,
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
        workingState: false,
    });
    console.log(serversWorkers);
});

function isWorking(guildId) {
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    console.log(guild, `o estado em ${guild.guildName} foi consultado`);
    return guild.workingState;
}

function switchGuildWorkingState(guildId, state) {
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    guild.workingState = state;
    console.log(
        guild,
        `o estado foi mudado pra ${state} em ${guild.guildName}`
    );
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
        voiceChannel.join().then(async (connection) => {
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

    const workTime = args[1] * 60000 || 1500000; // 25 minutes
    const restTime = args[2] * 60000 || 300000; // 5 minutes
    const rounds = args[3] || 0;
    let ytLink = args[4] || "https://www.youtube.com/watch?v=2ZIpFytCSVc";

    if (args[1] === "sai") {
        msg.channel.send("blz, saí");
        kickBot(voiceChannel, guildId);
    } else if (args[1] === "ajuda") {
        msg.reply(
            "só escrever: pomodoro x y z linkProAudio\n onde x: minutos trabalhando\n y: minutos descansando \n z: rounds " +
                "\n ou vc pode só passar os x y z (z, o número de rounds, é opcional)" +
                "\n ou vc pode só passar o linkProAudio" +
                "\n ou vc pode só escrever pomodoro" +
                "\n tbm tem a opção de vc botar som de fundo, pra isso digite: pomodoro fundo linkProVideo"
        );
    } else if (!isWorking(guildId)) {
        if (ytdl.validateURL(args[1])) {
            ytLink = args[1];
        }
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
            msg.channel.send(`sessão do pomodoro cabou`);
            kickBot(voiceChannel, guildId);
        });
    }
    //TODO: refatorar connection
    else if (args[1] === "fundo") {
        const guild = serversWorkers.find((guild) => guild.guildId === guildId);
        ytLink = args[2];
        if (ytLink) {
            voiceChannel.join().then(async (connection) => {
                guild.backgroundSound = ytLink;
                await connection.play(await ytdl(ytLink), { type: "opus" });
            });
        } else {
            voiceChannel.join().then(async (connection) => {
                guild.backgroundSound = "";
                await connection.dispatcher.pause();
            });
        }
    } else {
        pomodoroMsg(msg);
    }
}

function kickBot(voiceChannel, guildId) {
    voiceChannel.leave();
    switchGuildWorkingState(guildId, false);
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
    const guild = serversWorkers.find((guild) => guild.guildId === guildId);
    let roundsCount = rounds;
    if (rounds === 0) rounds = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < rounds * 2; i++) {
        if (connection.status === 4 || !isWorking(guildId)) break;

        //TODO: refatorar para um método q recebe connection, testar on finish return
        connection
            .play(await ytdl(ytLink), { type: "opus" })
            .on("finish", async () => {
                //TODO:fazer voltar ao ponto q tava
                if (guild.backgroundSound)
                    connection.play(await ytdl(guild.backgroundSound), {
                        type: "opus",
                    });
            });

        // se for round de trabalhar
        if (i % 2 === 0) {
            channel.send("começou o trabalho");
            await sleep(workTime);
        }
        // se for round de descanso e n for o ultimo round
        else if (roundsCount - 1 != 0) {
            if (rounds !== Number.MAX_SAFE_INTEGER) {
                channel.send(
                    `começou o descanso\nainda faltam ${--roundsCount} rounds`
                );
            } else {
                channel.send(`começou o descanso...`);
            }
            await sleep(restTime);
        }
    }
}

async function videoLength(ytLink) {
    const info = await ytdl.getInfo(ytLink);
    return info.videoDetails.lengthSeconds;
}

function pomodoroMsg(msg, workTime, restTime, rounds) {
    if (rounds === 0) rounds = "∞";
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
