interface Config {
    /** Settings related to tickets */
    tickets:{
        /** Inital message to be shown on /listen command */
        message:string,
        /** Category for open tickets to go */
        openCategory:string,
        /** Category for closed tickets to go */
        archivedCategory:string,
        /** Server ID of where tickets should be created */
        guild_id:`${bigint}`,
        /** Message to be sent in a newly created ticket channel */
        topic:string
    },
    /** Settings related to users */
    users:{
        /** Discord User IDs of whitelisted users who can post a start ticket message */
        whitelisted:string[]
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