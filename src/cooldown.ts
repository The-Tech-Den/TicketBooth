interface UserCooldownStore {
    timer:any,
    openTickets:number
};

interface CooldownUserStore {
    [userID:string]:UserCooldownStore
};

class CooldownStore {
    store:CooldownUserStore;
    maxTickets:number;
    constructor(maxTickets:number){
        this.store = {};
        this.maxTickets = maxTickets;
    };
    /** Create a store */
    start(userID:string){
        this.store[userID] = {
            "openTickets":0,
            "timer":setTimeout(() => {
                this.store[userID] = undefined;
            }, 900000)
        }
    }
    addTicketCount(userID:string){
        this.resetTimer(userID);
        this.store[userID].openTickets = this.store[userID].openTickets+1;
    }
    removeTicketCount(userID:string){
        if(!this.store[userID])
            return false;
        this.resetTimer(userID);
        if(this.store[userID].openTickets-1 < 0)
            return false;
        this.store[userID].openTickets = this.store[userID].openTickets-1;
    }
    resetTimer(userID:string){
        // clearTimeout(this.store[userID].timer)
        // this.store[userID].timer = setTimeout(() => {
        //     this.store[userID] = undefined;
        // }, 900000)
    }
    underCooldown(userID:string){
        return this.store[userID] && this.store[userID].openTickets >= this.maxTickets?true:false
    }
    storeExists(userID:string){
        return this.store[userID]?true:false
    }
    cancel(userID:string){
        clearTimeout(this.store[userID].timer)
        this.store[userID] = undefined;
    };
};

export default CooldownStore;