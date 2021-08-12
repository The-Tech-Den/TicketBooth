import {CtxCommand} from '../classes';
import { GuildMemberRoleManager, Message, User } from 'discord.js';
import config from '../../config';
export default new CtxCommand({
    commandName:"Ticket w/msg&user",
    execute({interaction, cooldowns, ticketManager}){
        let messageClicked = interaction.options.data[0].message
        if(!config.users.whitelisted.includes(interaction.member.user.id))
        return interaction.reply({
            "content":"Only whitelisted staff members may use this feature",
            "ephemeral":true
        }).catch(console.error);
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
        if(cooldowns.underCooldown(messageClicked.author.id.toString()))
            return interaction.reply({
                "content":config.tickets.maxTicketsMessage || `This user has ${config.tickets.maxTickets == 1?"already opened a ticket":`reached the max amount of tickets they can have open (${config.tickets.maxTickets})`}. Please use their existing ${config.tickets.maxTickets == 1?"ticket":"tickets"}.`,
                "ephemeral":true
            }).catch(console.error);
        if(!cooldowns.storeExists(messageClicked.author.id.toString()))
            cooldowns.start(messageClicked.author.id.toString());
        cooldowns.addTicketCount(messageClicked.author.id.toString());
        interaction.reply({
            "content":config.tickets.ticketOpenedMessage?.replace(/\!{(REMAINING)\}!/g, `${config.tickets.maxTickets-cooldowns.store[messageClicked.author.id].openTickets}`).toString() || `Your ticket is being created... ${cooldowns.store[messageClicked.author.id].openTickets >= config.tickets.maxTickets?"This is the last ticket you can create. Close existing tickets to create more.":`You can create ${config.tickets.maxTickets-cooldowns.store[messageClicked.author.id].openTickets} more tickets after this.`}`,
            "ephemeral":true
        }).then(() => {
            ticketManager.create({
                guildID:`${BigInt(interaction.guildId)}`,
                userID:interaction.member.user.id,
                topic:config.tickets.topic,
                user:interaction.member.user as User,
                openedWith:"CONTEXT_MENU",
                reason:"MESSAGE_W/USER",
                message:interaction.options.data[0].message as Message
            })  
        })
        .catch(console.error)
    }
})