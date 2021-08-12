import { ButtonInteraction, ContextMenuInteraction } from "discord.js";
import CooldownStore from './cooldown';
import TicketManager from "./ticketManager";

export class CtxCommand {
    constructor(options:CtxCommand){
        this.commandName = options.commandName;
        this.execute = options.execute
    }
    /** CTX Button Name */
    commandName:string
    execute(options:{cooldowns:CooldownStore, interaction:ContextMenuInteraction, ticketManager:TicketManager}){}
}

export class ButtonCommand {
    constructor(options:ButtonCommand){
        this.customID = options.customID;
        this.execute = options.execute
    }
    /** Button Custom ID */
    customID:string
    execute(options:{cooldowns:CooldownStore, interaction:ButtonInteraction, ticketManager:TicketManager}){}
}