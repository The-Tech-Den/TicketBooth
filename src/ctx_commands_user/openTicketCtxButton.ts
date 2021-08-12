import { GuildMemberRoleManager, User } from "discord.js";
import config from "../../config";
import { CtxCommand } from "../classes";
export default new CtxCommand({
    commandName:"Ticket w/user",
    execute({interaction, cooldowns, ticketManager}){
        let userClicked = interaction.options.data[0]
        if(!config.users.whitelisted.includes(interaction.member.user.id))
            return interaction.reply({
                "content":"Only whitelisted staff members may use this feature",
                "ephemeral":true
            }).catch(console.error);
        if((userClicked.member.roles as GuildMemberRoleManager).cache.has(config.users.blacklistedRole) && config.users.whitelisted.includes(userClicked.value.toString()))
            return interaction.reply({
                "content":":warning: **Conflicting Permissions**: This user is whitelisted and have the blacklisted role. Please either fix their roles, or change bot settings.",
                "ephemeral":true
            }).catch(console.error);
        if((userClicked.member.roles as GuildMemberRoleManager).cache.has(config.users.blacklistedRole))
            return interaction.reply({
                "content":"This user is blacklisted of creating new tickets. Contact server staff for more information.",
                "ephemeral":true
            }).catch(console.error);
        if(cooldowns.underCooldown(userClicked.value.toString()))
            return interaction.reply({
                "content":config.tickets.maxTicketsMessage || `This user has ${config.tickets.maxTickets == 1?"already opened a ticket":`reached the max amount of tickets they can have open (${config.tickets.maxTickets})`}. Please use their existing ${config.tickets.maxTickets == 1?"ticket":"tickets"}.`,
                "ephemeral":true
            }).catch(console.error);
        if(!cooldowns.storeExists(userClicked.value.toString()))
            cooldowns.start(userClicked.value.toString());
        cooldowns.addTicketCount(userClicked.value.toString());
        interaction.reply({
            "content":config.tickets.ticketOpenedMessage?.replace(/\!{(REMAINING)\}!/g, `${config.tickets.maxTickets-cooldowns.store[userClicked.value.toString()].openTickets}`).toString() || `Their ticket is being created... ${cooldowns.store[userClicked.value.toString()].openTickets >= config.tickets.maxTickets?"This is the last ticket they can have create. Close existing tickets to create more.":`They can create ${config.tickets.maxTickets-cooldowns.store[userClicked.value.toString()].openTickets} more tickets after this.`}`,
            "ephemeral":true
        }).then(() => {
            ticketManager.create({
                guildID:`${BigInt(interaction.guildId)}`,
                userID:userClicked.value.toString(),
                topic:config.tickets.topic,
                user:interaction.options.data[0].user as User,
                openedWith:"CONTEXT_MENU",
                reason:"NEW"
            })  
        })
        .catch(console.error)
    }
})