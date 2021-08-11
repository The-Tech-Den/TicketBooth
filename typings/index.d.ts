interface Config {
    /** Settings related to tickets */
    tickets:{
        /** Inital message to be shown on /listen command */
        message:string,
        /** Message to be sent in a newly created ticket channel */
        topic:string,

        /** Category for open tickets to go */
        openCategory:string,
        /** Category for closed tickets to go */
        archivedCategory:string,

        /** Server ID of where tickets should be created */
        guild_id:string,

        /** Allow ticket to be deleted when closed. (Does not prevent being deleted via Discord GUI) */
        allowTicketDeletion:boolean,
        
        /** Max amount of tickets that can be opened at a time */
        maxTickets:number,
        /** Message to be shown when max amount of tickets reached */
        maxTicketsMessage?:string,
        /** Message to be shown when a ticket is being opened - "!{REMAINING}!" will show the remaining tickets that can be opened. */
        ticketOpenedMessage?:string
    },
    /** Settings related to users */
    users:{
        /** Discord User IDs of whitelisted users who can post a start ticket message */
        whitelisted:string[],
        /** Discord Role ID to block */
        blacklistedRole:string
    },
    /** Settings for the bot developer */
    developer?:{
        /** Whether or not these settings take effect */
        dev_mode:boolean,
        /** Guild ID to create */
        guild_id:`${bigint}`,
        bypassFlagCheck:boolean
    },
    /** Settings related to the Discord bot */
    bot:{
        /** Discord bot token */
        token:string
    }
}