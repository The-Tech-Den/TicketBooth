import r, { Connection } from 'rethinkdb'

interface DbHandlerOptions {
    host:string,
    port:number,
    username?:string,
    password?:string,
    connection?:Connection
}
class DbHandler {
    host:string;
    port:number;
    username:string;
    password:string;
    connection:Connection;
    constructor(options:DbHandlerOptions){
        this.host = options.host;
        this.port = options.port;
        this.username = options.username;
        this.password = options.password;
        this.connection = options.connection;
    }
    connect(){
        return new Promise<Connection>((resolve, reject) => {
            r.connect({ host: this.host, port: this.port }, function(err, conn) {
                if(err)
                    return reject(err);
                resolve(conn);
            });
        });
    }
}

export default DbHandler;