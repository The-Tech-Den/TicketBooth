import {CtxCommand} from '../classes';
import { GuildMemberRoleManager, Message, User } from 'discord.js';
import config from '../../config';
export default new CtxCommand({
    commandName:"Ticket w/msg",
    execute({interaction, cooldowns, ticketManager}){
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
                openedWith:"CONTEXT_MENU",
                reason:"MESSAGE",
                message:interaction.options.data[0].message as Message
            })  
        })
        .catch(console.error)
    }
})