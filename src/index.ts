import {Client, GuildMemberRoleManager, Intents, Message, MessageButton, TextChannel, User} from 'discord.js';
import configFile from '../config';
import {writeFileSync, existsSync} from 'fs'
import TicketManager from './ticketManager';
import CooldownStore from './cooldown';
import r, { Connection } from 'rethinkdb'
import openTicketWithMessage from './ctx_commands_msg/openTicketWithMessage';
import openTicketCtxButton from './ctx_commands_user/openTicketCtxButton';
import openTicketWithMessageAndUser from './ctx_commands_msg/openTicketWithMessageAndUser';

const client = new Client({"intents":["GUILDS"]});
const config:Config = configFile;
const ticketManager = new TicketManager(client)
const cooldowns = new CooldownStore(config.tickets.maxTickets)
let connnection:Connection;

client.once('ready', () => {
    console.log("Bot ready.")
    if(existsSync("./commands_created.flag") && (!config.developer || !config.developer.bypassFlagCheck))return;
    client.guilds.cache.get(config.tickets.guild_id as `${bigint}`).commands.set([]).then(() => {
        client.guilds.cache.get(config.tickets.guild_id as `${bigint}`).commands.create({
            "name":"listen",
            "description":"Send message for users to create ticket"
        })
        .then(() => {
            client.guilds.cache.get(config.tickets.guild_id as `${bigint}`).commands.create({
                "name":"Ticket w/user",
                "type":"USER"
            })
            .then(() => {
                client.guilds.cache.get(config.tickets.guild_id as `${bigint}`).commands.create({
                    "name":"Ticket w/msg",
                    "type":"MESSAGE"
                })
                .then(() => {
                    client.guilds.cache.get(config.tickets.guild_id as `${bigint}`).commands.create({
                        "name":"Ticket w/msg&user",
                        "type":"MESSAGE"
                    })
                    .catch(console.error);
                })
                .catch(console.error);
            })
            .catch(console.error);
        })
        .catch(console.error);
    })
    writeFileSync("./commands_created.flag", "true")
});

client.on("interactionCreate", (interaction) => {
    /** Listen for / command to post message for starting a ticket */
    if(interaction.isCommand() && interaction.commandName == "listen"){
        if(!config.users.whitelisted.includes(interaction.member?interaction.member.user.id:interaction.user.id))
            return interaction.reply({"content":"You aren't authorized to perform this action.", "ephemeral":true}).catch(console.error)
        interaction.deferReply({
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
        .catch(console.error)
    };

    if(interaction.isButton() && interaction.customId == "open_ticket"){
        if((interaction.member.roles as GuildMemberRoleManager).cache.has(config.users.blacklistedRole) && config.users.whitelisted.includes(interaction.member.user.id))
            return interaction.reply({
                "content":":warning: **Conflicting Permissions**: You are both whitelisted and have the blacklisted role. Please either fix your roles, or change bot settings.",
                "ephemeral":true
            }).catch(console.error);
        if((interaction.member.roles as GuildMemberRoleManager).cache.has(config.users.blacklistedRole))
            return interaction.reply({
                "content":"You are blacklisted of creating new tickets. Contact server staff for more information.",
                "ephemeral":true
            }).catch(console.error);
        if(cooldowns.underCooldown(interaction.member.user.id))
            return interaction.reply({
                "content":config.tickets.maxTicketsMessage || `You have ${config.tickets.maxTickets == 1?"already opened a ticket":`reached the max amount of tickets you can open (${config.tickets.maxTickets})`}. Please use your existing ${config.tickets.maxTickets == 1?"ticket":"tickets"}.`,
                "ephemeral":true
            }).catch(console.error);
        if(!cooldowns.storeExists(interaction.member.user.id))
            cooldowns.start(interaction.member.user.id);
        cooldowns.addTicketCount(interaction.member.user.id);
        interaction.reply({
            "content":config.tickets.ticketOpenedMessage?.replace(/\!{(REMAINING)\}!/g, `${config.tickets.maxTickets-cooldowns.store[interaction.member.user.id].openTickets}`).toString() || `Your ticket is being created... ${cooldowns.store[interaction.member.user.id].openTickets >= config.tickets.maxTickets?"This is the last ticket you can create. Close existing tickets to create more.":`You can create ${config.tickets.maxTickets-cooldowns.store[interaction.member.user.id].openTickets} more tickets after this.`}`,
            "ephemeral":true
        }).then(() => {
            ticketManager.create({
                guildID:`${BigInt(interaction.guildId)}`,
                userID:interaction.member.user.id,
                topic:config.tickets.topic,
                user:interaction.member.user as User,
                openedWith:"BUTTON",
                reason:"NEW"
            })  
        })
        .catch(console.error)
    }
    
    if(interaction.isContextMenu() && interaction.commandName == "Ticket w/user"){
        openTicketCtxButton.execute({interaction:interaction, cooldowns:cooldowns, ticketManager:ticketManager})
    }

    if(interaction.isContextMenu() && interaction.commandName == "Ticket w/msg"){
        openTicketWithMessage.execute({interaction:interaction, cooldowns:cooldowns, ticketManager:ticketManager})
    }

    if(interaction.isContextMenu() && interaction.commandName == "Ticket w/msg&user"){
        openTicketWithMessageAndUser.execute({interaction:interaction, cooldowns:cooldowns, ticketManager:ticketManager})
    }

    if(interaction.isButton() && interaction.customId.startsWith("tickets_close")){
        let channel_id = interaction.customId.split("_")[2];
        let user_id = interaction.customId.split("_")[3] || interaction.member.user.id;
        let newComponents:MessageButton[] = (interaction.message.components[0].components as MessageButton[]);
        newComponents.find(b => b.customId.startsWith("tickets_close")).disabled = true
        newComponents.forEach(b => b.disabled = true)
        cooldowns.removeTicketCount(user_id)
        console.log(cooldowns.store)
        interaction.update({
            "components":[
                {
                    "type":1,
                    "components":newComponents
                }
            ]
        }).then(() => {
            interaction.followUp({
                "embeds":[
                    {
                        "description":`<@${interaction.member.user.id}> has closed the ticket.`,
                        "color":"RED"
                    },
                    {
                        "description":"```Staff Ticket Controls```"
                    }
                ],
                "components":[
                    {
                        "type":1,
                        "components":[
                            {
                                "type":"BUTTON",
                                "label":"Delete Ticket Channel",
                                "customId":`tickets_deletechannel_${channel_id}`,
                                "style":"DANGER",
                                "disabled":!config.tickets.allowTicketDeletion
                            }
                        ]
                    }
                ]
            })
            .then(() => {
                let ticketChannel = client.channels.cache.get(`${channel_id as any as bigint}`) as TextChannel;
                ticketChannel.permissionOverwrites.delete(`${interaction.member.user.id}`, `Ticket closed by <@${interaction.member.user.id}>`)
                .then(() => {
                    ticketChannel.edit({
                        "parent":config.tickets.archivedCategory
                    }).then(() => {
                        ticketChannel.lockPermissions()
                        .catch(console.error)
                    })
                })
                .catch(err => {
                    console.error(err)
                    interaction.followUp({
                        "content":`:warning: Unable to delete channel. Check console for more info.`
                    })
                })
            })
            .catch(console.error)
        })
        .catch(console.error)
    }

    if(interaction.isButton() && interaction.customId.startsWith("tickets_deletechannel")){
        if(!config.users.whitelisted.includes(interaction.member?interaction.member.user.id:interaction.user.id))
            return interaction.reply({"content":"You aren't authorized to perform this action.", "ephemeral":true}).catch(console.error)
        let channel_id = interaction.customId.split("tickets_deletechannel_")[1]
        interaction.reply({
            "content":"Attempting to delete..."
        })
        .then(() => {
            let ticketChannel = client.channels.cache.get(`${channel_id as any as bigint}`) as TextChannel;
            if(ticketChannel.parentId != config.tickets.archivedCategory)
                return interaction.editReply({
                    "content":`Failed to delete channel. Reason: It is not under the <#${config.tickets.archivedCategory}> category.`
                }).catch(console.error)
            ticketChannel.delete().catch(console.error)
        })
        .catch(console.error)
    }

    if(interaction.isButton() && interaction.customId.startsWith("tickets_requeststaff")){
        let newComponents:MessageButton[] = (interaction.message.components[0].components as MessageButton[])
        newComponents.find(b => b.customId.startsWith("tickets_requeststaff")).disabled = true;
        interaction.update({
            "components":[
                {
                    "type":"ACTION_ROW",
                    "components":newComponents
                }
            ]
        }).then(() => {
            interaction.followUp({
                "content":`This ticket has requested attention. (${config.users.whitelisted.map(u => `<@${u}>`).join(", ")})`,
                "allowedMentions":{
                    "users":config.users.whitelisted
                }
            })
        })
        .catch(console.error)
    }
});

client.login(config.bot.token);