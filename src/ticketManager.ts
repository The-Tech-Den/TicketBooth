import { CategoryChannelResolvable, Client, GuildMember, Message, User } from 'discord.js';
import {readFileSync, writeFileSync, existsSync} from 'fs'
import configFile from '../config';

interface CreateTicketOptions {
    userID:string,
    guildID:`${bigint}`,
    topic:string,
    user:User,
    openedWith:"CONTEXT_MENU" | "BUTTON",
    message?:Message,
    reason:"NEW" | "MESSAGE" | "MESSAGE_W/USER"
}

interface SessionJson {
    [userID:string]:{
        status:boolean,
        channel_id:boolean
    }
}

class TicketManager {
    client:Client;
    config:Config;
    openTickets:{};
    constructor(DiscordClient:Client){
        this.client = DiscordClient;
        this.config = configFile;
        this.openTickets = {};
        if(!existsSync("./sessions.json"))
            writeFileSync("./sessions.json", JSON.stringify({}))
    };
    createTicketChannel(options:CreateTicketOptions){
        this.client.guilds.cache.get(options.guildID).channels.create(`ticket-${options.user.username}${options.user.discriminator}-${Math.random().toString(36).substring(2, 15)}`, {
            "parent":(this.config.tickets.openCategory as CategoryChannelResolvable),
            "topic":`Ticket for <@${options.userID}>: ${this.config.tickets.message}`,
            "reason":`Ticket created for ${options.userID}`
        }).then(channel => {
            channel.permissionOverwrites.create(`${options.userID as any as bigint}`, {
                "READ_MESSAGE_HISTORY":true,
                "VIEW_CHANNEL":true,
                "SEND_MESSAGES":true
            })
            .then(() => {
                channel.send({
                    "content":`<@${options.userID}>`,
                    "embeds":[
                        {
                            "description":this.config.tickets.topic,
                            "color":"WHITE"
                        },
                        {
                            "author":{
                                "name":`About ${options.user.tag}`,
                                "icon_url":options.user.displayAvatarURL({dynamic:true})
                            },
                            "description":`**ID**: ${options.user.id}\n**Account Created**: <t:${Math.floor(options.user.createdAt.getTime() / 1000)}>\n\n*This ticket was opened via a ${options.openedWith == "CONTEXT_MENU"?"Context Menu":"Button"}...*`
                        }
                    ],
                    "components":[
                        {
                            "type":1,
                            "components":[
                                {
                                    "type":"BUTTON",
                                    "style":"SECONDARY",
                                    "customId":`tickets_close_${channel.id}_${options.user.id}`,
                                    "label":"❌ Close Ticket"
                                },
                                {
                                    "type":"BUTTON",
                                    "style":"SECONDARY",
                                    "customId":`tickets_requeststaff_${channel.id}`,
                                    "label":"✋ Request Staff"
                                }
                            ]
                        }
                    ]
                }).catch(console.error)
            }).catch(console.error)
        })
    }
    createTicketChannelAboutMessage(options:CreateTicketOptions){
        this.client.guilds.cache.get(options.guildID).channels.create(`ticket-${options.user.username}${options.user.discriminator}-${Math.random().toString(36).substring(2, 15)}`, {
            "parent":(this.config.tickets.openCategory as CategoryChannelResolvable),
            "topic":`Ticket for <@${options.userID}>: This ticket was created from a message`,
            "reason":`Ticket created for ${options.userID}`
        }).then(channel => {
            channel.permissionOverwrites.create(`${options.userID as any as bigint}`, {
                "READ_MESSAGE_HISTORY":true,
                "VIEW_CHANNEL":true,
                "SEND_MESSAGES":true
            })
            .then(() => {
                channel.send({
                    "content":`<@${options.userID}>`,
                    "embeds":[
                        {
                            "description":`This ticket was created from a message...`,
                            "color":"WHITE"
                        },
                        {
                            "description":`${options.message.content?`>>> ${options.message.content}`:`*No message content*`}\n\n${options.message.attachments.map((m, i) => {return `[Attachment - ${m.name}](${m.url})`}).join("\n")}`,
                            "fields":[
                                {
                                    "name":"Message ID",
                                    "value":options.message.id
                                }
                            ]
                        },
                        {
                            "author":{
                                "name":`About ${options.message.author.username}#${options.message.author.discriminator} (Message Author)`,
                                "iconURL":`https://cdn.discordapp.com/avatars/${options.message.author.id}/${options.message.author.avatar}.png`
                            },
                            "description":`**ID**: ${options.message.author.id}`
                        },
                        {
                            "author":{
                                "name":`About ${options.user.tag} (Opened Ticket)`,
                                "icon_url":options.user.displayAvatarURL({dynamic:true})
                            },
                            "description":`**ID**: ${options.user.id}\n**Account Created**: <t:${Math.floor(options.user.createdAt.getTime() / 1000)}>\n\n*This ticket was opened via a ${options.openedWith == "CONTEXT_MENU"?"Context Menu":"Button"}...*`
                        }
                    ],
                    "components":[
                        {
                            "type":1,
                            "components":[
                                {
                                    "type":"BUTTON",
                                    "style":"SECONDARY",
                                    "customId":`tickets_close_${channel.id}_${options.user.id}`,
                                    "label":"❌ Close Ticket"
                                },
                                {
                                    "type":"BUTTON",
                                    "style":"SECONDARY",
                                    "customId":`tickets_requeststaff_${channel.id}`,
                                    "label":"✋ Request Staff"
                                }
                            ]
                        }
                    ]
                }).catch(console.error)
            }).catch(console.error)
        }).catch(console.error)
    }
    createTicketChannelAboutMessageWithUser(options:CreateTicketOptions){
        this.client.guilds.cache.get(options.guildID).channels.create(`ticket-${options.user.username}${options.user.discriminator}-${Math.random().toString(36).substring(2, 15)}`, {
            "parent":(this.config.tickets.openCategory as CategoryChannelResolvable),
            "topic":`Ticket for <@${options.userID}>: This ticket was created from a message`,
            "reason":`Ticket created for ${options.userID}`
        }).then(channel => {
            channel.permissionOverwrites.create(`${options.userID as any as bigint}`, {
                "READ_MESSAGE_HISTORY":true,
                "VIEW_CHANNEL":true,
                "SEND_MESSAGES":true
            })
            .then(() => {
                channel.permissionOverwrites.create(`${options.message.author.id as any as bigint}`, {
                    "READ_MESSAGE_HISTORY":true,
                    "VIEW_CHANNEL":true,
                    "SEND_MESSAGES":true
                }).then(() => {
                    channel.send({
                        "content":`<@${options.message.author.id}>, <@${options.userID}>`,
                        "embeds":[
                            {
                                "description":`This ticket was created from a message...`,
                                "color":"WHITE"
                            },
                            {
                                "description":`${options.message.content?`>>> ${options.message.content}`:`*No message content*`}\n\n${options.message.attachments.map((m, i) => {return `[Attachment - ${m.name}](${m.url})`}).join("\n")}`,
                                "fields":[
                                    {
                                        "name":"Message ID",
                                        "value":options.message.id
                                    }
                                ]
                            },
                            {
                                "author":{
                                    "name":`About ${options.message.author.username}#${options.message.author.discriminator} (Message Author)`,
                                    "iconURL":`https://cdn.discordapp.com/avatars/${options.message.author.id}/${options.message.author.avatar}.png`
                                },
                                "description":`**ID**: ${options.message.author.id}`
                            },
                            {
                                "author":{
                                    "name":`About ${options.user.tag} (Opened Ticket)`,
                                    "icon_url":options.user.displayAvatarURL({dynamic:true})
                                },
                                "description":`**ID**: ${options.user.id}\n**Account Created**: <t:${Math.floor(options.user.createdAt.getTime() / 1000)}>\n\n*This ticket was opened via a ${options.openedWith == "CONTEXT_MENU"?"Context Menu":"Button"}...*`
                            }
                        ],
                        "components":[
                            {
                                "type":1,
                                "components":[
                                    {
                                        "type":"BUTTON",
                                        "style":"SECONDARY",
                                        "customId":`tickets_close_${channel.id}_${options.message.author.id}`,
                                        "label":"❌ Close Ticket"
                                    },
                                    {
                                        "type":"BUTTON",
                                        "style":"SECONDARY",
                                        "customId":`tickets_requeststaff_${channel.id}`,
                                        "label":"✋ Request Staff"
                                    }
                                ]
                            }
                        ]
                    }).catch(console.error)
                }).catch(console.error)
            }).catch(console.error)
        }).catch(console.error)
    }
    check(userID:string){
        let json = JSON.parse(readFileSync("./sessions.json").toString());
        return json[userID]?true:false;
    };
    create(options:CreateTicketOptions){
        return new Promise((resolve, reject) => {
            let json:SessionJson = JSON.parse(readFileSync("./sessions.json").toString());
            if(json[options.userID] && json[options.userID].status == true)
                return resolve(false);
            if(options.reason == "NEW"){
                this.createTicketChannel({
                    guildID:options.guildID,
                    userID:options.userID,
                    topic:options.topic,
                    user:options.user,
                    openedWith:options.openedWith,
                    reason:options.reason
                })
            }
            if(options.reason == "MESSAGE"){
                this.createTicketChannelAboutMessage({
                    guildID:options.guildID,
                    userID:options.userID,
                    topic:options.topic,
                    user:options.user,
                    openedWith:options.openedWith,
                    reason:options.reason,
                    message:options.message
                })
            }
            if(options.reason == "MESSAGE_W/USER"){
                this.createTicketChannelAboutMessageWithUser({
                    guildID:options.guildID,
                    userID:options.userID,
                    topic:options.topic,
                    user:options.user,
                    openedWith:options.openedWith,
                    reason:options.reason,
                    message:options.message
                })
            }
        })
    }
};

export default TicketManager;