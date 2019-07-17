const Web3 = require("pweb3");


const MongoClient = require('mongodb').MongoClient;
var holder  = 0 ;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:6969/pchain"));
const url = "mongodb://localhost:27017";

async function initIndex() {

    const client  = await MongoClient.connect(url, {useNewUrlParser: true}).catch(error =>
        console.log("error ", error));

    const db = await client.db('piscan');
    const collection = await db.collection("forIndex");

    await collection.insertOne({index: 0});

   await client.close();

}

async function setIndex(oldvalue, newvalue) {

    const client  = await MongoClient.connect(url, {useNewUrlParser: true}).catch(error =>
        console.log("error ", error));

    const db = await client.db('piscan');

    const collection = await db.collection("forIndex");
   // const old  =await  collection.find({},{index:1 , _id:0}).toArray();



    console.log(`old value ${oldvalue}  new value ${newvalue}`) ;
    const query = {index: oldvalue};
    const newQuery = {$set: {index: newvalue}};


    try {

        console.log("perform update query") ;

        await collection.update(query, newQuery);

    } catch (e) {

        console.log("error ", e);
        throw new Error(e)

    }finally {

        await  client.close() ;

    }


}

async function getIndex() {

    const client  = await MongoClient.connect(url, {useNewUrlParser: true}).catch(error =>
        console.log("error ", error));

    const db = await client.db('piscan');
    try {

        const collection = await db.collection("forIndex");

        const index = await collection.findOne().catch(e=>console.log(e));

        if (index === null) {
            await initIndex().catch(e=>console.log(e));

        }

        if (index.index === 0) {
            return 0;
        } else {
            return index.index ;

        }


    } catch (e) {

        throw  new Error(e);


    }finally {

      await  client.close() ;

    }

}


async function getTransactions() {


    const client  = await MongoClient.connect(url, {useNewUrlParser: true}).catch(error =>
        console.log("error ", error));

    try {
        const db = await client.db('piscan');

        const collection = await db.collection("blocksWithTransactions");

        const countBlocks = await collection.find().count({});

        const q = {projection: {number: 1, _id: 0}};

        const h = await getIndex();

        console.log("holder : ", h);

        const cursor = await collection.find({}, q).skip(h).limit(1).toArray().catch(e => console.log(e));

        if(cursor[0] === undefined)
        {
            console.log('synced transactions ')
            return null ;
        }

            console.log(cursor[0].number);

            const count = await web3.pi.getBlockTransactionCount(cursor[0].number);


            for (let i = 0; i < count; i++) {

                const x = await web3.pi.getTransactionFromBlock(cursor[0].number, i);

                await saveInDatabase([x], "transactions");

            }

        return countBlocks ;

    }
    catch (e) {
        throw  new Error(e) ;

    }

}

async function saveInDatabase(data, coll) {

    const client  = await MongoClient.connect(url, {useNewUrlParser: true}).catch(error =>
        console.log("error ", error));

    const db = await client.db('piscan');



    try {

        if (data.length !== 0) {

            const collection = await db.collection(coll);

            const inserted = await collection.insertMany(data);

            console.log(`inserted in ${coll} : ${inserted.insertedCount}`);

        }
    }catch (e) {

        throw  new Error(e) ;

    }finally {

        await  client.close();
    }
}

//example of use
// const interval = setInterval(async ()=>{
//
//     const result =  await  getTransactions() ;
//     const old =  await  getIndex() ;
//
//
//
//     if(result !== null )
//         await  setIndex(old , old+1 ) ;
//
//
// } , 3000);




module.exports ={getTransactions} ;

