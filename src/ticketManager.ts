import { CategoryChannelResolvable, Client, User } from 'discord.js';
import {readFileSync, writeFileSync, existsSync} from 'fs'
import configFile from '../config';

interface CreateTicketOptions {
    userID:string,
    guildID:`${bigint}`,
    topic:string,
    user:User
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
    constructor(DiscordClient:Client){
        this.client = DiscordClient;
        this.config = configFile;
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
                    "content":`<@${options.userID}>\n${this.config.tickets.topic}`,
                    "components":[
                        {
                            "type":1,
                            "components":[
                                {
                                    "type":"BUTTON",
                                    "style":"SECONDARY",
                                    "customId":`tickets_close_${channel.id}`,
                                    "label":"❌ Close Ticket"
                                }
                            ]
                        }
                    ]
                })
            })
            .catch(console.error)
        })
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
            this.createTicketChannel({
                guildID:options.guildID,
                userID:options.userID,
                topic:options.topic,
                user:options.user
            })
        })
    }
};

export default TicketManager;