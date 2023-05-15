import {Post, PostListItem} from "./models";
import {DynamoDB} from "aws-sdk";
import {deepEqual} from "fast-equals";


// const ddb = new DynamoDB();
// const TableName = "post";

// async function insert(post:Post){
//     return ddb
//         .putItem({
//             TableName,
//             Item:{
//                 title:{S:post.title},
//                 content:{S:post.content},
//                 created:{S:post.created},
//             }
//         })
//         .promise();
// }

const db = !process.env.IS_OFFLINE
    ? new DynamoDB.DocumentClient()
    : new DynamoDB.DocumentClient({
        region: "localhost",
        endpoint: "http://127.0.0.1:8000",
    });
const TableName = "post";

// async function insert(post:Post){
//     return db.put({TableName,Item:post}).promise();
// }

async function createItem<T>(item:T):Promise<void>{
    await db.put({
        TableName,
        Item:item,
        ConditionExpression: "attribute_not_exists(title)",
    })
        .promise();
}

export async function insert(post:Post):Promise<boolean>{
    try{
        await createItem(post);
    }catch(error:any){
        if(error.code==="ConditionalCheckFailedException"||error.retryable){
            return false;
        }
        throw error;
    }
    await modifyPostEntries((entries)=>
        entries.concat({title:post.title,created:post.created})
    );
    return true;
}

export async function select(title:string):Promise<Post|null>{
    const postData = await db.get({TableName,Key:{title}}).promise();
    return (postData.Item as Post) ?? null;
}
export async function update(oldTitle:string,post:Omit<Post,"created">):Promise<boolean>{
    if(oldTitle ===post.title){
        await db.update({
            TableName,
            Key:{title:post.title},
            UpdateExpression:"SET #c =:c, #m = :m",
            ExpressionAttributeNames:{"#c":"content","#m":"modified"},
            ExpressionAttributeValues:{
                ":c":post.content,
                ":m":post.modified,
            }
        }).promise();
    }else{
        const oldPost = await select(oldTitle);
        // 예전글 제목으로 DB조회 없을시 잘못된 조회
        if(oldPost===null) return false;
        const maybeNewExisting = await select(post.title);
        // 새 글 제목 있으면
        if(maybeNewExisting!==null)return false;

        const newPost = {...oldPost,...post};
        try{
            await db.transactWrite({
                TransactItems: [
                    {
                        Delete:{
                            TableName,
                            Key:{title:oldTitle},
                            ConditionExpression:"attribute_exists(title)",
                        },
                    },
                    {
                        Put:{
                            TableName,
                            Item:newPost,
                            ConditionExpression:'attribute_not_exists(title)',
                        },
                    },
                ],
            }).promise();
        }catch(e){
            if(e.code === "ConditionalCheckFailedException"||e.retryable) return false;
        }
        await modifyPostEntries((entries)=>
        entries
            .filter((entry)=>entry.title !== oldTitle)
            .concat({title:newPost.title,created:newPost.created}));
        return true;
    }



}
export async function remove(title:string): Promise<void>{
    await db.delete({TableName,Key:{title}}).promise();
    await modifyPostEntries((entries=>entries.filter((entry)=>entry.title!==title)));
}

const listTitle = "$_";
interface Posts{
    title: typeof listTitle;
    version: number;
    entries:PostListItem[];
}

async function fetchPosts(): Promise<Posts>{
    const postsObject = await db
        .get({TableName,Key:{title:listTitle}}).promise();
    return ((postsObject.Item as Posts) ?? {title: listTitle, version:0, entries:[]});
}

export async function list(): Promise<PostListItem[]>{
    return (await fetchPosts()).entries;
}

async function updateItem<T extends{version : number}>(
    item:T
): Promise<void>{
    await db
        .put({
            TableName,
            Item:item,
            ConditionExpression:"version = :version",
            ExpressionAttributeValues : {":version":item.version-1},
        }).promise();
}

const maxRetryCount =10;

async function modifyPostEntries(modify:(entries : PostListItem[])=>PostListItem[]): Promise<void>{
    for(let i=0; i<maxRetryCount; i++){
        const posts = await fetchPosts();
        const entries = modify(posts.entries).sort((a,b)=>
        b.created.localeCompare(a.created));
        try{
            if(!deepEqual(posts.entries, entries)){
            const newPosts ={...posts,version:posts.version +1, entries};
            if(posts.version===0) await createItem(newPosts);
            else await updateItem(newPosts);
            }
            return ;
        }catch (e){
            if(e.code==="ConditionalCheckFailedException"||e.retryable) continue;
            throw e;
        }
    }
    throw new Error("글 목록 수정이 실패했습니다.");

}