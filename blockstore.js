//rewrite with async/await
//this is the stable version
//this file isn't complete yet

const Web3 = require("pweb3");
const MongoClient = require('mongodb').MongoClient;

class PiScan {

    constructor() {

        this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:6969/pchain"));
        this.url = "mongodb://localhost:27017";
        this.dbName = 'piscan';
        this.blockCollection = 'blocks1';
        this.transactionsCollection = 'transactions';
        this.blockWithTransactions = 'blocksWithTransactions';
        this.theNumberOfBlockToRead = 1000;

    }

    async initDb() {

        this.client = await MongoClient.connect(this.url, {useNewUrlParser: true}).catch(e =>

            throw new Error(e));


        try {

            this.db = await this.client.db(this.dbName);

        } catch (e) {

            throw  new Error(e);

        }

    }

    async closeDb() {

        if (this.client) {

            try {
                await this.client.close();
            } catch (e) {

                throw  new Error(e);

            }
        }
    }

    async getLastNumber(col) {

        try {

            const collection = await this.db.collection(col);

            const res = await collection.find().limit(1).sort({$natural: -1}).toArray();


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

        if (data.length === 0) return;


        try {

            const collection = await this.db.collection(coll);

            const inserted = await collection.insertMany(data);


            console.log(`inserted in ${coll} : ${inserted.insertedCount}`);


        } catch (e) {

            throw new Error(e);


        }


    }

    async getBlockInfo() {

        let last = await this.getLastNumber(this.blockCollection);

        console.log("the last block number is :  ", last);

        for (let i = last; i < (last + this.theNumberOfBlockToRead); i++) {

            const blockInfo = await this.web3.pi.getBlock(i);


            for (let j = 0; j < sortedData.length; j++) {

                if (sortedData[i].transactions.length !== 0) {
                    await includeTransactionsBlock.push(sortedData[i]);

                }

            }


        }


        const sortedData = [];
        const includeTransactionsBlock = [];


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


}
