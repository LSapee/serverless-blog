import {Connection,RowDataPacket,OkPacket ,createConnection} from "mysql2/promise"
import {Post, PostListItem} from "./models";

const connectionPromise = createConnection({
    host: process.env.IS_OFFLINE ? "127.0.0.1" : process.env.MYSQL_HOST,
    user: process.env.IS_OFFLINE ? "root": process.env.MYSQL_ROOT_USER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: 'blog',
})

async function doQuery<R>(dbWork:(connection:Connection)=>Promise<R>):Promise<R>{
    const connection = await connectionPromise;
    return dbWork(connection);
}
export async function insert(post:Post):Promise<boolean>{
    try{
        await doQuery((connection)=>
            connection.execute(
                `INSERT INTO post (title,content,created,modified) VALUES (?,?,?,NULL)`,
                [post.title,post.content,post.created]
            ));
    }catch(e){
        if(/Duplicate entry/.test(e.message)) return false;
        throw e;
    }
    return true;
}

export async function select(title:string):Promise<Post|null>{
    const [rows] = await doQuery((connection)=>
    connection.execute<RowDataPacket[]>(`SELECT * FROM post WHERE title = ?`,[title,])
    );
    const [row] = rows ??[];
    if(!row) return null;
    return {
        title:row['title'],
        content:row['content'],
        created:row['created'],
        modified:row['modified']
    };
}

export async function update(oldTitle:string,post: Omit<Post,"created">):Promise<boolean>{
    const [ok] = await doQuery((connection)=>
    connection.execute<OkPacket>(
        `UPDATE post SET title = ? , content =? , modified = ? , WHERE title =?`,
        [post.title,post.content,post.modified,oldTitle]
    ));
    return ok.affectedRows ===1;
}

export async function remove(title:string): Promise<void>{
    await doQuery((connection)=>
    connection.execute(`DELETE FROM post WHERE title = ?`,[title]));
}

export async function list(): Promise<PostListItem[]>{
    const [rows] = await doQuery((connection)=>
    connection.execute<RowDataPacket[]>(
        `SELECT title,created FROM post ORDER BY created DESC`
    ));
    return (rows ?? []).map((row)=>({
        title:row['title'],
        created:row['created'],
    }));

}