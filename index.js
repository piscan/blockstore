const Web3 = require("pweb3");
const MongoClient = require('mongodb').MongoClient;

export class BlockStore {

    constructor() {

        this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:6969/pchain"));
        this.url = "mongodb://localhost:27017";
        this.dbName = 'piscan';
        this.blockCollection = 'blocks1';
        this.transactionsCollection = 'transactions';
        this.blockWithTransactions = 'blocksWithTransactions';
        this.theNumberOfBlockToRead = 1000;

    }

    //region  init and close DB

    async initDb() {

        this.client = await MongoClient.connect(this.url, {useNewUrlParser: true}).catch(error =>
            console.log("error ", error));

        try {

            this.db = await this.client.db(this.dbName);

        } catch (e) {

            throw  new Error(e);


        }

    }

    async closeDb() {

        if (this.client) {
            await this.client.close();

        }
    }

    //endregion


    //region  block

    async getLastNumber(coll) {

        try {


            let collection = await this.db.collection(coll);

            let res = await collection.find().limit(1).sort({$natural: -1}).toArray();


            if (res.length === 0) {

                return 0;

            } else {

                return (res[0].number + 1);

            }

        } catch (e) {

            throw new Error(e)

        }


    }

    async saveInDatabase(data, coll) {


        if (data.length !== 0) {

            const collection = await this.db.collection(coll);

            const inserted = await collection.insertMany(data);

            if (inserted.insertedCount < 1000) {
                console.log("breaking !!!!!!!!!")
                return;
            }
            console.log(`inserted in ${coll} : ${inserted.insertedCount}`);

            //  return inserted.insertedCount ;


        }
    }

    async getBlockInfo() {

        const sortedData = [];
        const includeTransactionsBlock = [];


        let last = await this.getLastNumber(this.blockCollection);

        console.log("the last block number is :  ", last);


        for (let i = last; i < (last + this.theNumberOfBlockToRead); i++) {


            const x = this.web3.pi.getBlock(i, async (e, r) => {

                if (e) throw  e;

                await sortedData.push(r);


            });

        }


        setTimeout(async () => {

            sortedData.sort((a, b) => {
                return (a.number - b.number)
            });


            for (let i = 0; i < sortedData.length; i++) {

                if (sortedData[i].transactions.length !== 0) {
                    await includeTransactionsBlock.push(sortedData[i]);

                }

            }


            await this.saveInDatabase(sortedData, this.blockCollection);
            await this.saveInDatabase(includeTransactionsBlock, this.blockWithTransactions);


        }, 500)

    }

    //endregion


    //region  transactions

    async getTransactions() {

        const collection = await this.db.collection(this.blockWithTransactions);

        const index = await this.getIndex();

        for (let i = index; i < index + 2; i++) {


            if (index === "undefined ") {
                console.log("transactions synced ");
                return;
            }

            const data = await collection.find({}, {projection: {number: 1, _id: 0}}).skip(i).limit(1).toArray();

            if (data.length === 0) {
                console.log("data is null ");
                return;
            }
            const count = await this.web3.pi.getBlockTransactionCount(data[0].number);


            for (let i = 0; i < count; i++) {

                const x = await this.web3.pi.getTransactionFromBlock(data[0].number, i);


                await this.saveInDatabase([x], this.transactionsCollection);

            }

            await this.setIndex(index, i);

        }

    }

    async initIndex() {

        const collection = await this.db.collection("forIndex");

        await collection.insertOne({index: 0});

    }

    async setIndex(oldvalue, newvalue) {

        const collection = await this.db.collection("forIndex");

        const query = {index: oldvalue};
        const newQuery = {$set: {index: newvalue}};


        try {

            await collection.updateOne(query, newQuery);

        } catch (e) {

            console.log("error ", e);

        }


    }

    async getIndex() {

        try {

            const collection = await this.db.collection("forIndex");

            const index = await collection.findOne();


            console.log("idnex :  ", index.index);

            if (index.index === 0) {
                return 0;
            } else {
                return index.index + 1;

            }


        } catch (e) {

            throw  new Error(e);


        }

    }

    //endregion


    async isOkData() {

        let blockNumber = [];

        const collection = await this.db.collection(this.blockCollection);


        for (let i = 0; i <= 159000; i++) {


            const index1 = await collection.find({number: i}).toArray();

            //console.log(i )  ;

            if (index1[0].number === "undefined") {
                console.log(i);
                return;

            }
            await blockNumber.push(index1[0].number);

        }


        for (let i = 0; i <= blockNumber.length; i++) {
            if ((blockNumber[i] - blockNumber[i - 1]) > 1) {

                console.log("block number breaking :", blockNumber);
                break;

            }
        }

        console.log("finished ");

    }


}

// this is a way to use BlockStore Class
async function run() {

    const blockStore = new BlockStore();
    await blockStore.initDb();
    await blockStore.initIndex();


    setInterval(async () => {

        await piScan.getBlockInfo();


    }, 2000);

    await piScan.closeDb();


}












