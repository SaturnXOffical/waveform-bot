const Discord = require('discord.js')

const client = new Discord.Client();


const queue = new Map();

const {
	prefix,
	token,
  wfcol,
  invalMsg,
  version,
} = require('./waveform-settings.json');

const ytdl = require('ytdl-core');

const printtoken = false  // toggle for logging token in console upon startup

// Ensure that FFmpeg is installed to your PC and not just in nodejs


client.once('ready', () => {
   if(printtoken === true){
       console.log(`.\nWaveform is online with the applied settings:\n \nWaveform Embed Color: ${wfcol} - HEX \nMessage Prefix: ${prefix} \nBot Token: ${token}`)
   } else{
    console.log(`Waveform is online with the applied settings:\n \nWaveform Embed Color: ${wfcol} - HEX \nMessage Prefix: ${prefix} \nBot Token: *printtoken is disabled`)
   }
   });
   client.once('reconnecting', () => {
    console.log('Waveform is reconnecting to a voice channel');
   });
   client.once('disconnect', () => {
    console.log('Waveform has disconnected from a voice channel');
   });





// dont judge how i do command handlers - i tried folder commands and yet again they didn't want to work

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    const serverQueue = queue.get(message.guild.id);
  
    if (message.content.startsWith(`${prefix}play`)) {
      execute(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
      skip(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
      stop(message, serverQueue);
      return;
    } else if (message.content.startsWith(`${prefix}help`)){
      message.channel.send(new Discord.MessageEmbed()
      .setTitle('Help & Information')
      .setColor(wfcol)
      .setDescription('Waveform - The Music Bot\n \n**Commands List**\nRun `waveform/commands`\n\n**Support Server**\nhttps://discord.gg/QdEFQ8rKX7\n\n**Prefix**\nwaveform/ \nUsage example: waveform/play https://www.youtube.com/watch?v=tQ0yjYUFKAE \n\n**Please read! Notice**\nWaveform is in an early alpha stage, meaning all features are not complete or unstable.\n`And for now, you can only use youtube links to play songs`')
      .setFooter(`Made with ❤ by SaturnDev | Version ${version}`)
      )
    } else if (message.content.startsWith(`${prefix}commands`)){
      message.channel.send(new Discord.MessageEmbed()
      .setColor(wfcol)
      .setTitle('Commands List - Members')
      .setFooter(`Version ${version} ALPHA | Prefix is "waveform/"`)
      .setDescription('Commands List for Members \n \n**waveform/play (youtube link)** - Plays audio from a YouTube link and adds it to the queue\n**waveform/skip** - Skips the currently playing song and plays the next song in the queue \n**waveform/stop** - Clears queue and disconnects the bot from the voice channel')
      )
    } else{
      message.channel.send(invalMsg);
    } 
  });
  
  async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
      return message.channel.send(
        "I need the permissions to join and speak in the voice channel!"
      );
    }
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
     };
  
    if (!serverQueue) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        return message.channel.send(err);
      }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`**${song.title}** has been added to the queue!`);
    }
  }
  
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
    if (!serverQueue)
      return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
  }
  
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send(
        "You have to be in a voice channel to stop the music!"
      );
      
    if (!serverQueue)
      return message.channel.send("There is no song that I could stop!");
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Now playing: **${song.title}**`);
  }
  
  client.login(token);  // ensure token is correct in waveform-settings.json