import {Client, Intents, TextChannel, User} from 'discord.js';
import configFile from '../config';
import {writeFileSync, existsSync} from 'fs'
import TicketManager from './ticketManager';

const client = new Client({"intents":["GUILDS"]});
const config:Config = configFile;
const ticketManager = new TicketManager(client)

client.once('ready', () => {
    if(existsSync("./commands_created.flag") && (!config.developer || !config.developer.bypassFlagCheck))return;
    client.guilds.cache.get(config.tickets.guild_id as `${bigint}`).commands.create({
        "name":"listen",
        "description":"Send message for users to create ticket"
    });
    writeFileSync("./commands_created.flag", "true")
});

client.on("interactionCreate", (interaction) => {
    /** Listen for / command to post message for starting a ticket */
    if(interaction.isCommand() && interaction.commandName == "listen"){
        if(!config.users.whitelisted.includes(interaction.member?interaction.member.user.id:interaction.user.id))
            return interaction.reply({"content":"You aren't authorized to perform this action.", "ephemeral":true})
        interaction.defer({
            "ephemeral":true
        }).then(() => {
            if(!interaction.guild.me.permissionsIn(interaction.channelId).has("SEND_MESSAGES") || !interaction.guild.me.permissionsIn(interaction.channelId).has("VIEW_CHANNEL"))
                return interaction.followUp({content:"Unable to setup message in this channel. Make sure I have the correct permissions to send a message here."});
            (interaction.guild.channels.cache.get(interaction.channelId) as TextChannel).send({
                "content":config.tickets.message,
                "components":[
                    {
                        "type":1,
                        "components":[
                            {
                                "type":"BUTTON",
                                "label":"Open a ticket",
                                "customId":"open_ticket",
                                "style":"SECONDARY"
                            }
                        ]
                    }
                ]
            }).then(() => {
                interaction.followUp({
                    "content":`Ready to listen for ticket requests in <#${interaction.channelId}>!`
                })
            })
        })
        .catch(console.error    )
    };

    if(interaction.isButton() && interaction.customId == "open_ticket"){
        interaction.reply({
            "content":"Ticket will be available shortly...",
            "ephemeral":true
        }).then(() => {
            ticketManager.create({
                guildID:interaction.guildId,
                userID:interaction.member.user.id,
                topic:config.tickets.topic,
                user:interaction.member.user as User
            })  
        })
    }

    if(interaction.isButton() && interaction.customId.startsWith("tickets_close")){
        let channel_id = interaction.customId.split("tickets_close_")[1]
        interaction.reply({
            "embeds":[
                {
                    "description":`<@${interaction.member.user.id}> has closed the ticket.`,
                    "color":"RED"
                },
                // {
                //     "description":"```Staff Controls```"
                // }
            ],
            // "components":[
            //     {
            //         "type":1,
            //         "components":[
            //             {
            //                 "type":"BUTTON",
            //                 "label":"Delete Ticket Channel",
            //                 "customId":`ticket_delete_${channel_id}`,
            //                 "style":"DANGER"
            //             }
            //         ]
            //     }
            // ]
        })
        .then(() => {
            let ticketChannel = client.channels.cache.get(`${channel_id as any as bigint}`) as TextChannel;
            ticketChannel.permissionOverwrites.delete(`${interaction.member.user.id}`, `Ticket closed by <@${interaction.member.user.id}>`)
            .then(() => {
                ticketChannel.edit({
                    "parentId":`${config.tickets.archivedCategory as any as bigint}`
                }).then(() => {
                    ticketChannel.lockPermissions()
                })
            })
        })
    }
});

client.login(config.bot.token);